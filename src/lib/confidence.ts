export const CONFIDENCE_THRESHOLD = 0.63;

export interface ChunkMatch {
  id: string;
  content: string;
  documentId: string | null;
  similarity: number;
}

export interface ConfidenceFilterResult {
  confidentChunks: ChunkMatch[];
  wasAnswered: boolean;
  confidence: number;
}

/**
 * Filters raw similarity matches down to chunks that clear the
 * confidence threshold, and reports whether the top match was
 * confident enough to answer at all.
 *
 * Pure function — no I/O. Shared by the search route (to decide
 * whether to answer) and used identically for logging query
 * confidence/wasAnswered to the Query table.
 */
export function filterConfidentChunks(
  matches: ChunkMatch[],
  threshold: number = CONFIDENCE_THRESHOLD,
): ConfidenceFilterResult {
  const confidentChunks = matches.filter(
    (chunk) => Number(chunk.similarity) >= threshold,
  );
  const wasAnswered = confidentChunks.length > 0;
  const confidence = Number(matches[0]?.similarity ?? 0);

  return { confidentChunks, wasAnswered, confidence };
}