import { Prisma } from "@prisma/client";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import { prisma } from "../db/prisma";
import { generateFixedSizeChunks } from "./chunker";
import { convertDocxToText, convertPdfToText, convertTxtToText } from "./documentParser";
import { KnowledgeBaseNotFoundError, KnowledgeBaseValidationError } from "./errors";
export { KnowledgeBaseNotFoundError, KnowledgeBaseValidationError } from "./errors";
import type { DocumentDao, KnowledgeBaseDao } from "./types";

type KnowledgeBaseRecord = Record<string, unknown>;

export interface KnowledgeBaseChunksResponseDto {
  id: number;
  text: string;
  metadata: any;
  documentType?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const KNOWLEDGE_BASE_TABLE = Prisma.sql`"knowledge_base"`;
const TEXT_COLUMN = Prisma.sql`"text"`;
const EMBEDDING_COLUMN = Prisma.sql`"embedding"`;
const METADATA_COLUMN = Prisma.sql`"metadata"`;
const DOCUMENT_ID_COLUMN = Prisma.sql`"documentId"`;
const CHUNK_INDEX_COLUMN = Prisma.sql`"chunkIndex"`;
const CREATED_AT_COLUMN = Prisma.sql`"createdAt"`;
const UPDATED_AT_COLUMN = Prisma.sql`"updatedAt"`;
const ID_COLUMN = Prisma.sql`"id"`;

let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

interface DocumentEmbeddingInput {
  documentType: string;
  text: string;
  title?: string | null;
  fileName?: string | null;
  metadata?: any;
}

export async function createKnowledgeBaseEntries(
  documentType: string,
  data: any,
) {
  let documents: DocumentDao[];
  switch (documentType) {
    case "faq": {
      const records = data as KnowledgeBaseRecord[];
      if (!records?.length) {
        return;
      }
      documents = await generateFaqWithEmbedding(records);
      break;
    }
    case "pdf": {
      if (!(data instanceof Blob)) {
        throw new KnowledgeBaseValidationError("PDF payload missing file data");
      }
      const parsedPdf = await convertPdfToText(data);
      const documentDao = await generateDocumentEmbeddings({
        documentType: "pdf",
        text: parsedPdf.text,
        title: parsedPdf.title ?? parsedPdf.fileName,
        fileName: parsedPdf.fileName,
        metadata: {
          documentType: "pdf",
          fileName: parsedPdf.fileName,
          title: parsedPdf.title,
          pageCount: parsedPdf.pageCount,
          info: parsedPdf.info,
        },
      })
      documents = [documentDao];
      break;
    }
    case "docx": {
      if (!(data instanceof Blob)) {
        throw new KnowledgeBaseValidationError("DOCX payload missing file data");
      }
      const parsedDocx = await convertDocxToText(data);
      const documentDao = await generateDocumentEmbeddings({
        documentType: "docx",
        text: parsedDocx.text,
        title: parsedDocx.title ?? parsedDocx.fileName,
        fileName: parsedDocx.fileName,
        metadata: {
          documentType: "docx",
          fileName: parsedDocx.fileName,
          title: parsedDocx.title,
          messages: parsedDocx.messages,
        },
      })
      documents = [documentDao];
      break;
    }
    case "txt": {
      if (!(data instanceof Blob)) {
        throw new KnowledgeBaseValidationError("TXT payload missing file data");
      }
      const parsedTxt = await convertTxtToText(data);
      const documentDao = await generateDocumentEmbeddings({
        documentType: "txt",
        text: parsedTxt.text,
        title: parsedTxt.title ?? parsedTxt.fileName,
        fileName: parsedTxt.fileName,
        metadata: {
          documentType: "txt",
          fileName: parsedTxt.fileName,
          title: parsedTxt.title ?? parsedTxt.fileName,
        },
      })
      documents = [documentDao];
      break;
    }
    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }

  if (!documents.length) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const document of documents) {
      await saveDocumentWithChunks(tx, document);
    }
  });
}

export async function listKnowledgeBaseEntries(documentType?: string): Promise<KnowledgeBaseChunksResponseDto[]> {
  const entries = await prisma.knowledgeBase.findMany({
    where: documentType
      ? {
        document: {
          documentType,
        },
      }
      : undefined,
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      text: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      document: {
        select: {
          documentType: true,
          metadata: true,
        },
      },
    },
  });

  return entries.map((entry) => ({
    id: entry.id,
    text: entry.text,
    metadata: entry.document?.metadata ?? entry.metadata,
    documentType: entry.document?.documentType ?? null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));
}

