# Knowdesk

AI-powered company knowledge base. Employees ask questions in plain English and get instant, cited answers pulled from uploaded company documents and AI-generated SOPs. Unanswered questions are logged as documentation gaps instead of guessed at.

**[Live demo →](https://knowdesk.me)**

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791)
![Tests](https://img.shields.io/badge/tests-28%20passing-brightgreen)

---

## Features

- **RAG Q&A** — ask a question, get a streamed, cited answer from your company's actual documents
- **AI SOP generator** — describe a process in plain language, get a structured, searchable SOP back
- **Documentation gap tracking** — unanswered questions get logged for admin review instead of hallucinated
- **Multi-tenant** — each company's data is fully isolated, enforced at both the app layer and the database layer
- **Role-based access** — Admins manage content and analytics; Employees ask questions and browse SOPs

## Tech stack

| Layer | Tech |
|---|---|
| Frontend / API | Next.js 14 (App Router), TypeScript |
| Database | PostgreSQL + pgvector, Prisma |
| Background jobs | Redis + BullMQ (standalone worker process) |
| AI / RAG | OpenAI (`text-embedding-3-small`, `gpt-4o-mini`), LangChain.js |
| Storage | AWS S3 |
| Auth | NextAuth (Google OAuth) |
| Deployment | AWS EC2, GitHub Actions CI/CD |
| Testing | Jest, Supertest |

## Architecture

- **Two-layer tenant isolation** — every query is scoped by `organizationId` at the application layer *and* enforced independently by PostgreSQL Row Level Security, backed by a dedicated non-superuser DB role. `organizationId` always comes from the session token, never from request input.
- **Async document pipeline** — PDFs upload to S3, then a standalone worker process extracts text, chunks it (1000 chars / 200 overlap), embeds it, and stores vectors in pgvector.
- **Confidence-gated answers** — similarity matches below `0.63` are treated as unanswered rather than passed to the LLM as weak context.

## Getting started

```bash
git clone https://github.com/DaveRucha/Knowdesk.git
cd Knowdesk
pnpm install

# start Postgres + Redis
docker compose up -d

# copy and fill in your own values
cp .env.example .env

# run migrations
pnpm prisma migrate dev

# start the app and the background worker (separate terminals)
pnpm dev
pnpm worker
```

## Testing

```bash
pnpm test
```

28 tests across 7 suites — unit tests for chunking and confidence-threshold logic, plus Supertest integration tests against a real, RLS-protected Postgres test database covering tenant isolation, role enforcement, invite token replay/expiry, and SOP generation correctness.

## Project structure

```
src/
├── app/
│   ├── (protected)/     # dashboard, documents, sops, analytics, ask
│   └── api/              # auth, documents, sops, search, invites
├── lib/                  # prisma client, chunking, confidence logic, auth
server/
└── processors/           # BullMQ worker (pdfProcessor)
tests/                    # Jest + Supertest suite
```

## License

MIT

---

Built by [Rucha Dave](https://github.com/DaveRucha)