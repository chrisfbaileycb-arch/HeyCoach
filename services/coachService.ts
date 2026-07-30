import { Intent } from './intentParser';
import { Session, Goal } from '@/contexts/AppContext';
import { getPersonaById } from '@/constants/personas';

interface CoachContext {
  sessions: Session[];
  goals: Goal[];
  personaId: string;
  intensity: number;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getCoachResponse(intent: Intent, ctx: CoachContext): string {
  const persona = getPersonaById(ctx.personaId);
  const { sessions, goals, intensity } = ctx;
  const pending = sessions.filter(s => s.status === 'pending');
  const completed = sessions.filter(s => s.status === 'completed');
  const next = pending[0];
  const goalsNeedingTime = goals.filter(
    g => g.status !== 'completed' && g.linkedSessionIds.length === 0
  );

  switch (intent.type) {
    case 'agenda': {
      if (sessions.length === 0) return persona.idleMessage(intensity);
      const nextInfo = next
        ? ` Next: ${next.title} at ${fmtTime(next.scheduledAt)}.`
        : ' All sessions done.';
      return `You have ${sessions.length} sessions today — ${completed.length} done, ${pending.length} pending.${nextInfo}`;
    }

    case 'snooze': {
      if (!next) return 'Nothing pending to snooze right now.';
      return persona.snoozeMessage(next.title, next.snoozeCount + 1, intensity);
    }

    case 'complete': {
      if (!next) return 'Nothing pending to mark complete.';
      return persona.completeMessage(next.title, intensity);
    }

    case 'status': {
      const base =
        sessions.length === 0
          ? persona.idleMessage(intensity)
          : `${completed.length} of ${sessions.length} sessions complete today.`;
      const goalNote =
        goalsNeedingTime.length > 0
          ? ` ${goalsNeedingTime.length} goal${goalsNeedingTime.length > 1 ? 's' : ''} still need a time block.`
          : ' All goals have calendar support.';
      return base + goalNote;
    }

    case 'goal_review': {
      if (goalsNeedingTime.length === 0) return 'All goals have calendar support. Keep the reps coming.';
      const titles = goalsNeedingTime
        .slice(0, 2)
        .map(g => g.title)
        .join(', ');
      return persona.goalNeedsTime(titles, intensity);
    }

    case 'add_goal': {
      if (!intent.title) return "Name the goal. Say: add goal called [title]";
      return `"${intent.title}" is in memory. It needs a calendar block before it counts.`;
    }

    default: {
      const suggestions = [
        "what's on my agenda",
        'snooze',
        'complete',
        'status',
        'goal review',
        'add goal called [title]',
      ];
      return `Try: "${suggestions[Math.floor(Math.random() * suggestions.length)]}"`;
    }
  }
}
