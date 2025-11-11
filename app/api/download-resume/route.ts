// app/api/download-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { content, fileName } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required (string)" }, { status: 400 });
    }

    const paragraphs = parseTextToDocx(content);

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    // Packer returns a Node Buffer -> convert to Uint8Array for NextResponse
    const buffer = await Packer.toBuffer(doc);
    const bytes = new Uint8Array(buffer); // ✅ BodyInit-compatible

    const safeName = (fileName && String(fileName).trim()) || "resume.docx";

    return new NextResponse(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("download-resume error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}

function parseTextToDocx(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = text.split("\n");

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }

    // Heading-like (ALL CAPS short lines)
    if (/^[A-Z][A-Z\s]+$/.test(line) && line.length < 50) {
      paragraphs.push(
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );
      continue;
    }

    // Bullets
    if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      const text = line.replace(/^(\•|-|\*)\s*/, "");
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22 })],
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
      continue;
    }

    // Regular paragraph
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: 100 },
      })
    );
  }

  return paragraphs;
}
