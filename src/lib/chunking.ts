import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;

/**
 * Splits raw text into overlapping chunks for embedding/retrieval.
 * Pure function — no I/O, no side effects. Shared by pdfProcessor.ts
 * and the SOP generation route so both paths chunk identically.
 */
export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  return splitter.splitText(text);
}