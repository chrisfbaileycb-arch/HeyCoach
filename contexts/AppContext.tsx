import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getPersonaById } from '@/constants/personas';
import { getCoachResponse } from '@/services/coachService';
import { parseIntent } from '@/services/intentParser';
import { useAuth } from '@/contexts/AuthContext';
import * as SessionService from '@/services/sessionService';
import * as GoalService from '@/services/goalService';
import * as ProfileService from '@/services/profileService';
import type { Session, Goal, VoiceMessage } from '@/types';

// Re-export types for backward compatibility with existing component imports
export type { Session, Goal, VoiceMessage };

export interface AppContextType {
  sessions: Session[];
  goals: Goal[];
  activePersonaId: string;
  intensity: number;
  voiceHistory: VoiceMessage[];
  dataLoading: boolean;
  setActivePersona: (id: string) => void;
  setIntensity: (level: number) => void;
  addSession: (s: Omit<Session, 'id' | 'snoozeCount' | 'status'>) => void;
  completeSession: (id: string) => void;
  snoozeSession: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id' | 'linkedSessionIds' | 'status'>) => void;
  sendVoiceCommand: (text: string) => string;
  clearVoiceHistory: () => void;
  getTodaySessions: () => Session[];
  getTodayStats: () => {
    total: number;
    completed: number;
    pending: number;
    goalsNeedingTime: number;
  };
  getGreeting: () => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activePersonaId, setActivePersonaId] = useState('coach_core');
  const [intensity, setIntensityState] = useState(3);
  const [voiceHistory, setVoiceHistory] = useState<VoiceMessage[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Load data whenever the user changes
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setGoals([]);
      setVoiceHistory([]);
      setActivePersonaId('coach_core');
      setIntensityState(3);
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      try {
        const profile = await ProfileService.fetchProfile(user.id);
        if (profile) {
          setActivePersonaId(profile.activePersonaId);
          setIntensityState(profile.intensity);
        }

        const fetchedSessions = await SessionService.fetchSessions(user.id);
        setSessions(fetchedSessions);

        const fetchedGoals = await GoalService.fetchGoals(user.id, fetchedSessions);
        setGoals(fetchedGoals);
      } catch (err) {
        console.error('[AppContext] Failed to load data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // ─── Persona & Intensity ─────────────────────────────────────────────────

  const setActivePersona = useCallback(
    (id: string) => {
      const persona = getPersonaById(id);
      setActivePersonaId(id);
      setIntensityState(persona.defaultIntensity);
      if (user) {
        ProfileService.updateProfile(user.id, {
          activePersonaId: id,
          intensity: persona.defaultIntensity,
        });
      }
    },
    [user]
  );

  const setIntensity = useCallback(
    (level: number) => {
      const clamped = Math.max(1, Math.min(5, level));
      setIntensityState(clamped);
      if (user) {
        ProfileService.updateProfile(user.id, { intensity: clamped });
      }
    },
    [user]
  );

  // ─── Sessions ────────────────────────────────────────────────────────────

  const addSession = useCallback(
    async (session: Omit<Session, 'id' | 'snoozeCount' | 'status'>) => {
      if (!user) return;
      try {
        const newSession = await SessionService.createSession(user.id, session);
        setSessions((prev) =>
          [...prev, newSession].sort(
            (a, b) =>
              new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
        );
      } catch (err) {
        console.error('[AppContext] Failed to add session:', err);
      }
    },
    [user]
  );

  const completeSession = useCallback(async (id: string) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'completed' as const } : s))
    );
    try {
      const updated = await SessionService.markSessionComplete(id);
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('[AppContext] Failed to complete session:', err);
    }
  }, []);

  const snoozeSession = useCallback(
    async (id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return;
      const newCount = session.snoozeCount + 1;
      const newAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, snoozeCount: newCount, scheduledAt: newAt } : s
        )
      );
      try {
        const updated = await SessionService.snoozeSessionById(id, newCount);
        setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      } catch (err) {
        console.error('[AppContext] Failed to snooze session:', err);
      }
    },
    [sessions]
  );

  // ─── Goals ───────────────────────────────────────────────────────────────

  const addGoal = useCallback(
    async (goal: Omit<Goal, 'id' | 'linkedSessionIds' | 'status'>) => {
      if (!user) return;
      try {
        const newGoal = await GoalService.createGoal(user.id, goal);
        setGoals((prev) => [...prev, newGoal]);
      } catch (err) {
        console.error('[AppContext] Failed to add goal:', err);
      }
    },
    [user]
  );

  // ─── Voice ───────────────────────────────────────────────────────────────

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
        (s) => new Date(s.scheduledAt).toDateString() === new Date().toDateString()
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

      setVoiceHistory((prev) => [...prev.slice(-30), userMsg, coachMsg]);
      return coachText;
    },
    [sessions, goals, activePersonaId, intensity]
  );

  const clearVoiceHistory = useCallback(() => setVoiceHistory([]), []);

  // ─── Derived state ───────────────────────────────────────────────────────

  const getTodaySessions = useCallback((): Session[] => {
    const todayStr = new Date().toDateString();
    return sessions
      .filter((s) => new Date(s.scheduledAt).toDateString() === todayStr)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
  }, [sessions]);

  const getTodayStats = useCallback(() => {
    const today = getTodaySessions();
    const goalsNeedingTime = goals.filter(
      (g) => g.status !== 'completed' && g.linkedSessionIds.length === 0
    ).length;
    return {
      total: today.length,
      completed: today.filter((s) => s.status === 'completed').length,
      pending: today.filter((s) => s.status === 'pending').length,
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
        sessions,
        goals,
        activePersonaId,
        intensity,
        voiceHistory,
        dataLoading,
        setActivePersona,
        setIntensity,
        addSession,
        completeSession,
        snoozeSession,
        addGoal,
        sendVoiceCommand,
        clearVoiceHistory,
        getTodaySessions,
        getTodayStats,
        getGreeting,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
