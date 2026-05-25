import { NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types";
import {
  buildInterpretPayload,
  payloadToUserMessage,
} from "@/lib/interpret-summary";
import {
  INTERPRET_SYSTEM_PROMPT,
  sanitizeInterpretation,
} from "@/lib/interpret-prompt";

export const dynamic = "force-dynamic";

interface InterpretRequestBody {
  result: AnalysisResult;
  question?: string;
}

async function callOpenAI(userMessage: string, question?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const userContent = question
    ? `${userMessage}\n\nUser follow-up question (answer in educational terms only, no recommendations): ${question}`
    : userMessage;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 900,
      messages: [
        { role: "system", content: INTERPRET_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain these PRS results for a lay audience. Remember: information only, no recommendations.\n\n${userContent}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InterpretRequestBody;
    if (!body?.result?.reports?.length) {
      return NextResponse.json(
        { error: "Missing analysis result" },
        { status: 400 },
      );
    }

    const payload = buildInterpretPayload(body.result);
    const userMessage = payloadToUserMessage(payload);
    const raw = await callOpenAI(userMessage, body.question?.slice(0, 500));
    const { text, filtered } = sanitizeInterpretation(raw);

    return NextResponse.json({
      explanation: text,
      filtered,
      disclaimer:
        "AI-generated educational text only. Not medical advice, diagnosis, or screening guidance. Your raw DNA was not sent to the model — only summary statistics.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Interpretation failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
