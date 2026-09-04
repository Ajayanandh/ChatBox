import pytest
import os
import tempfile
from app.services.rag.chunker import RecursiveTextChunker
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vector_store import LocalVectorStore, VectorDocument


def test_chunker_basic():
    chunker = RecursiveTextChunker(chunk_size=100, chunk_overlap=20)
    sample_text = "This is a test paragraph. " * 10
    chunks = chunker.chunk_document(
        text=sample_text,
        document_id="doc_1",
        user_id="user_1",
        filename="test.txt",
    )
    assert len(chunks) > 1
    assert chunks[0].metadata["document_id"] == "doc_1"
    assert chunks[0].chunk_index == 0


@pytest.mark.asyncio
async def test_vector_store_in_memory():
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_path = os.path.join(tmpdir, "test_vector.json")
        vs = LocalVectorStore(storage_path=storage_path)

    emb1 = [1.0, 0.0, 0.0]
    emb2 = [0.0, 1.0, 0.0]

    doc1 = VectorDocument(
        id="chunk_1",
        content="Artificial intelligence and machine learning overview.",
        embedding=emb1,
        metadata={"user_id": "u1", "document_id": "d1"},
    )
    doc2 = VectorDocument(
        id="chunk_2",
        content="Cooking recipes and baking tips.",
        embedding=emb2,
        metadata={"user_id": "u1", "document_id": "d2"},
    )

    await vs.add_documents([doc1, doc2])

    # Search for something close to emb1
    query_emb = [0.9, 0.1, 0.0]
    results = await vs.similarity_search(query_embedding=query_emb, user_id="u1", top_k=1)
    assert len(results) == 1
    assert "Artificial intelligence" in results[0]["content"]

    # Delete doc1
    await vs.delete_document("d1", "u1")
    results2 = await vs.similarity_search(query_embedding=query_emb, user_id="u1", top_k=2)
    assert len(results2) == 1
    assert "Cooking recipes" in results2[0]["content"]
