"""Backend tests for SmartLegal-AI.

Covers:
- Health check
- Document upload (PDF / non-PDF / empty-text PDF)
- Document list / get / delete
- Query (RAG) + history
- Cached analyses: risks, clauses, summary
- Compare
- DOCX report download
"""
from __future__ import annotations

import io
import os
import time
from pathlib import Path

import pytest
import requests
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://strategy-hub-169.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
LONG = 120  # seconds for LLM calls


# ---------- helpers ----------
def _contract_pdf(name: str = "TEST_NDA.pdf") -> tuple[str, bytes]:
    """Build a small multi-page contract PDF using reportlab."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    pages = [
        [
            "MUTUAL NON-DISCLOSURE AGREEMENT",
            "This Mutual Non-Disclosure Agreement (\"Agreement\") is entered into as of January 15, 2026,",
            "by and between Acme Corp, a Delaware corporation (\"Disclosing Party\"), and Globex Inc.,",
            "a California corporation (\"Receiving Party\"). Each party may disclose Confidential Information.",
            "1. CONFIDENTIALITY. The Receiving Party shall hold in strict confidence all Confidential",
            "Information for a period of five (5) years from the Effective Date and shall not disclose it",
            "to any third party without prior written consent. Permitted use is limited to evaluation.",
            "2. TERM. This Agreement commences on the Effective Date and continues for two (2) years,",
            "with automatic renewal for successive one-year terms unless either party gives 60 days notice.",
        ],
        [
            "3. PAYMENT. The Receiving Party shall pay a one-time fee of USD 25,000 within 30 days of",
            "invoice. Late payments accrue interest at 1.5% per month. All fees are non-refundable.",
            "4. INTELLECTUAL PROPERTY. All pre-existing IP remains the property of its owner. Any",
            "derivative works created hereunder shall be jointly owned. No license is granted except as",
            "expressly set forth in this Agreement.",
            "5. TERMINATION. Either party may terminate this Agreement for material breach with 30 days",
            "written notice and opportunity to cure. Upon termination, the Receiving Party shall return or",
            "destroy all Confidential Information.",
        ],
        [
            "6. LIABILITY. IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY EXCEED USD 100,000.",
            "NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.",
            "7. INDEMNIFICATION. Receiving Party shall indemnify and hold harmless Disclosing Party from",
            "any claims arising out of unauthorized disclosure or misuse of Confidential Information.",
            "8. GOVERNING LAW. This Agreement is governed by the laws of the State of Delaware, without",
            "regard to conflicts of law principles. Any dispute shall be resolved by binding arbitration",
            "in Wilmington, Delaware under JAMS rules.",
            "9. ASSIGNMENT. Neither party may assign this Agreement without prior written consent, except",
            "to a successor in a merger or acquisition.",
            "10. WARRANTIES. EACH PARTY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING",
            "MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.",
        ],
    ]
    for page_lines in pages:
        y = 750
        for line in page_lines:
            c.drawString(50, y, line)
            y -= 18
        c.showPage()
    c.save()
    buf.seek(0)
    return name, buf.getvalue()


def _blank_pdf() -> bytes:
    """Blank (image-less, text-less) PDF."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    c.showPage()
    c.save()
    return buf.getvalue()


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def uploaded_doc(session):
    name, pdf = _contract_pdf("TEST_contract_A.pdf")
    r = session.post(f"{API}/documents/upload", files={"file": (name, pdf, "application/pdf")}, timeout=60)
    assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["status"] == "ready"
    assert data["pages"] >= 2
    yield data
    # teardown
    try:
        session.delete(f"{API}/documents/{data['id']}", timeout=30)
    except Exception:
        pass


@pytest.fixture(scope="session")
def second_doc(session):
    name, pdf = _contract_pdf("TEST_contract_B.pdf")
    r = session.post(f"{API}/documents/upload", files={"file": (name, pdf, "application/pdf")}, timeout=60)
    assert r.status_code == 200
    data = r.json()
    yield data
    try:
        session.delete(f"{API}/documents/{data['id']}", timeout=30)
    except Exception:
        pass


# ---------- Health ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("app") == "SmartLegal-AI"
        assert body.get("status") == "ok"


# ---------- Upload ----------
class TestUpload:
    def test_upload_pdf_success(self, uploaded_doc):
        assert "id" in uploaded_doc and isinstance(uploaded_doc["id"], str)
        assert uploaded_doc["name"].endswith(".pdf")
        assert uploaded_doc["pages"] >= 2
        assert uploaded_doc["chars"] > 0
        assert uploaded_doc["status"] == "ready"
        assert "uploaded_at" in uploaded_doc

    def test_reject_non_pdf(self, session):
        r = session.post(
            f"{API}/documents/upload",
            files={"file": ("TEST_bad.txt", b"hello world", "text/plain")},
            timeout=30,
        )
        assert r.status_code == 400

    def test_reject_empty_text_pdf(self, session):
        pdf = _blank_pdf()
        r = session.post(
            f"{API}/documents/upload",
            files={"file": ("TEST_blank.pdf", pdf, "application/pdf")},
            timeout=30,
        )
        assert r.status_code == 400


