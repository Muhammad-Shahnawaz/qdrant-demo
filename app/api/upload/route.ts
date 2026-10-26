
import { NextResponse } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "crypto";

const client = new QdrantClient({
  url: process.env.QDRANT_URL!,
  apiKey: process.env.QDRANT_API_KEY!,
});

const collection =
  process.env.QDRANT_COLLECTION || "demo_knowledge_free";

const model = "sentence-transformers/all-minilm-l6-v2";

const allowedAgents = [
  "support-agent",
  "sales-agent",
  "knowledge-agent",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const agentId = formData.get("agentId");

    if (
      typeof agentId !== "string" ||
      !allowedAgents.includes(agentId)
    ) {
      return NextResponse.json(
        { error: "Please select a valid AI agent." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a text file." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json(
        { error: "Only .txt files are supported for now." },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be smaller than 2 MB." },
        { status: 400 }
      );
    }

    const text = (await file.text())
      .replace(/\r\n/g, "\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "The uploaded file is empty." },
        { status: 400 }
      );
    }

    const chunkSize = 1200;
    const overlap = 200;
    const chunks: string[] = [];

    for (
      let start = 0;
      start < text.length;
      start += chunkSize - overlap
    ) {
      const chunk = text.slice(start, start + chunkSize).trim();

      if (chunk) {
        chunks.push(chunk);
      }
    }

    const batchSize = 10;
    const documentId = randomUUID();

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await client.upsert(collection, {
        wait: true,
        points: batch.map((content, index) => ({
          id: randomUUID(),
          vector: {
            text: content,
            model,
          },
          payload: {
            document_id: documentId,
            source_file: file.name,
            title: file.name,
            agent_id: agentId,
            chunk_index: i + index,
            content,
            category: "uploaded-document",
          },
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded and indexed successfully.",
      fileName: file.name,
      agentId,
      chunksUploaded: chunks.length,
      documentId,
    });
  } catch (error) {
    console.error("File upload failed:", error);

    return NextResponse.json(
      {
        error: "Upload failed. Check the server terminal for details.",
      },
      { status: 500 }
    );
  }
}
