export interface CoachPersona {
  id: string;
  name: string;
  subtitle: string;
  tone: string;
  color: string;
  bgColor: string;
  iconName: string;
  defaultIntensity: number;
  greeting: (intensity: number) => string;
  startSession: (title: string, intensity: number) => string;
  advanceWarning: (title: string, minutes: number, intensity: number) => string;
  snoozeMessage: (title: string, count: number, intensity: number) => string;
  completeMessage: (title: string, intensity: number) => string;
  goalNeedsTime: (title: string, intensity: number) => string;
  idleMessage: (intensity: number) => string;
}

export const PERSONAS: CoachPersona[] = [
  {
    id: 'drill_sergeant',
    name: 'Drill Sergeant',
    subtitle: 'No excuses. Results only.',
    tone: 'Blunt, direct, zero tolerance for drift',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    iconName: 'military-tech',
    defaultIntensity: 4,
    greeting: (i) => i >= 4
      ? 'Eyes up. Clock is running. What are we shipping today?'
      : 'Morning. State the objective. No warm-up.',
    startSession: (title, i) => i >= 4
      ? `${title}. NOW. Zero warmup. Execute.`
      : `${title} is live. Lock in.`,
    advanceWarning: (title, min, i) => i >= 4
      ? `${min} MINUTES. ${title}. Wrap it up.`
      : `${min} minutes to ${title}. Start wrapping.`,
    snoozeMessage: (title, count, i) => count >= 3
      ? `3 snoozes on ${title}. Complete it or kill it. No more middle.`
      : i >= 4
        ? `Snooze ${count}. ${title} is still live. Next delay costs you.`
        : `Snooze ${count} on ${title}. Five minutes. Then we go.`,
    completeMessage: (title, i) => i >= 4
      ? `${title}. Done. Next.`
      : `${title} complete. That is how it is done.`,
    goalNeedsTime: (title, i) => i >= 4
      ? `"${title}" — no block, no progress. Schedule it or kill it.`
      : `"${title}" needs a time block. Schedule it.`,
    idleMessage: (i) => i >= 4
      ? 'Nothing on the board. That is a wasted day. Fix it.'
      : 'Calendar is clear. What should be on it right now?',
  },
  {
    id: 'coach_core',
    name: 'Coach Core',
    subtitle: 'Firm, warm, and direct.',
    tone: 'Encouraging but firm mentor',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    iconName: 'sports',
    defaultIntensity: 3,
    greeting: (i) => i >= 3
      ? 'Good morning. The day is already moving. Let\'s stay ahead of it.'
      : 'Morning. What\'s the one block you\'re protecting today?',
    startSession: (title, i) => i >= 3
      ? `${title} is your focus. Lock in and make this block count.`
      : `Time for ${title}. Show up with intent.`,
    advanceWarning: (title, min, _i) =>
      `${min} minute${min === 1 ? '' : 's'} until ${title}. Take a breath. You\'ve got this.`,
    snoozeMessage: (title, count, _i) => count >= 3
      ? `Third snooze on ${title}. Complete it or let it go.`
      : `Snooze ${count} on ${title}. One breath. I\'ll be back in 5.`,
    completeMessage: (title, _i) => `${title} marked complete. Bank that win.`,
    goalNeedsTime: (title, _i) => `"${title}" needs a calendar block before it counts.`,
    idleMessage: (_i) => 'Your calendar is clear. Put something intentional on it.',
  },
  {
    id: 'builder_coach',
    name: 'Builder',
    subtitle: 'Ship progress every block.',
    tone: 'Systems-minded. Every block is a commit.',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.08)',
    iconName: 'code',
    defaultIntensity: 3,
    greeting: (_i) => 'Each block is a commit. What ships today?',
    startSession: (title, _i) => `${title}: Define the one thing you\'re shipping this block. Go.`,
    advanceWarning: (title, min, _i) => `${min} minutes before ${title}. Scope cut if needed. Ship something.`,
    snoozeMessage: (title, count, _i) => count >= 3
      ? `${title}, snooze ${count}. Make it smaller. Ship the smallest piece.`
      : `Snooze ${count}. Break ${title} down. One piece.`,
    completeMessage: (title, _i) => `${title} shipped. That is a rep in the system.`,
    goalNeedsTime: (title, _i) => `"${title}" isn't on the board. Unscheduled work doesn't ship.`,
    idleMessage: (_i) => 'No session active. Smallest shippable thing. Go.',
  },
  {
    id: 'zen_guide',
    name: 'Zen Guide',
    subtitle: 'Presence leads to depth.',
    tone: 'Calm, minimal, deep work focused',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    iconName: 'spa',
    defaultIntensity: 2,
    greeting: (_i) => 'Today is open. What needs your clearest attention?',
    startSession: (title, _i) => `${title}. Breathe. Set the intention. Begin.`,
    advanceWarning: (title, min, _i) => `${min} minutes before ${title}. Come to stillness.`,
    snoozeMessage: (title, count, _i) => count >= 3
      ? `${title} — three pauses. What is the real resistance? Name it.`
      : `Pause accepted. Return to ${title} when the mind is quiet.`,
    completeMessage: (title, _i) => `${title} complete. That focus was real.`,
    goalNeedsTime: (title, _i) => `"${title}" is an intention not yet a commitment. Give it a time.`,
    idleMessage: (_i) => 'The calendar is open. Use this space for deep work or deliberate rest.',
  },
];

export const getPersonaById = (id: string): CoachPersona =>
  PERSONAS.find(p => p.id === id) ?? PERSONAS[1];

export const INTENSITY_LABELS: Record<number, string> = {
  1: 'Gentle',
  2: 'Steady',
  3: 'Firm',
  4: 'Sharp',
  5: 'Maximum',
};

export const INTENSITY_DESCS: Record<number, string> = {
  1: 'Soft reminders, no pressure, warm delivery',
  2: 'Consistent accountability with a gentle touch',
  3: 'Clear expectations — firm but supportive',
  4: 'Sharp and direct, time-pressure focused',
  5: 'No excuses. Results-only. Maximum intensity.',
};