# ---------- List / Get / Delete ----------
class TestDocuments:
    def test_list_documents(self, session, uploaded_doc):
        r = session.get(f"{API}/documents", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert any(row["id"] == uploaded_doc["id"] for row in rows)
        for row in rows:
            assert "_id" not in row  # no Mongo _id
            assert set(["id", "name", "pages", "chars", "uploaded_at", "status"]).issubset(row.keys())
        # sort desc by uploaded_at
        ts = [row["uploaded_at"] for row in rows]
        assert ts == sorted(ts, reverse=True)

    def test_get_document(self, session, uploaded_doc):
        r = session.get(f"{API}/documents/{uploaded_doc['id']}", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == uploaded_doc["id"]
        assert d["pages"] == uploaded_doc["pages"]

    def test_get_unknown_404(self, session):
        r = session.get(f"{API}/documents/not-a-real-id", timeout=30)
        assert r.status_code == 404

    def test_delete_doc_flow(self, session):
        # create a throwaway doc and delete it
        name, pdf = _contract_pdf("TEST_to_delete.pdf")
        up = session.post(f"{API}/documents/upload", files={"file": (name, pdf, "application/pdf")}, timeout=60)
        assert up.status_code == 200
        did = up.json()["id"]
        dr = session.delete(f"{API}/documents/{did}", timeout=30)
        assert dr.status_code == 200
        assert dr.json() == {"deleted": did}
        g = session.get(f"{API}/documents/{did}", timeout=30)
        assert g.status_code == 404


# ---------- Query + History ----------
class TestQuery:
    def test_empty_question_400(self, session, uploaded_doc):
        r = session.post(f"{API}/documents/{uploaded_doc['id']}/query", json={"question": "   "}, timeout=30)
        assert r.status_code == 400

    def test_query_success_with_citations(self, session, uploaded_doc):
        r = session.post(
            f"{API}/documents/{uploaded_doc['id']}/query",
            json={"question": "What is the liability cap and governing law of this contract?"},
            timeout=LONG,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        for key in ("id", "document_id", "question", "answer", "citations", "timestamp"):
            assert key in data
        assert data["document_id"] == uploaded_doc["id"]
        assert isinstance(data["answer"], str) and len(data["answer"]) > 0
        assert isinstance(data["citations"], list) and len(data["citations"]) > 0
        for cit in data["citations"]:
            assert "page" in cit and "quote" in cit
            assert isinstance(cit["page"], int)
        assert "_id" not in data

    def test_history(self, session, uploaded_doc):
        r = session.get(f"{API}/documents/{uploaded_doc['id']}/history", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert len(rows) >= 1
        assert all("_id" not in row for row in rows)
        assert all(row["document_id"] == uploaded_doc["id"] for row in rows)


# ---------- Cached analyses ----------
class TestAnalyses:
    def test_risks_cached(self, session, uploaded_doc):
        r1 = session.post(f"{API}/documents/{uploaded_doc['id']}/analyze/risks", timeout=LONG)
        assert r1.status_code == 200, r1.text
        a1 = r1.json()
        assert a1["type"] == "risks"
        assert a1["document_id"] == uploaded_doc["id"]
        assert "risks" in a1.get("data", {})
        assert isinstance(a1["data"]["risks"], list)

        r2 = session.post(f"{API}/documents/{uploaded_doc['id']}/analyze/risks", timeout=30)
        assert r2.status_code == 200
        a2 = r2.json()
        # Cache: identical id across calls
        assert a1["id"] == a2["id"]

    def test_clauses_cached(self, session, uploaded_doc):
        r1 = session.post(f"{API}/documents/{uploaded_doc['id']}/analyze/clauses", timeout=LONG)
        assert r1.status_code == 200, r1.text
        a1 = r1.json()
        assert a1["type"] == "clauses"
        assert "categories" in a1.get("data", {})
        r2 = session.post(f"{API}/documents/{uploaded_doc['id']}/analyze/clauses", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["id"] == a1["id"]

    def test_summary_cached(self, session, uploaded_doc):
        r1 = session.post(f"{API}/documents/{uploaded_doc['id']}/analyze/summary", timeout=LONG)
        assert r1.status_code == 200, r1.text
        a1 = r1.json()
        assert a1["type"] == "summary"
        data = a1.get("data", {})
        assert "overview" in data
        r2 = session.post(f"{API}/documents/{uploaded_doc['id']}/analyze/summary", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["id"] == a1["id"]


# ---------- Compare ----------
class TestCompare:
    def test_compare_two_docs(self, session, uploaded_doc, second_doc):
        r = session.post(
            f"{API}/documents/compare",
            json={"doc1_id": uploaded_doc["id"], "doc2_id": second_doc["id"], "aspect": "liability and termination"},
            timeout=LONG,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["doc1"]["id"] == uploaded_doc["id"]
        assert data["doc2"]["id"] == second_doc["id"]
        assert "summary" in data
        assert "rows" in data and isinstance(data["rows"], list)


# ---------- Report ----------
class TestReport:
    def test_download_report_docx(self, session, uploaded_doc):
        r = session.get(f"{API}/documents/{uploaded_doc['id']}/report", timeout=60)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "officedocument.wordprocessingml.document" in ct
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd.lower()
        assert ".docx" in cd
        # docx files start with PK zip signature
        assert r.content[:2] == b"PK"

    def test_report_without_analyses(self, session):
        # fresh doc without any analyses
        name, pdf = _contract_pdf("TEST_report_only.pdf")
        up = session.post(f"{API}/documents/upload", files={"file": (name, pdf, "application/pdf")}, timeout=60)
        did = up.json()["id"]
        try:
            r = session.get(f"{API}/documents/{did}/report", timeout=60)
            assert r.status_code == 200
            assert r.content[:2] == b"PK"
            assert "officedocument.wordprocessingml.document" in r.headers.get("content-type", "")
        finally:
            session.delete(f"{API}/documents/{did}", timeout=30)
