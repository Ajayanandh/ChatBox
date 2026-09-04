from typing import List, Dict, Any, Optional
from app.services.rag.parser import document_parser
from app.services.rag.chunker import text_chunker
from app.services.rag.embeddings import embedding_service
from app.services.rag.vector_store import vector_store, VectorDocument


class RAGService:
    def __init__(self):
        self.parser = document_parser
        self.chunker = text_chunker
        self.embeddings = embedding_service
        self.vector_store = vector_store

    async def ingest_document(
        self,
        file_path: str,
        file_type: str,
        filename: str,
        document_id: str,
        user_id: str,
        provider: Optional[str] = None,
    ) -> int:
        """Extract text, chunk, embed, and store document chunks."""
        text = self.parser.extract_text(file_path, file_type)
        if not text:
            return 0

        chunks = self.chunker.chunk_document(
            text=text,
            document_id=document_id,
            user_id=user_id,
            filename=filename,
        )
        if not chunks:
            return 0

        chunk_texts = [c.content for c in chunks]
        embeddings = await self.embeddings.get_embeddings(chunk_texts, provider=provider)

        vector_docs: List[VectorDocument] = []
        for chunk, emb in zip(chunks, embeddings):
            doc_chunk_id = f"{document_id}_chunk_{chunk.chunk_index}"
            vector_docs.append(
                VectorDocument(
                    id=doc_chunk_id,
                    content=chunk.content,
                    embedding=emb,
                    metadata=chunk.metadata,
                )
            )

        await self.vector_store.add_documents(vector_docs)
        return len(vector_docs)

    async def retrieve_context(
        self,
        query: str,
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 4,
        provider: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for user query."""
        if not query or not query.strip():
            return []

        query_embedding = await self.embeddings.get_embedding(query, provider=provider)
        results = await self.vector_store.similarity_search(
            query_embedding=query_embedding,
            user_id=user_id,
            document_ids=document_ids,
            top_k=top_k,
        )
        return results

    async def delete_document(self, document_id: str, user_id: str) -> None:
        await self.vector_store.delete_document(document_id, user_id)

    async def clear_user_documents(self, user_id: str) -> None:
        await self.vector_store.clear_user_documents(user_id)


rag_service = RAGService()
