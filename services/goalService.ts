import { supabase } from '@/lib/supabase';
import type { Goal, Session } from '@/types';

function rowToGoal(row: Record<string, unknown>, linkedSessionIds: string[]): Goal {
  return {
    id: row.id as string,
    title: row.title as string,
    lifeArea: row.life_area as string,
    horizon: row.horizon as Goal['horizon'],
    status: row.status as Goal['status'],
    successMetric: (row.success_metric as string) ?? undefined,
    linkedSessionIds,
  };
}

export async function fetchGoals(
  userId: string,
  sessions: Pick<Session, 'id' | 'linkedGoalId'>[]
): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const linked = sessions
      .filter((s) => s.linkedGoalId === row.id)
      .map((s) => s.id);
    return rowToGoal(row as Record<string, unknown>, linked);
  });
}

export async function updateGoalStatus(
  goalId: string,
  status: Goal['status']
): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', goalId);
  if (error) throw error;
}

export async function createGoal(
  userId: string,
  goal: Omit<Goal, 'id' | 'linkedSessionIds' | 'status'>
): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: goal.title,
      life_area: goal.lifeArea,
      horizon: goal.horizon,
      success_metric: goal.successMetric ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return rowToGoal(data as Record<string, unknown>, []);
}
