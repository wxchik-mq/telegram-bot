import { NextRequest, NextResponse } from "next/server";
import { findDocumentById, softDeleteDocumentAndChunksById, updateDocumentAndChunksById } from "../../../../lib/knowledgeBase";
import { FILE_UPLOAD_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from "../../../../lib/knowledgeBase/constant";

export const runtime = "nodejs";

interface UpdateDocumentDto {
    documentType: string;
    records?: any[];
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
    const id = Number(context.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    }
    const document = await findDocumentById(id);
    if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(document);
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    const id = Number(context.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    }
    const contentType = request.headers.get("content-type") ?? "";
    let body: UpdateDocumentDto | null = null;
    let uploadedFile: File | null = null;

    try {
        // Handle document uploads
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const requestBody = formData.get("requestBody");
            if (typeof requestBody === "string" && requestBody.trim()) {
                body = JSON.parse(requestBody) as UpdateDocumentDto;
            }
            const fileField = formData.get("file");
            if (fileField instanceof File) {
                uploadedFile = fileField;
            }
        } else {
            body = (await request.json()) as UpdateDocumentDto;
        }
    } catch (error) {
        console.error("Document POST parse failed", error);
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
        await updateDocumentAndChunksById(id, documentType, data);
        return NextResponse.json({ status: "ok" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create knowledge base entries";
        console.error("Knowledge base POST failed", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
    const id = Number(context.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    }
    await softDeleteDocumentAndChunksById(id);
    return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
}
