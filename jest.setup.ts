jest.mock("openai", () => {
  const embeddingsCreate = jest.fn().mockResolvedValue({
    object: "list",
    data: [
      {
        object: "embedding",
        index: 0,
        embedding: new Array(1536).fill(0.001),
      },
    ],
    model: "text-embedding-3-small",
    usage: { prompt_tokens: 8, total_tokens: 8 },
  });

  // Handles both streaming and non-streaming calls. The search route
  // calls with { stream: true } and does `for await (const part of
  // completion)`, expecting chunks shaped like choices[0].delta.content
  // — a plain resolved object isn't async-iterable, so streaming
  // callers need a real async generator.
  const chatCompletionsCreate = jest.fn().mockImplementation((args?: { stream?: boolean }) => {
    if (args?.stream) {
      const mockStream = async function* () {
        yield {
          id: "chatcmpl-test-fixture",
          object: "chat.completion.chunk",
          created: 1700000000,
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              delta: { content: "This is a mocked assistant response." },
              finish_reason: null,
            },
          ],
        };
        yield {
          id: "chatcmpl-test-fixture",
          object: "chat.completion.chunk",
          created: 1700000000,
          model: "gpt-4o-mini",
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        };
      }
      return mockStream();
    }

    return Promise.resolve({
      id: "chatcmpl-test-fixture",
      object: "chat.completion",
      created: 1700000000,
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "This is a mocked assistant response.",
          },
          finish_reason: "stop",
          logprobs: null,
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });
  });

  const MockOpenAI = jest.fn().mockImplementation(() => ({
    embeddings: { create: embeddingsCreate },
    chat: { completions: { create: chatCompletionsCreate } },
  }));
  return { __esModule: true, default: MockOpenAI };
});