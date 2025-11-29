import { NextRequest, NextResponse } from "next/server";
import { createKnowledgeBaseEntries, listKnowledgeBaseEntries } from "../../../lib/knowledgeBase";

// Prisma only works on the Node.js runtime, so make sure this never runs on edge.
export const runtime = "nodejs";

interface CreateKnowledgeBaseDto {
  documentType: string;
  records?: any[];
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const FILE_UPLOAD_DOCUMENT_TYPES = new Set(["pdf", "docx", "txt"]);

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let body: CreateKnowledgeBaseDto | null = null;
  let uploadedFile: File | null = null;

  try {
    // Handle document uploads
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const requestBody = formData.get("requestBody");
      if (typeof requestBody === "string" && requestBody.trim()) {
        body = JSON.parse(requestBody) as CreateKnowledgeBaseDto;
      }
      const fileField = formData.get("file");
      if (fileField instanceof File) {
        uploadedFile = fileField;
      }
    } else {
      body = (await request.json()) as CreateKnowledgeBaseDto;
    }
  } catch (error) {
    console.error("Knowledge base POST parse failed", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body?.documentType) {
    return NextResponse.json({ error: "documentType is required" }, { status: 400 });
  }

  const documentType = body.documentType.trim().toLowerCase();
  let data: any;
  if (FILE_UPLOAD_DOCUMENT_TYPES.has(documentType)) {
    if (!uploadedFile) {
      return NextResponse.json({ error: `File upload is required for documentType=${documentType}` }, { status: 400 });
    }
    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File must be smaller than 10MB" }, { status: 400 });
    }
    data = uploadedFile;
  } else if (documentType === "faq") {
    if (!body?.records?.length) {
      return NextResponse.json({ error: "no records provided" }, { status: 400 });
    }
    data = body.records;
  } else {
    return NextResponse.json({ error: `Unsupported document type: ${documentType}` }, { status: 400 });
  }

  try {
    await createKnowledgeBaseEntries(documentType, data);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Knowledge base POST failed", error);
    const message = error instanceof Error ? error.message : "Failed to create knowledge base entries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const documentTypeParam = url.searchParams.get("documentType");
    let documentType;
    if (documentTypeParam) {
      documentType = documentTypeParam.trim();
    }

    const entries = await listKnowledgeBaseEntries(documentType);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Knowledge base GET failed", error);
    const message = error instanceof Error ? error.message : "Failed to list knowledge base entries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
