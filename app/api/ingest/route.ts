
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
    const body = await request.json();
    const { title, content, category, agentId } = body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof content !== "string" ||
      !content.trim() ||
      typeof agentId !== "string" ||
      !allowedAgents.includes(agentId)
    ) {
      return NextResponse.json(
        { error: "Title, content, and a valid agent are required." },
        { status: 400 }
      );
    }

    const id = randomUUID();

    await client.upsert(collection, {
      wait: true,
      points: [
        {
          id,
          vector: {
            text: `${title.trim()}\n${content.trim()}`,
            model,
          },
          payload: {
            title: title.trim(),
            content: content.trim(),
            category:
              typeof category === "string" && category.trim()
                ? category.trim()
                : "general",
            agent_id: agentId,
            created_at: new Date().toISOString(),
          },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Knowledge added successfully.",
      id,
      agentId,
    });
  } catch (error) {
    console.error("Qdrant ingestion failed:", error);

    return NextResponse.json(
      { error: "Failed to save knowledge. Check the server terminal." },
      { status: 500 }
    );
  }
}
