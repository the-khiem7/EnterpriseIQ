import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { ingestDocument } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // ingestion calls OpenAI per chunk

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    let title = "";
    let text = "";
    let sourceType = "text";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      title = (form.get("title") as string) || "";

      if (file instanceof File) {
        const buf = new Uint8Array(await file.arrayBuffer());
        if (file.name.toLowerCase().endsWith(".pdf")) {
          const pdf = await getDocumentProxy(buf);
          const { text: pdfText } = await extractText(pdf, { mergePages: true });
          text = pdfText;
          sourceType = "pdf";
        } else {
          text = new TextDecoder().decode(buf);
          sourceType = file.name.toLowerCase().endsWith(".md") ? "markdown" : "text";
        }
        if (!title) title = file.name.replace(/\.[^.]+$/, "");
      }
    } else {
      const body = await req.json();
      title = body.title ?? "";
      text = body.text ?? "";
      sourceType = body.sourceType ?? "text";
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ ok: false, error: "No text content found." }, { status: 400 });
    }

    const result = await ingestDocument({ title, text, sourceType });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
