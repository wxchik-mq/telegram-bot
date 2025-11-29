import { NextRequest, NextResponse } from "next/server";
import { listDocumentEntries } from "../../../../lib/knowledgeBase";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const documentTypeParam = url.searchParams.get("documentType");
    let documentType;
    if (documentTypeParam) {
      documentType = documentTypeParam.trim();
    }

    const entries = await listDocumentEntries(documentType);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Document GET failed", error);
    const message = error instanceof Error ? error.message : "Failed to list document entries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
