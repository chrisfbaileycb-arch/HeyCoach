import { corsHeaders } from '../_shared/cors.ts';

interface SessionCtx {
  title: string;
  scheduledAt: string;
  status: string;
  category: string;
  durationMinutes?: number;
}

interface GoalCtx {
  title: string;
  lifeArea: string;
  horizon: string;
  status: string;
  hasTimeBlock: boolean;
}

interface BriefingRequest {
  sessions: SessionCtx[];
  goals: GoalCtx[];
  personaName: string;
  personaTone: string;
  intensity: number;
  intensityLabel: string;
}

const INTENSITY_STYLE: Record<number, string> = {
  1: 'Gentle and warm. Set a calm, encouraging tone for the day.',
  2: 'Steady and supportive. Consistent and motivating without pressure.',
  3: 'Firm and direct but supportive. Clear and action-oriented.',
  4: 'Sharp and focused. No fluff. Demand prioritization and results.',
  5: 'Maximum intensity. Blunt. No excuses. Every minute counts.',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'OnSpace AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: BriefingRequest = await req.json();
    const { sessions, goals, personaName, personaTone, intensity, intensityLabel } = body;

    const fmtTime = (iso: string) => {
      try {
        return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } catch {
        return iso;
      }
    };

    const pending = sessions.filter((s) => s.status === 'pending');
    const completed = sessions.filter((s) => s.status === 'completed');
    const goalsNeedingBlock = goals.filter((g) => g.status !== 'completed' && !g.hasTimeBlock);
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const sessionLines =
      sessions.length > 0
        ? sessions
            .map(
              (s) =>
                `  - [${s.status.toUpperCase()}] ${s.title} @ ${fmtTime(s.scheduledAt)}${s.durationMinutes ? ` (${s.durationMinutes}m)` : ''}`
            )
            .join('\n')
        : '  No sessions scheduled today.';

    const goalLines =
      goals.length > 0
        ? goals
            .map(
              (g) =>
                `  - [${g.status.toUpperCase()}] ${g.title} (${g.lifeArea}, ${g.horizon}) — ${g.hasTimeBlock ? 'has time block' : 'NEEDS a block'}`
            )
            .join('\n')
        : '  No goals set yet.';

    const systemPrompt = `You are ${personaName}, a personal accountability coach.
PERSONA: ${personaTone}
INTENSITY: Level ${intensity}/5 — ${intensityLabel}
DELIVERY: ${INTENSITY_STYLE[intensity] ?? INTENSITY_STYLE[3]}

Your task: Write a personalized MORNING BRIEFING for today (${today}).

RULES:
- 2–4 sentences MAXIMUM. Be concise.
- Reference at least one specific session title or time if sessions exist.
- Mention goals needing calendar blocks only if they exist (keep it brief).
- Match your persona tone and intensity exactly — stay in character.
- End with a punchy call-to-action or rallying statement matching your intensity.
- Do NOT start with "Good morning", "Here's your briefing:", or any opener — jump straight in.
- Do NOT use markdown or bullet points — plain prose only.`;

    const userMsg = `TODAY'S SCHEDULE (${completed.length}/${sessions.length} complete, ${pending.length} pending):
${sessionLines}

ACTIVE GOALS:
${goalLines}

Goals needing time blocks: ${goalsNeedingBlock.length}

Write the morning briefing now.`;

    console.log(
      `[daily-briefing] persona=${personaName} intensity=${intensity} sessions=${sessions.length} goals=${goals.length}`
    );

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        stream: false,
        max_tokens: 130,
        temperature: 0.9,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[daily-briefing] AI error:', errText);
      return new Response(
        JSON.stringify({ error: `AI: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await aiResponse.json();
    const briefing = (result.choices?.[0]?.message?.content ?? '').trim();

    console.log(`[daily-briefing] generated: "${briefing.substring(0, 80)}..."`);

    return new Response(
      JSON.stringify({ briefing }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[daily-briefing] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
