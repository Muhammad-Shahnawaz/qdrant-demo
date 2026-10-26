
import { NextResponse } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";

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
    const { question, agentId } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    if (
      typeof agentId !== "string" ||
      !allowedAgents.includes(agentId)
    ) {
      return NextResponse.json(
        { error: "Please select a valid AI agent." },
        { status: 400 }
      );
    }

    const result = await client.query(collection, {
      query: {
        text: question.trim(),
        model,
      },
      filter: {
        must: [
          {
            key: "agent_id",
            match: { value: agentId },
          },
        ],
      },
      limit: 5,
      with_payload: true,
      with_vector: false,
    });

    return NextResponse.json(
      result.points.map((point) => ({
        id: point.id,
        score: point.score,
        payload: point.payload,
      }))
    );
  } catch (error) {
    console.error("Qdrant search failed:", error);

    return NextResponse.json(
      { error: "Search failed. Check the server terminal for details." },
      { status: 500 }
    );
  }
}
