import { corsHeaders } from '../_shared/cors.ts';

interface SessionContext {
  title: string;
  scheduledAt: string;
  status: string;
  category: string;
  durationMinutes?: number;
}

interface GoalContext {
  title: string;
  lifeArea: string;
  horizon: string;
  status: string;
  hasTimeBlock: boolean;
}

interface ChatRequest {
  message: string;
  personaId: string;
  personaName: string;
  personaTone: string;
  intensity: number;
  intensityLabel: string;
  sessions: SessionContext[];
  goals: GoalContext[];
  history: { role: 'user' | 'assistant'; content: string }[];
}

const INTENSITY_STYLE: Record<number, string> = {
  1: 'Use a very gentle, warm, encouraging tone. No pressure. Soft affirmations.',
  2: 'Use a steady, supportive tone. Consistent accountability with warmth.',
  3: 'Be firm and direct but supportive. Clear expectations without harshness.',
  4: 'Be sharp, direct, and time-pressure focused. Minimal softening.',
  5: 'Maximum intensity. No excuses. Results-only. Blunt, short, demanding.',
};

function buildSystemPrompt(req: ChatRequest): string {
  const { personaName, personaTone, intensity, intensityLabel, sessions, goals } = req;

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const nextSession = pendingSessions[0];
  const goalsNeedingTime = goals.filter(g => g.status !== 'completed' && !g.hasTimeBlock);
  const completedGoals = goals.filter(g => g.status === 'completed');

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const sessionsList = sessions.length > 0
    ? sessions.map(s =>
        `  - [${s.status.toUpperCase()}] ${s.title} @ ${fmtTime(s.scheduledAt)}${s.durationMinutes ? ` (${s.durationMinutes}m)` : ''}`
      ).join('\n')
    : '  No sessions scheduled today.';

  const goalsList = goals.length > 0
    ? goals.map(g =>
        `  - [${g.status.toUpperCase()}] ${g.title} (${g.lifeArea}, ${g.horizon})${g.hasTimeBlock ? ' ✓ block' : ' ✗ no block'}`
      ).join('\n')
    : '  No goals yet.';

  return `You are ${personaName}, a personal accountability coach.

PERSONA: ${personaTone}
INTENSITY: Level ${intensity}/5 — ${intensityLabel}
INTENSITY DELIVERY: ${INTENSITY_STYLE[intensity] ?? INTENSITY_STYLE[3]}

TODAY'S SESSIONS (${completedSessions.length}/${sessions.length} complete):
${sessionsList}

GOALS:
${goalsList}
Goals needing a time block: ${goalsNeedingTime.length}
${nextSession ? `NEXT SESSION: "${nextSession.title}" at ${fmtTime(nextSession.scheduledAt)}` : 'No pending sessions.'}

RULES:
- Stay in character as ${personaName} at intensity ${intensity} at all times.
- Keep responses SHORT — 1–3 sentences max unless the user explicitly asks for more detail.
- Reference real data from the session/goal context when relevant.
- Never break character or mention being an AI.
- If asked to snooze/complete a session, acknowledge it in character (the app handles the actual action).
- For goal or agenda questions, use the exact session titles and times provided above.
- Match the energy: intensity ${intensity} means ${intensityLabel}.`;
}

Deno.serve(async (req: Request) => {
  // Handle preflight
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

    const body: ChatRequest = await req.json();
    const { message, history } = body;

    const systemPrompt = buildSystemPrompt(body);

    // Build messages array: system + history + current user message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8), // Keep last 8 exchanges for context
      { role: 'user', content: message },
    ];

    console.log(`[coach-chat] persona=${body.personaId} intensity=${body.intensity} msg="${message.substring(0, 60)}"`);

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        stream: true,
        max_tokens: 300,
        temperature: 0.85,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[coach-chat] AI error:', errText);
      return new Response(
        JSON.stringify({ error: `AI: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pass through the stream directly to the client
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = aiResponse.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(encoder.encode(decoder.decode(value)));
        }
      } catch (err) {
        console.error('[coach-chat] stream error:', err);
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[coach-chat] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
