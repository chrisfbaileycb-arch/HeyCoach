export type IntentType =
  | 'agenda'
  | 'snooze'
  | 'complete'
  | 'status'
  | 'goal_review'
  | 'add_goal'
  | 'unknown';

export interface Intent {
  type: IntentType;
  title?: string;
}

export function parseIntent(text: string): Intent {
  const t = text.toLowerCase().trim();

  if (/what'?s on|agenda|calendar today|brief me|schedule today|my day/.test(t)) {
    return { type: 'agenda' };
  }
  if (/\bsnooze\b/.test(t)) {
    return { type: 'snooze' };
  }
  if (/\b(complete|done|mark|finished|check off)\b/.test(t)) {
    return { type: 'complete' };
  }
  if (/\b(status|progress|how am i|overview|check in)\b/.test(t)) {
    return { type: 'status' };
  }
  if (/goal review|review goals|goals need|need time|unscheduled goals/.test(t)) {
    return { type: 'goal_review' };
  }
  if (/\b(add goal|create goal|new goal|set goal)\b/.test(t)) {
    const m = t.match(/(?:add|create|new|set)\s+goal\s+(?:called|named|to\s+)?(.*)/);
    return { type: 'add_goal', title: m?.[1]?.trim() };
  }

  return { type: 'unknown' };
}
