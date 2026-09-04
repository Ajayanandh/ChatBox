import json
import os
import threading
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
from app.core.config import settings


class VectorDocument:
    def __init__(
        self,
        id: str,
        content: str,
        embedding: List[float],
        metadata: Dict[str, Any]
    ):
        self.id = id
        self.content = content
        self.embedding = embedding
        self.metadata = metadata

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "embedding": self.embedding,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VectorDocument":
        return cls(
            id=data["id"],
            content=data["content"],
            embedding=data["embedding"],
            metadata=data.get("metadata", {}),
        )


class BaseVectorStore(ABC):
    @abstractmethod
    async def add_documents(self, documents: List[VectorDocument]) -> None:
        pass

    @abstractmethod
    async def similarity_search(
        self,
        query_embedding: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete_document(self, document_id: str, user_id: str) -> None:
        pass

    @abstractmethod
    async def clear_user_documents(self, user_id: str) -> None:
        pass


class LocalVectorStore(BaseVectorStore):
    """
    Thread-safe persistent vector store with cosine similarity ranking.
    Modular design allows painless migration to Chroma, FAISS, or Qdrant.
    """
    def __init__(self, storage_path: str = None):
        self.storage_path = storage_path or os.path.join(settings.VECTOR_DIR, "vector_index.json")
        self._lock = threading.Lock()
        self._documents: Dict[str, VectorDocument] = {}
        self._load()

    def _load(self) -> None:
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        doc = VectorDocument.from_dict(item)
                        self._documents[doc.id] = doc
            except Exception as e:
                print(f"Warning: Could not load vector index: {e}")

    def _save(self) -> None:
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                data = [doc.to_dict() for doc in self._documents.values()]
                json.dump(data, f)
        except Exception as e:
            print(f"Warning: Could not save vector index: {e}")

    async def add_documents(self, documents: List[VectorDocument]) -> None:
        with self._lock:
            for doc in documents:
                self._documents[doc.id] = doc
            self._save()

    async def similarity_search(
        self,
        query_embedding: List[float],
        user_id: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        with self._lock:
            candidates: List[VectorDocument] = []
            for doc in self._documents.values():
                doc_user_id = doc.metadata.get("user_id")
                doc_id = doc.metadata.get("document_id")

                if doc_user_id != user_id:
                    continue

                if document_ids and doc_id not in document_ids:
                    continue

                candidates.append(doc)

            if not candidates:
                return []

            query_vec = np.array(query_embedding, dtype=np.float32)
            query_norm = np.linalg.norm(query_vec)
            if query_norm == 0:
                return []

            scored: List[Dict[str, Any]] = []
            for doc in candidates:
                doc_vec = np.array(doc.embedding, dtype=np.float32)
                # Handle vector dimension mismatch gracefully
                if len(doc_vec) != len(query_vec):
                    min_len = min(len(doc_vec), len(query_vec))
                    d_v = doc_vec[:min_len]
                    q_v = query_vec[:min_len]
                else:
                    d_v = doc_vec
                    q_v = query_vec

                d_norm = np.linalg.norm(d_v)
                q_n = np.linalg.norm(q_v)
                if d_norm > 0 and q_n > 0:
                    similarity = float(np.dot(d_v, q_v) / (d_norm * q_n))
                else:
                    similarity = 0.0

                scored.append({
                    "id": doc.id,
                    "content": doc.content,
                    "metadata": doc.metadata,
                    "score": similarity,
                })

            scored.sort(key=lambda x: x["score"], reverse=True)
            return scored[:top_k]

    async def delete_document(self, document_id: str, user_id: str) -> None:
        with self._lock:
            to_delete = [
                doc_id for doc_id, doc in self._documents.items()
                if doc.metadata.get("document_id") == document_id and doc.metadata.get("user_id") == user_id
            ]
            for doc_id in to_delete:
                del self._documents[doc_id]
            if to_delete:
                self._save()

    async def clear_user_documents(self, user_id: str) -> None:
        with self._lock:
            to_delete = [
                doc_id for doc_id, doc in self._documents.items()
                if doc.metadata.get("user_id") == user_id
            ]
            for doc_id in to_delete:
                del self._documents[doc_id]
            if to_delete:
                self._save()


vector_store = LocalVectorStore()
