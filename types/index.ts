// Shared domain types — imported by contexts, services, and components

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

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  activePersonaId: string;
  intensity: number;
}
