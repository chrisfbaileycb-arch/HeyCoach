import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface GenerateSessionMessageParams {
  sessionTitle: string;
  scheduledAt: string;
  durationMinutes?: number;
  linkedGoalTitle?: string;
  personaName: string;
  personaTone: string;
  intensity: number;
  intensityLabel: string;
}

/**
 * Calls the generate-session-message edge function to produce a personalized
 * pre-session coach message. Returns the message string or null on failure.
 */
export async function generateSessionCoachMessage(
  params: GenerateSessionMessageParams
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-session-message',
      { body: params }
    );

    if (error) {
      let detail = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          detail = text || detail;
        } catch {
          // ignore
        }
      }
      console.error('[aiService] generate-session-message error:', detail);
      return null;
    }

    return (data as { message?: string })?.message ?? null;
  } catch (err) {
    console.error('[aiService] invoke failed:', err);
    return null;
  }
}
