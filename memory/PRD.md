# SmartLegal-AI — PRD

## Original Problem Statement
User shared a pitch deck (`vntr_ppt.pdf`) for **SmartLegal-AI**, an intelligent contract & legal document analyzer powered by RAG. Request: "analyze and build a plan that will implement in final completely fine working model. plan completely before building". User answered "Assume default and proceed" to the clarification, so defaults were used.

## Tagline / Brand
- Name: SmartLegal-AI
- Tagline: "Intelligent Contract & Legal Document Analyzer"
- Organization: EzChip Pvt Limited (internship edition, 2026)

## Architecture (defaults chosen)
- **Frontend**: React (CRA) + Tailwind + Shadcn tokens, dark theme with pink/red accents, Cormorant Garamond (headings) + IBM Plex Sans/Mono, grain texture + glass-morphism nav.
- **Backend**: FastAPI (Python) with MongoDB via motor.
- **LLM**: OpenAI **GPT-4o** via `emergentintegrations` + `EMERGENT_LLM_KEY`.
- **Retrieval**: BM25 (rank-bm25) over per-page chunks — no external vector DB, no embedding key needed.
- **Report**: `python-docx` generates downloadable `.docx`.
- **Auth**: None (single-user demo). User can later opt into JWT or Emergent Google Auth.

## User Personas
- Legal professionals (lawyers, paralegals) triaging contracts.
- SMEs / contract managers who can't afford large legal review hours.
- Business owners reviewing vendor/partner agreements before signing.

## Core Requirements (static)
1. Upload PDF contracts and ingest them for analysis.
2. Natural-language Q&A with page-level citations.
3. Risk detection with severity (High/Medium/Low) and recommendations.
4. Clause extraction grouped by category (NDA, Payment, IP, Termination, Liability, etc.).
5. Executive summary with parties/dates/obligations/red flags.
6. Side-by-side multi-document comparison.
7. Downloadable Word report consolidating all analyses.

## Implemented (v1.0 — 2026-01)
- [x] PDF upload + text extraction (`pypdf`) + page-preserving chunking
- [x] BM25-powered RAG Q&A with `[Page N]` inline citations
- [x] Chat history persistence per document
- [x] Cached AI analyses: Risks / Clauses / Executive Summary (stored in `analyses` collection)
- [x] Side-by-side document comparison with verdict per aspect
- [x] `.docx` report download consolidating summary, risks, and clauses
- [x] Dashboard with drag-and-drop upload, document archive, delete
- [x] Document viewer with 4 tabs (Q&A · Risks · Clauses · Summary)
- [x] Compare page with document selectors + aspect focus
- [x] Premium dark aesthetic (Cormorant Garamond + IBM Plex Sans/Mono, pink/red #E11D48 accents, grain + glass)
- [x] 100% backend test coverage (17/17 pytest cases)

## API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/ | Health |
| POST | /api/documents/upload | Upload PDF |
| GET | /api/documents | List docs |
| GET | /api/documents/{id} | Metadata |
| DELETE | /api/documents/{id} | Delete doc + history + analyses |
| POST | /api/documents/{id}/query | RAG Q&A |
| GET | /api/documents/{id}/history | Past Q&A |
| POST | /api/documents/{id}/analyze/risks | Risk analysis (cached) |
| POST | /api/documents/{id}/analyze/clauses | Clause extraction (cached) |
| POST | /api/documents/{id}/analyze/summary | Executive summary (cached) |
| POST | /api/documents/compare | Side-by-side compare |
| GET | /api/documents/{id}/report | .docx download |

## Backlog (prioritized)
### P1
- Auth (JWT or Emergent Google Auth) for multi-user history.
- Scanned PDF support (OCR via Tesseract / Vision LLM).
- Unique index on `analyses` `(document_id, type)` to prevent race duplicates.

### P2
- Move chunks/page_texts to a dedicated collection to avoid 16MB BSON bloat on large PDFs.
- Pre-tokenize & cache BM25 index per document.
- PDF viewer pane with in-document highlighting of cited passages.
- Batch upload / folders / tags.
- Email/Slack export of reports; share-link generation.

### P3
- Fine-tuning of clause templates per industry.
- DOCX / TXT input (non-PDF).
- Red-line / suggest-edit mode (produces marked-up counter-draft).

## Next Action Items
- Decide on auth strategy and enable multi-user mode.
- Add OCR fallback so scanned contracts also work.
- Harden caching: unique index on analyses, BM25 caching for large docs.
