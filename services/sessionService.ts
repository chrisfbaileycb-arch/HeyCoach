import { supabase } from '@/lib/supabase';
import type { Session } from '@/types';

// Maps a Supabase row to the app Session type
function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    title: row.title as string,
    scheduledAt: row.scheduled_at as string,
    category: row.category as Session['category'],
    type: row.type as Session['type'],
    // 'snoozed' status treated as pending in the UI
    status: (row.status === 'snoozed' ? 'pending' : row.status) as Session['status'],
    snoozeCount: (row.snooze_count as number) ?? 0,
    coachMessage: (row.coach_message as string) ?? '',
    linkedGoalId: (row.linked_goal_id as string) ?? undefined,
    durationMinutes: (row.duration_minutes as number) ?? undefined,
  };
}

export async function fetchSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToSession);
}

export async function createSession(
  userId: string,
  session: Omit<Session, 'id' | 'snoozeCount' | 'status'>
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title: session.title,
      scheduled_at: session.scheduledAt,
      category: session.category,
      type: session.type,
      coach_message: session.coachMessage,
      duration_minutes: session.durationMinutes ?? null,
      linked_goal_id: session.linkedGoalId ?? null,
      status: 'pending',
      snooze_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToSession(data as Record<string, unknown>);
}

export async function markSessionComplete(sessionId: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return rowToSession(data as Record<string, unknown>);
}

export async function updateCoachMessage(
  sessionId: string,
  message: string
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ coach_message: message, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function snoozeSessionById(
  sessionId: string,
  newSnoozeCount: number
): Promise<Session> {
  const newScheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .update({
      snooze_count: newSnoozeCount,
      scheduled_at: newScheduledAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return rowToSession(data as Record<string, unknown>);
}