export async function updateKnowledgeBaseEntry(
  id: number,
  updateDto: KnowledgeBaseRecord,
): Promise<KnowledgeBaseChunksResponseDto> {
  const existing = await prisma.knowledgeBase.findUnique({
    where: { id },
    select: {
      documentId: true,
      document: {
        select: {
          id: true,
          documentType: true,
        },
      },
    },
  });

  if (!existing) {
    throw new KnowledgeBaseNotFoundError(id);
  }

  const documentType = existing.document?.documentType;
  if (!documentType || !existing.documentId) {
    throw new KnowledgeBaseValidationError("Unsupported document type");
  }

  let documentPayload: DocumentDao;
  switch (documentType) {
    case "faq": {
      const faqEntries = await generateFaqWithEmbedding([updateDto]);
      if (!faqEntries.length) {
        throw new KnowledgeBaseValidationError("Embedding service returned an empty vector");
      }
      documentPayload = faqEntries[0];
      break;
    }
    default:
      throw new KnowledgeBaseValidationError(`Unsupported document type: ${documentType}`);
  }

  const chunkPayload = documentPayload.chunks[0];
  if (!chunkPayload?.embedding?.length) {
    throw new KnowledgeBaseValidationError("Embedding service returned an empty vector");
  }

  const metadataJson = JSON.stringify(chunkPayload.metadata ?? {});
  const vectorLiteral = Prisma.raw(`'[${chunkPayload.embedding.join(",")}]'`);

  const { rows: updatedRows, documentMetadata } = await prisma.$transaction(async (tx) => {
    const updatedDocument = await tx.document.update({
      where: { id: existing.documentId },
      data: {
        documentType,
        title: documentPayload.documentTitle ?? null,
        metadata: documentPayload.documentMetadata ?? Prisma.JsonNull,
      },
      select: {
        metadata: true,
      },
    });

    const rows = await tx.$queryRaw<
      {
        id: number;
        text: string;
        metadata: Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
      }[]
    >(Prisma.sql`
      UPDATE ${KNOWLEDGE_BASE_TABLE}
      SET ${TEXT_COLUMN} = ${chunkPayload.text},
          ${EMBEDDING_COLUMN} = ${vectorLiteral}::vector,
          ${METADATA_COLUMN} = ${metadataJson}::jsonb,
          ${UPDATED_AT_COLUMN} = NOW()
    WHERE ${ID_COLUMN} = ${id}
      RETURNING ${ID_COLUMN} AS id, ${TEXT_COLUMN} AS text, ${METADATA_COLUMN} AS metadata, ${CREATED_AT_COLUMN} AS "createdAt", ${UPDATED_AT_COLUMN} AS "updatedAt"
    `);

    return {
      rows,
      documentMetadata: updatedDocument.metadata ?? Prisma.JsonNull,
    };
  });

  const updated = updatedRows[0];
  if (!updated) {
    throw new KnowledgeBaseNotFoundError(id);
  }

  return {
    id: updated.id,
    text: updated.text,
    metadata: documentMetadata ?? updated.metadata,
    documentType,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function retrieveRelevantKnowledge(query: string, limit = 3, threshold = 0.6) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || limit <= 0) {
    return [];
  }

  const embeddings = getEmbeddingsInstance();
  const vector = await embeddings.embedQuery(trimmedQuery);
  if (!vector?.length) {
    return [];
  }

  const vectorLiteral = Prisma.raw(`'[${vector.join(",")}]'`);
  const results = await prisma.$queryRaw<
    {
      text: string;
      chunkMetadata: Prisma.JsonValue;
      documentMetadata: Prisma.JsonValue;
      similarity: number;
    }[]
  >(Prisma.sql`
    SELECT kb."text" AS text,
           kb."metadata" AS "chunkMetadata",
           d."metadata" AS "documentMetadata",
           kb."embedding" <=> ${vectorLiteral}::vector AS similarity
    FROM "knowledge_base" kb
    INNER JOIN "documents" d ON d."id" = kb."documentId"
    WHERE (kb."embedding" <=> ${vectorLiteral}::vector) < ${threshold}
    ORDER BY similarity
    LIMIT ${limit}
  `);

  return results
    .map(({ text, chunkMetadata, documentMetadata, similarity }) => {
      if (typeof text !== "string") {
        return null;
      }
      // console.log(`Retrieved document with distance: ${similarity}, ${text}, ${chunkMetadata}, ${documentMetadata}`);
      return new Document<any>({
        pageContent: text,
        metadata: documentMetadata ?? chunkMetadata ?? Prisma.JsonNull,
      });
    })
    .filter((doc): doc is Document => doc !== null);
}

export async function deleteDocumentEntry(id: number) {
  await prisma.document.delete({
    where: { id },
  });
  await deleteKnowledgeBaseEntry(id);
}

