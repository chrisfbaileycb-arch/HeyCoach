import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { getPersonaById } from '@/constants/personas';
import { getCoachResponse } from '@/services/coachService';
import { parseIntent } from '@/services/intentParser';

export interface Session {
  id: string;
  title: string;
  scheduledAt: string;
  category: 'morning' | 'midday' | 'evening';
  type: 'alarm' | 'event' | 'session';
  status: 'pending' | 'completed';
  snoozeCount: number;
  coachMessage: string;
  linkedGoalId?: string;
  durationMinutes?: number;
}

export interface Goal {
  id: string;
  title: string;
  lifeArea: string;
  horizon: 'day' | 'week' | 'month';
  status: 'pending' | 'completed';
  successMetric?: string;
  linkedSessionIds: string[];
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  timestamp: Date;
}

export interface AppContextType {
  sessions: Session[];
  goals: Goal[];
  activePersonaId: string;
  intensity: number;
  voiceHistory: VoiceMessage[];
  setActivePersona: (id: string) => void;
  setIntensity: (level: number) => void;
  addSession: (s: Omit<Session, 'id' | 'snoozeCount' | 'status'>) => void;
  completeSession: (id: string) => void;
  snoozeSession: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id' | 'linkedSessionIds' | 'status'>) => void;
  sendVoiceCommand: (text: string) => string;
  clearVoiceHistory: () => void;
  getTodaySessions: () => Session[];
  getTodayStats: () => { total: number; completed: number; pending: number; goalsNeedingTime: number };
  getGreeting: () => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const now = new Date();
const h = (hour: number) =>
  new Date(new Date(now).setHours(hour, 0, 0, 0)).toISOString();

const INITIAL_SESSIONS: Session[] = [
  {
    id: 's1', title: 'Morning activation', scheduledAt: h(7),
    category: 'morning', type: 'alarm', status: 'completed',
    snoozeCount: 0, coachMessage: 'Feet on the floor. Own the first hour.', durationMinutes: 30,
  },
  {
    id: 's2', title: 'Focus block: Ship v1', scheduledAt: h(10),
    category: 'morning', type: 'session', status: 'pending',
    snoozeCount: 0,
    coachMessage: 'This block exists to move the release forward. Land one reviewable change.',
    linkedGoalId: 'g1', durationMinutes: 90,
  },
  {
    id: 's3', title: 'Team standup', scheduledAt: h(14),
    category: 'midday', type: 'event', status: 'pending',
    snoozeCount: 0, coachMessage: 'Say the blocker out loud. Clear it and move.', durationMinutes: 15,
  },
  {
    id: 's4', title: 'Strength session', scheduledAt: h(18),
    category: 'evening', type: 'session', status: 'pending',
    snoozeCount: 0,
    coachMessage: 'Third rep of the week. Show up even if the energy is average.',
    linkedGoalId: 'g2', durationMinutes: 60,
  },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: 'g1', title: 'Ship v1 mobile app', lifeArea: 'projects',
    horizon: 'week', status: 'pending',
    successMetric: 'App submitted to both stores', linkedSessionIds: ['s2'],
  },
  {
    id: 'g2', title: 'Strength training 3x', lifeArea: 'health',
    horizon: 'week', status: 'pending',
    successMetric: 'Three completed sessions logged', linkedSessionIds: ['s4'],
  },
  {
    id: 'g3', title: 'Read systems design daily', lifeArea: 'personal_development',
    horizon: 'day', status: 'pending',
    successMetric: 'Chapter notes written', linkedSessionIds: [],
  },
  {
    id: 'g4', title: 'Q3 client roadmap', lifeArea: 'work',
    horizon: 'month', status: 'pending',
    successMetric: 'Roadmap reviewed with stakeholders', linkedSessionIds: [],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [activePersonaId, setActivePersonaId] = useState('coach_core');
  const [intensity, setIntensityState] = useState(3);
  const [voiceHistory, setVoiceHistory] = useState<VoiceMessage[]>([]);

  const setActivePersona = useCallback((id: string) => {
    setActivePersonaId(id);
    const persona = getPersonaById(id);
    setIntensityState(persona.defaultIntensity);
  }, []);

  const setIntensity = useCallback((level: number) => {
    setIntensityState(Math.max(1, Math.min(5, level)));
  }, []);

  const getTodaySessions = useCallback(() => {
    const todayStr = new Date().toDateString();
    return sessions
      .filter(s => new Date(s.scheduledAt).toDateString() === todayStr)
      .sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
  }, [sessions]);

  const addSession = useCallback(
    (session: Omit<Session, 'id' | 'snoozeCount' | 'status'>) => {
      const newSession: Session = {
        ...session, id: `s${Date.now()}`, snoozeCount: 0, status: 'pending',
      };
      setSessions(prev =>
        [...prev, newSession].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )
      );
    },
    []
  );

  const completeSession = useCallback((id: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'completed' as const } : s))
    );
  }, []);

  const snoozeSession = useCallback((id: string) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          snoozeCount: s.snoozeCount + 1,
          scheduledAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
      })
    );
  }, []);

  const addGoal = useCallback(
    (goal: Omit<Goal, 'id' | 'linkedSessionIds' | 'status'>) => {
      setGoals(prev => [
        ...prev,
        { ...goal, id: `g${Date.now()}`, status: 'pending', linkedSessionIds: [] },
      ]);
    },
    []
  );

  const sendVoiceCommand = useCallback(
    (text: string): string => {
      const userMsg: VoiceMessage = {
        id: `vm${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date(),
      };
      const intent = parseIntent(text);
      const todaySessions = sessions.filter(
        s => new Date(s.scheduledAt).toDateString() === new Date().toDateString()
      );
      const coachText = getCoachResponse(intent, {
        sessions: todaySessions,
        goals,
        personaId: activePersonaId,
        intensity,
      });
      const coachMsg: VoiceMessage = {
        id: `vm${Date.now() + 1}`,
        role: 'coach',
        text: coachText,
        timestamp: new Date(),
      };
      setVoiceHistory(prev => [...prev.slice(-30), userMsg, coachMsg]);
      return coachText;
    },
    [sessions, goals, activePersonaId, intensity]
  );

  const clearVoiceHistory = useCallback(() => setVoiceHistory([]), []);

  const getTodayStats = useCallback(() => {
    const today = getTodaySessions();
    const goalsNeedingTime = goals.filter(
      g => g.status !== 'completed' && g.linkedSessionIds.length === 0
    ).length;
    return {
      total: today.length,
      completed: today.filter(s => s.status === 'completed').length,
      pending: today.filter(s => s.status === 'pending').length,
      goalsNeedingTime,
    };
  }, [sessions, goals, getTodaySessions]);

  const getGreeting = useCallback(() => {
    const persona = getPersonaById(activePersonaId);
    return persona.greeting(intensity);
  }, [activePersonaId, intensity]);

  return (
    <AppContext.Provider
      value={{
        sessions, goals, activePersonaId, intensity, voiceHistory,
        setActivePersona, setIntensity,
        addSession, completeSession, snoozeSession, addGoal,
        sendVoiceCommand, clearVoiceHistory,
        getTodaySessions, getTodayStats, getGreeting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
