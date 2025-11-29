import { Buffer } from "buffer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { KnowledgeBaseValidationError } from "./errors";

export interface ParsedPdfDocument {
  text: string;
  title: string | null;
  fileName: string | null;
  pageCount: number;
  info: Record<string, unknown> | null;
}

export interface ParsedDocxDocument {
  text: string;
  title: string | null;
  fileName: string | null;
  messages: Array<Record<string, unknown>>;
}

export interface ParsedTxtDocument {
  text: string;
  title: string | null;
  fileName: string | null;
}

export async function convertPdfToText(file: Blob): Promise<ParsedPdfDocument> {
  let buffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    throw new KnowledgeBaseValidationError("Failed to read uploaded PDF file");
  }

  let parsed;
  try {
    parsed = await pdfParse(buffer);
  } catch (error) {
    console.error("pdf-parse failed", error);
    throw new KnowledgeBaseValidationError("Failed to parse PDF file");
  }

  const extractedText = parsed.text?.trim();
  if (!extractedText) {
    throw new KnowledgeBaseValidationError("PDF does not contain extractable text");
  }

  const fileName = extractFileName(file);
  // const titleFromPdf = typeof parsed.info?.Title === "string" ? parsed.info.Title.trim() : "";
  const titleFromPdf = fileName? fileName.trim(): "";
  const normalizedInfo = normalizePdfInfo(parsed.info as Record<string, unknown> | undefined);
  console.log( titleFromPdf);
  return {
    text: extractedText,
    title: titleFromPdf || fileName || null,
    fileName,
    pageCount: typeof parsed.numpages === "number" ? parsed.numpages : 0,
    info: normalizedInfo,
  };
}

export async function convertDocxToText(file: Blob): Promise<ParsedDocxDocument> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new KnowledgeBaseValidationError("Failed to read uploaded DOCX file");
  }

  const buffer = Buffer.from(arrayBuffer);
  let rawText = "";
  let messages: any[] = [];
  try {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value?.trim() ?? "";
    messages = result.messages ?? [];
  } catch (error) {
    console.error("DOCX parsing failed", error);
    throw new KnowledgeBaseValidationError("Failed to parse DOCX file");
  }

  if (!rawText) {
    throw new KnowledgeBaseValidationError("DOCX does not contain extractable text");
  }

  const fileName = extractFileName(file);
  return {
    text: rawText,
    title: fileName,
    fileName,
    messages,
  };
}

export async function convertTxtToText(file: Blob): Promise<ParsedTxtDocument> {
  let contents: string;
  try {
    contents = await file.text();
  } catch {
    throw new KnowledgeBaseValidationError("Failed to read uploaded TXT file");
  }

  const normalized = contents.trim();
  if (!normalized) {
    throw new KnowledgeBaseValidationError("TXT file is empty");
  }

  const fileName = extractFileName(file);
  return {
    text: normalized,
    title: fileName,
    fileName,
  };
}

function extractFileName(file: Blob): string | null {
  // const maybeFile = file as File;
  // return typeof maybeFile?.name === "string" ? maybeFile.name : null;
  const maybeFile = file as File;
  if (typeof maybeFile?.name !== "string") return null;

  const name = maybeFile.name;
  // Match a dot followed by 1-5 alphanumeric chars at the very end
  return name.replace(/\.[a-zA-Z0-9]{1,5}$/, '');
}

function normalizePdfInfo(info?: Record<string, unknown>): Record<string, unknown> | null {
  if (!info) {
    return null;
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(info)) {
    if (value instanceof Date) {
      normalized[key] = value.toISOString();
    } else if (value === undefined) {
      normalized[key] = null;
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}
