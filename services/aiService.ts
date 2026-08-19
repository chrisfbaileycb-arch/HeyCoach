
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
  const pending = params.sessions.filter((s) => s.status === 'pending');
  const unblocked = params.goals.filter((g) => g.status !== 'completed' && !g.hasTimeBlock);
  const next = pending[0];
  if (!next) return `Your board is clear. Choose one meaningful goal and give it a time block.`;
  const at = new Date(next.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${next.title} is next at ${at}. ${unblocked.length ? `${unblocked.length} goal${unblocked.length === 1 ? '' : 's'} still need calendar time. ` : ''}Show up and finish the block.`;
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
  const at = new Date(params.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${params.sessionTitle} starts at ${at}. Protect the block and finish what you scheduled.`;
}
