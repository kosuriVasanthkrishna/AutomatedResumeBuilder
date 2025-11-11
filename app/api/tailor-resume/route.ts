// app/api/download-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph } from "docx";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Expect JSON: { content: string, fileName?: string }
    const { content, fileName } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content string" }, { status: 400 });
    }

    // Simple DOCX: one paragraph per line
    const paragraphs = content.split(/\r?\n/).map((line) => new Paragraph({ text: line }));

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    // Packer returns a Node Buffer
    const buffer = await Packer.toBuffer(doc);

    // ✅ Convert Buffer -> Uint8Array (BodyInit-compatible for NextResponse)
    const bytes = new Uint8Array(buffer);

    const safeName = (fileName && String(fileName).trim()) || "resume.docx";

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("download-resume error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}