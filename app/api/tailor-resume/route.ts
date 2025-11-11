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
    
    let tailored = '';
    
    if (resumeContent) {
      // If resume exists, return it with basic tailoring notes
      // In a real implementation, this would use AI to actually tailor the resume
      tailored = resumeContent;
    } else {
      // Generate a basic resume structure from job description
      // Extract key information from job description
      const jd = jobDescription.trim();
      
      // Try to extract job title (first line or common patterns)
      const lines = jd.split('\n').filter((l: string) => l.trim());
      const firstLine = lines[0] || '';
      
      // Generate a basic resume template
      tailored = `PROFESSIONAL RESUME

${firstLine.length > 0 && firstLine.length < 100 ? firstLine.toUpperCase() : 'PROFESSIONAL SUMMARY'}

[Generated based on job description - Please customize with your actual experience]

KEY QUALIFICATIONS
• [Add qualifications matching the job requirements]
• [Highlight relevant skills and experience]
• [Include quantifiable achievements]

PROFESSIONAL EXPERIENCE

[Position Title]
[Company Name] | [Location] | [Date Range]
• [Achievement 1 - quantify impact]
• [Achievement 2 - use keywords from job description]
• [Achievement 3 - align with job requirements]

EDUCATION
[Degree] | [Institution] | [Year]

SKILLS
[Relevant skills from job description]

---
Note: This is a template generated from the job description. Please replace placeholders with your actual information.`;
    }

    return NextResponse.json({ ok: true, tailored });
  } catch (err: any) {
    console.error("tailor-resume error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
