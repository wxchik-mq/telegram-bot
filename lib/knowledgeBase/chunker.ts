import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

export interface TextChunk {
  text: string;
  start: number;
  end: number;
}

export function generateFixedSizeChunks(text: string, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const step = Math.max(chunkSize - overlap, 1);
  const totalLength = normalized.length;
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < totalLength) {
    const end = Math.min(totalLength, start + chunkSize);
    const slice = normalized.slice(start, end).trim();
    if (slice) {
      chunks.push({ text: slice, start, end });
    }
    if (end >= totalLength) {
      break;
    }
    start += step;
  }

  return chunks;
}

export function generateRecursiveChunks(text: string, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const separators = ["\n\n", "\n", " ", ""];
  const spans = splitRecursively(normalized, 0, separators, chunkSize);
  return applyChunkOverlap(spans, chunkSize, overlap);
}

function splitRecursively(
  text: string,
  startOffset: number,
  separators: string[],
  maxLength: number,
): TextChunk[] {
  if (text.length <= maxLength || separators.length === 0) {
    return [
      {
        text: text.trim(),
        start: startOffset,
        end: startOffset + text.length,
      },
    ].filter((chunk) => chunk.text.length > 0);
  }

  const [currentSeparator, ...restSeparators] = separators;
  if (!currentSeparator) {
    return hardSplit(text, startOffset, maxLength);
  }

  const segments = text.split(currentSeparator);
  const chunks: TextChunk[] = [];
  let cursor = startOffset;

  for (const segment of segments) {
    if (!segment) {
      cursor += currentSeparator.length;
      continue;
    }

    if (segment.length + currentSeparator.length <= maxLength) {
      const piece = segment.trim();
      if (piece) {
        const chunkEnd = cursor + segment.length;
        chunks.push({
          text: piece,
          start: cursor,
          end: chunkEnd,
        });
      }
    } else {
      const nested = splitRecursively(segment, cursor, restSeparators, maxLength);
      chunks.push(...nested);
    }

    cursor += segment.length + currentSeparator.length;
  }

  return chunks;
}

function hardSplit(text: string, startOffset: number, maxLength: number): TextChunk[] {
  const hardChunks: TextChunk[] = [];
  for (let index = 0; index < text.length; index += maxLength) {
    const slice = text.slice(index, index + maxLength);
    if (slice.trim()) {
      hardChunks.push({
        text: slice.trim(),
        start: startOffset + index,
        end: startOffset + index + slice.length,
      });
    }
  }
  return hardChunks;
}

function applyChunkOverlap(chunks: TextChunk[], chunkSize: number, overlap: number): TextChunk[] {
  if (!chunks.length) {
    return [];
  }

  const merged: TextChunk[] = [];
  let buffer = "";
  let bufferStart = chunks[0].start;

  const pushBuffer = (end: number) => {
    const trimmed = buffer.trim();
    if (trimmed) {
      merged.push({
        text: trimmed,
        start: bufferStart,
        end,
      });
    }
  };

  for (const chunk of chunks) {
    if (!buffer) {
      buffer = chunk.text;
      bufferStart = chunk.start;
      continue;
    }

    const withOverlap = buffer.slice(-overlap) + chunk.text;
    if (withOverlap.length > chunkSize) {
      const end = chunk.start;
      pushBuffer(end);
      buffer = chunk.text;
      bufferStart = chunk.start;
    } else {
      buffer = withOverlap;
    }
  }

  pushBuffer(chunks[chunks.length - 1].end);
  return merged;
}
