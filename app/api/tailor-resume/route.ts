// app/api/tailor-resume/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Missing jobDescription" },
        { status: 400 }
      );
    }

    // Simple deterministic "tailoring" stub (no external API).
    // You can later replace this block with calls to Gemini/Groq/OpenAI etc.
    const resumeContent = resumeText?.trim() || '';
    const tailored =
      `TARGET ROLE SUMMARY:\n${jobDescription.trim()}\n\n` +
      (resumeContent 
        ? `TAILORED RESUME DRAFT:\n${resumeContent}\n\n` 
        : `GENERATED RESUME DRAFT:\n[Resume will be generated based on job description]\n\n`) +
      `ADAPTATION NOTES:\n` +
      `- Align bullets to job keywords.\n` +
      `- Quantify impact (%, $, time saved).\n` +
      `- Put the most relevant experience first.\n`;

    return NextResponse.json({ ok: true, tailored });
  } catch (err: any) {
    console.error("tailor-resume error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
