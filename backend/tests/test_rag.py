import io
import pytest
from app.services.rag.chunker import RecursiveTextChunker
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vector_store import LocalVectorStore, VectorDocument


def test_chunker_basic():
    chunker = RecursiveTextChunker(chunk_size=100, chunk_overlap=20)
    sample_text = (
        "FastAPI is a modern, fast web framework for building APIs with Python. "
        "It is based on standard Python type hints. "
        "Next.js is a React framework for building full-stack web applications."
    )
    chunks = chunker.chunk_document(
        text=sample_text,
        document_id="doc_1",
        user_id="user_1",
        filename="overview.txt",
    )
    assert len(chunks) >= 1
    assert chunks[0].metadata["document_id"] == "doc_1"


@pytest.mark.asyncio
async def test_embeddings_fallback():
    embedder = EmbeddingService()
    vec = await embedder.get_embedding("Test search text")
    assert len(vec) == 384
    assert any(x != 0.0 for x in vec)


@pytest.mark.asyncio
async def test_vector_store_operations():
    vs = LocalVectorStore(storage_path="./data/test_vectors.json")
    doc = VectorDocument(
        id="doc_1_chunk_0",
        content="Python is great for AI backend development",
        embedding=[0.1] * 384,
        metadata={"user_id": "test_user_id", "document_id": "doc_1", "filename": "test.txt"},
    )
    await vs.add_documents([doc])

    results = await vs.similarity_search(
        query_embedding=[0.1] * 384,
        user_id="test_user_id",
        top_k=2,
    )
    assert len(results) == 1
    assert results[0]["id"] == "doc_1_chunk_0"
    assert results[0]["score"] > 0.99

    await vs.delete_document("doc_1", "test_user_id")
    results_after = await vs.similarity_search(
        query_embedding=[0.1] * 384,
        user_id="test_user_id",
    )
    assert len(results_after) == 0


def test_document_upload_api(client, auth_headers):
    file_content = b"This is a test document uploaded via FastAPI endpoint."
    files = {"file": ("test_doc.txt", io.BytesIO(file_content), "text/plain")}
    res = client.post("/api/documents/upload", files=files, headers=auth_headers)
    assert res.status_code == 201
    doc_id = res.json()["id"]

    list_res = client.get("/api/documents", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(d["id"] == doc_id for d in list_res.json())

    del_res = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert del_res.status_code == 204
