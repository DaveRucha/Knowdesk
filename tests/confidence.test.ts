import {
  filterConfidentChunks,
  CONFIDENCE_THRESHOLD,
  ChunkMatch,
} from "@/lib/confidence";

function makeChunk(overrides: Partial<ChunkMatch>): ChunkMatch {
  return {
    id: "chunk-id",
    content: "some content",
    documentId: "doc-id",
    similarity: 0,
    ...overrides,
  };
}

describe("filterConfidentChunks", () => {
  it("excludes chunks below the threshold", () => {
    const matches = [
      makeChunk({ id: "a", similarity: 0.5 }),
      makeChunk({ id: "b", similarity: 0.62 }),
    ];

    const result = filterConfidentChunks(matches);

    expect(result.confidentChunks).toHaveLength(0);
    expect(result.wasAnswered).toBe(false);
  });

  it("includes chunks at or above the threshold", () => {
    const matches = [
      makeChunk({ id: "a", similarity: 0.63 }),
      makeChunk({ id: "b", similarity: 0.9 }),
    ];

    const result = filterConfidentChunks(matches);

    expect(result.confidentChunks).toHaveLength(2);
    expect(result.wasAnswered).toBe(true);
  });

  it("treats the threshold boundary as inclusive (>=, not >)", () => {
    // Exact boundary case — the most likely off-by-one bug spot.
    const matches = [makeChunk({ id: "a", similarity: CONFIDENCE_THRESHOLD })];

    const result = filterConfidentChunks(matches);

    expect(result.confidentChunks).toHaveLength(1);
    expect(result.wasAnswered).toBe(true);
  });

  it("returns a mix — only the qualifying chunks survive, order preserved", () => {
    const matches = [
      makeChunk({ id: "high", similarity: 0.95 }),
      makeChunk({ id: "low", similarity: 0.1 }),
      makeChunk({ id: "mid-high", similarity: 0.7 }),
    ];

    const result = filterConfidentChunks(matches);

    expect(result.confidentChunks.map((c) => c.id)).toEqual([
      "high",
      "mid-high",
    ]);
  });

  it("reports confidence as the top match's similarity, even if it doesn't qualify", () => {
    // confidence should reflect the best available match regardless
    // of whether it cleared the threshold — this is what gets logged
    // to the Query table for the gaps dashboard.
    const matches = [
      makeChunk({ id: "a", similarity: 0.4 }),
      makeChunk({ id: "b", similarity: 0.2 }),
    ];

    const result = filterConfidentChunks(matches);

    expect(result.confidence).toBe(0.4);
    expect(result.wasAnswered).toBe(false);
  });

  it("returns confidence 0 and wasAnswered false for an empty match list", () => {
    const result = filterConfidentChunks([]);

    expect(result.confidence).toBe(0);
    expect(result.wasAnswered).toBe(false);
    expect(result.confidentChunks).toEqual([]);
  });

  it("respects a custom threshold override", () => {
    const matches = [makeChunk({ id: "a", similarity: 0.5 })];

    const result = filterConfidentChunks(matches, 0.4);

    expect(result.wasAnswered).toBe(true);
  });
});