async function deleteKnowledgeBaseEntry(id: number) {
  await prisma.knowledgeBase.deleteMany({
    where: { documentId: id },
  });
}

async function saveDocumentWithChunks(tx: Prisma.TransactionClient, documentDao: DocumentDao) {
  if (!documentDao.chunks?.length) {
    throw new KnowledgeBaseValidationError("Document has no chunks to persist");
  }

  const validChunks = documentDao.chunks.filter((chunk) => {
    if (!chunk.embedding?.length) {
      console.warn("Skipping chunk with empty embedding", chunk.metadata);
      return false;
    }
    return true;
  });

  if (!validChunks.length) {
    throw new KnowledgeBaseValidationError("Embedding service did not return usable vectors");
  }

  const document = await tx.document.create({
    data: {
      documentType: documentDao.documentType,
      title: documentDao.documentTitle ?? null,
      metadata: documentDao.documentMetadata ?? Prisma.JsonNull,
    },
    select: {
      id: true,
    },
  });

  for (const chunk of validChunks) {
    const metadataJson = JSON.stringify(chunk.metadata ?? {});
    const vectorLiteral = Prisma.raw(`'[${chunk.embedding.join(",")}]'`);
    const chunkIndex = typeof chunk.chunkIndex === "number" ? chunk.chunkIndex : 0;

    await tx.$executeRaw`
      INSERT INTO ${KNOWLEDGE_BASE_TABLE} (${DOCUMENT_ID_COLUMN}, ${CHUNK_INDEX_COLUMN}, ${TEXT_COLUMN}, ${EMBEDDING_COLUMN}, ${METADATA_COLUMN}, ${CREATED_AT_COLUMN}, ${UPDATED_AT_COLUMN})
      VALUES (${document.id}, ${chunkIndex}, ${chunk.text}, ${vectorLiteral}::vector, ${metadataJson}::jsonb, NOW(), NOW())
    `;
  }
}

async function generateFaqWithEmbedding(faqRecords: KnowledgeBaseRecord[]): Promise<DocumentDao[]> {
  const embeddings = getEmbeddingsInstance();
  const faqEntries: { question: string; answer: string; text: string }[] = [];

  for (const record of faqRecords) {
    const questionField = (record.question as string)?.trim();
    const answerField = (record.answer as string)?.trim();
    if (!questionField || !answerField) {
      continue;
    }

    faqEntries.push({
      question: questionField,
      answer: answerField,
      text: `Question: ${questionField}\nAnswer: ${answerField}`,
    });
  }

  if (!faqEntries.length) {
    return [];
  }

  const vectors = await embeddings.embedDocuments(faqEntries.map((entry) => entry.text));
  if (!vectors?.length) {
    throw new Error("Embedding service did not return usable vectors");
  }

  return faqEntries.map((entry, index) => ({
    documentType: "faq",
    documentTitle: entry.question,
    documentMetadata: {
      documentType: "faq",
      question: entry.question,
      answer: entry.answer,
    },
    chunks: [
      {
        metadata: {},
        chunkIndex: 0,
        text: entry.text,
        embedding: vectors[index],
      },
    ],
  }));
}

async function generateDocumentEmbeddings(input: DocumentEmbeddingInput): Promise<DocumentDao> {
  const normalizedText = input.text.trim();
  if (!normalizedText) {
    throw new KnowledgeBaseValidationError(`Document text is empty for type ${input.documentType}`);
  }

  const chunks = generateFixedSizeChunks(normalizedText);
  if (!chunks.length) {
    throw new KnowledgeBaseValidationError(`${input.documentType.toUpperCase()} document did not produce any chunks`);
  }

  const embeddings = await getEmbeddingsInstance().embedDocuments(chunks.map((chunk) => chunk.text));
  if (!embeddings?.length || embeddings.length !== chunks.length) {
    throw new Error("Embedding service did not return usable vectors");
  }

  const documentMetadata =
    input.metadata ??
    {
      documentType: input.documentType,
      fileName: input.fileName,
      title: input.title,
    };

  return {
    documentType: input.documentType,
    documentTitle: input.title ?? input.fileName,
    documentMetadata,
    chunks: chunks.map((chunk, index) => ({
      metadata: {
        chunkIndex: index,
        charStart: chunk.start,
        charEnd: chunk.end,
      },
      chunkIndex: index,
      text: chunk.text,
      embedding: embeddings[index],
    })),
  };
}

function getEmbeddingsInstance() {
  if (embeddingsInstance) {
    return embeddingsInstance;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY in environment");
  }

  embeddingsInstance = new GoogleGenerativeAIEmbeddings({
    apiKey,
    model: "models/gemini-embedding-001",
  });

  return embeddingsInstance;
}
