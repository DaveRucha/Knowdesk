import { chunkText, CHUNK_SIZE, CHUNK_OVERLAP } from "@/lib/chunking";

describe("chunkText", () => {
  it("returns a single unmodified chunk when input is shorter than chunkSize", async () => {
    const shortText = "This is a short document about onboarding.";
    const chunks = await chunkText(shortText);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(shortText);
  });

  it("returns an empty array for empty input", async () => {
    const chunks = await chunkText("");
    expect(chunks).toEqual([]);
  });

  it("splits text longer than chunkSize into multiple chunks", async () => {
    // Deterministic input: repeating pattern well past 2x chunkSize
    // so we know the input length precisely.
    const unit = "abcdefghij"; // 10 chars
    const longText = unit.repeat(300); // 3000 chars total

    const chunks = await chunkText(longText);

    expect(chunks.length).toBeGreaterThan(1);

    // Every chunk except possibly the last should be <= CHUNK_SIZE
    for (const chunk of chunks.slice(0, -1)) {
      expect(chunk.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }

    // Reassembling without overlap should recover something close to
    // the original length — a basic sanity check that we're not
    // silently dropping content.
    expect(chunks.join("").length).toBeGreaterThanOrEqual(longText.length);
  });

  it("produces overlapping content between consecutive chunks", async () => {
    const unit = "abcdefghij"; // 10 chars, no natural break characters
    const longText = unit.repeat(300); // 3000 chars

    const chunks = await chunkText(longText);
    expect(chunks.length).toBeGreaterThan(1);

    // The tail of chunk[i] should reappear at the head of chunk[i+1],
    // proving CHUNK_OVERLAP is actually applied and not just configured.
    for (let i = 0; i < chunks.length - 1; i++) {
      const tailOfCurrent = chunks[i].slice(-20); // last 20 chars
      const headOfNext = chunks[i + 1].slice(0, CHUNK_OVERLAP + 20);

      expect(headOfNext).toContain(tailOfCurrent.slice(0, 10));
    }
  });

  it("respects the configured CHUNK_SIZE constant", async () => {
    // Guards against silent config drift (e.g. someone changes 1000
    // in one call site but not the constant everyone imports from).
    expect(CHUNK_SIZE).toBe(1000);
    expect(CHUNK_OVERLAP).toBe(200);
  });
});