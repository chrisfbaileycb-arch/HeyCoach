import { corsHeaders } from '../_shared/cors.ts';

interface GenerateRequest {
  sessionTitle: string;
  scheduledAt: string;
  durationMinutes?: number;
  linkedGoalTitle?: string;
  personaName: string;
  personaTone: string;
  intensity: number;
  intensityLabel: string;
}

const INTENSITY_STYLE: Record<number, string> = {
  1: 'Very gentle, warm, no pressure. Soft and encouraging.',
  2: 'Steady and supportive. Consistent accountability with warmth.',
  3: 'Firm and direct but supportive. Clear without being harsh.',
  4: 'Sharp, direct, time-pressure focused. Minimal softening.',
  5: 'Maximum intensity. Blunt and short. No excuses.',
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

    const body: GenerateRequest = await req.json();
    const {
      sessionTitle,
      scheduledAt,
      durationMinutes,
      linkedGoalTitle,
      personaName,
      personaTone,
      intensity,
      intensityLabel,
    } = body;

    const fmtTime = (iso: string) => {
      try {
        return new Date(iso).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
      } catch {
        return iso;
      }
    };

    const timeStr = fmtTime(scheduledAt);
    const durationStr = durationMinutes ? ` for ${durationMinutes} minutes` : '';
    const goalStr = linkedGoalTitle
      ? ` It contributes to the goal: "${linkedGoalTitle}".`
      : '';

    const systemPrompt = `You are ${personaName}, a personal accountability coach.
PERSONA: ${personaTone}
INTENSITY: Level ${intensity}/5 — ${intensityLabel}
DELIVERY STYLE: ${INTENSITY_STYLE[intensity] ?? INTENSITY_STYLE[3]}

Your task: Write a SHORT pre-session coaching message (1–2 sentences MAX).
- Make it specific to the session name and time.
- Match your persona tone and intensity exactly.
- No opening phrases like "Here is your message:" — just the message itself.
- No quotes around the output.
- Under 30 words preferred.`;

    const userMsg = `Write a pre-session coaching message for: "${sessionTitle}" at ${timeStr}${durationStr}.${goalStr}`;

    console.log(`[generate-session-message] persona=${personaName} intensity=${intensity} session="${sessionTitle}"`);

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        stream: false,
        max_tokens: 80,
        temperature: 0.9,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[generate-session-message] AI error:', errText);
      return new Response(
        JSON.stringify({ error: `AI: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await aiResponse.json();
    const message = (result.choices?.[0]?.message?.content ?? '').trim();

    console.log(`[generate-session-message] generated: "${message.substring(0, 60)}"`);

    return new Response(
      JSON.stringify({ message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[generate-session-message] error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
