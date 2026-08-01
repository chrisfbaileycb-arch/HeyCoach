import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  // Normalize persona id: db may store 'coach-core', app uses 'coach_core'
  const rawPersonaId = (data.active_persona_id as string) ?? 'coach_core';
  const activePersonaId = rawPersonaId.replace(/-/g, '_');

  return {
    id: data.id as string,
    email: (data.email as string) ?? null,
    username: (data.username as string) ?? null,
    activePersonaId,
    intensity: (data.intensity as number) ?? 3,
  };
}

export async function updateProfile(
  userId: string,
  updates: Partial<{ activePersonaId: string; intensity: number }>
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.activePersonaId !== undefined) {
    payload.active_persona_id = updates.activePersonaId;
  }
  if (updates.intensity !== undefined) {
    payload.intensity = updates.intensity;
  }

  await supabase.from('user_profiles').update(payload).eq('id', userId);
}
