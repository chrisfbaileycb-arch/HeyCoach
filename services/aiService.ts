import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

// ─── Daily Briefing ──────────────────────────────────────────────────────────

export interface GenerateDailyBriefingParams {
  sessions: Array<{
    title: string;
    scheduledAt: string;
    status: string;
    category: string;
    durationMinutes?: number;
  }>;
  goals: Array<{
    title: string;
    lifeArea: string;
    horizon: string;
    status: string;
    hasTimeBlock: boolean;
  }>;
  personaName: string;
  personaTone: string;
  intensity: number;
  intensityLabel: string;
}

/**
 * Calls the daily-briefing edge function to generate a personalized
 * morning briefing based on today's sessions, goals, persona, and intensity.
 */
export async function generateDailyBriefing(
  params: GenerateDailyBriefingParams
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('daily-briefing', {
      body: params,
    });

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
      console.error('[aiService] daily-briefing error:', detail);
      return null;
    }

    return (data as { briefing?: string })?.briefing ?? null;
  } catch (err) {
    console.error('[aiService] daily-briefing invoke failed:', err);
    return null;
  }
}

// ─── Session Coach Message ────────────────────────────────────────────────────

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
