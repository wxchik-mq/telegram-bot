import { NextRequest, NextResponse } from "next/server";
import {
  KnowledgeBaseNotFoundError,
  KnowledgeBaseValidationError,
  updateKnowledgeBaseEntry,
  deleteDocumentEntry,
} from "../../../../lib/knowledgeBase";

// Prisma only works on the Node.js runtime, so make sure this never runs on edge.
export const runtime = "nodejs";

interface UpdateKnowledgeBaseDto {
  record?: Record<string, unknown>;
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const id = Number(context.params?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
  }

  let body: UpdateKnowledgeBaseDto | null = null;
  try {
    body = (await request.json()) as UpdateKnowledgeBaseDto;
  } catch (error) {
    console.error("Knowledge base PUT parse failed", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body?.record || typeof body.record !== "object" || Array.isArray(body.record)) {
    return NextResponse.json({ error: "record object is required" }, { status: 400 });
  }

  try {
    const updatedEntry = await updateKnowledgeBaseEntry(id, body.record);
    return NextResponse.json(updatedEntry);
  } catch (error) {
    if (error instanceof KnowledgeBaseNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof KnowledgeBaseValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Knowledge base PUT failed", error);
    const message = error instanceof Error ? error.message : "Failed to update knowledge base entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const id = Number(context.params?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
  }

  try {
    await deleteDocumentEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof KnowledgeBaseNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Knowledge base DELETE failed", error);
    const message = error instanceof Error ? error.message : "Failed to delete knowledge base entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}