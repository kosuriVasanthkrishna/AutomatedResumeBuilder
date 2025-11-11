// app/api/parse-resume/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid file object" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "The uploaded file appears to be empty" }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const name = (file.name || "").toLowerCase();
    const mime = (file.type || "").toLowerCase();

    const isPDF = mime.includes("pdf") || name.endsWith(".pdf");
    const isDocx =
      mime.includes("officedocument.wordprocessingml.document") || name.endsWith(".docx");
    const isTxt = mime.startsWith("text/") || name.endsWith(".txt");
    const isDoc = mime === "application/msword" || name.endsWith(".doc");

    if (isDoc) {
      return NextResponse.json(
        { error: "Legacy .doc files aren’t supported. Please upload .docx or PDF." },
        { status: 415 }
      );
    }

    let text = "";
    if (isPDF) {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text || "";
    } else if (isDocx) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else if (isTxt) {
      text = buffer.toString("utf8");
    } else {
      return NextResponse.json(
        { error: "Unsupported type. Use PDF, DOCX, or TXT." },
        { status: 415 }
      );
    }

    return NextResponse.json({
      content: text,
      fileName: file.name,
      fileType: file.type,
    });
  } catch (error: any) {
    console.error("parse-resume error:", error);
    return NextResponse.json(
      { error: error?.message ?? "An error occurred while parsing the file" },
      { status: 500 }
    );
  }
}
