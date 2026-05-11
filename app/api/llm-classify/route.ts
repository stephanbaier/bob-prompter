import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Node runtime (Edge has stricter compat with Anthropic SDK; Node is safe for Vercel)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SectionMeta = {
  id: string;
  title: string;
  contextHint?: string;
};

type RequestBody = {
  transcript: string;
  sections: SectionMeta[];
  currentSectionId: string;
};

type ClassifyResponse =
  | { sectionId: string; confidence: number; reasoning: string }
  | { skipped: true; reason: string }
  | { error: string };

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 200;

export async function POST(req: Request): Promise<NextResponse<ClassifyResponse>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: "ANTHROPIC_API_KEY not configured" });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { transcript, sections, currentSectionId } = body;
  if (!transcript || !Array.isArray(sections) || sections.length === 0) {
    return NextResponse.json({ skipped: true, reason: "Missing transcript or sections" });
  }
  if (transcript.split(/\s+/).filter(Boolean).length < 15) {
    return NextResponse.json({ skipped: true, reason: "Transcript too short" });
  }

  const sectionList = sections
    .map(
      (s, i) =>
        `[${i}] id="${s.id}" — ${s.title}${s.contextHint ? ` — ${s.contextHint}` : ""}`,
    )
    .join("\n");

  const systemPrompt = `Du klassifizierst Live-Podcast-Audio. Der Podcast "Business ohne Bullshit" hat eine feste Folgen-Struktur mit nummerierten Sections (Cold Open → Greeting → Banter → News-Themen → Wins/Losses → Closer). Anhand der letzten ~30 Sekunden Transkript identifizierst du, in welcher Section die Hosts gerade sind.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt in dieser Form:
{"sectionId": "<id>", "confidence": <0-1>, "reasoning": "<max 12 Wörter>"}

- sectionId: muss exakt eine der gelisteten IDs sein (oder "unknown")
- confidence: 0.0 (Rate) bis 1.0 (sicher)
- reasoning: knappe Begründung, max 12 Wörter

Beachte Übergangsphrasen: "Wie auch immer, drei Themen" = pivot-line; "Egal weiter im Programm" = nächstes Thema; "Sieger und Verlierer" = wins-losses; "Das war's für heute" = show-closer.`;

  const userPrompt = `Aktuelle Section laut Tool: ${currentSectionId}

Verfügbare Sections:
${sectionList}

Letztes Transkript (chronologisch, ~30s Sprache):
"""
${transcript}
"""

In welcher Section sind die Hosts JETZT?`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "No text in LLM response" }, { status: 502 });
    }
    const text = block.text.trim();
    // Strip code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned) as {
        sectionId: string;
        confidence: number;
        reasoning: string;
      };
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: `Could not parse: ${cleaned.slice(0, 120)}` }, { status: 502 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
