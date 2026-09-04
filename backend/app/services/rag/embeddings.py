import hashlib
import math
from typing import List, Optional
import numpy as np
from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self.embedding_dim = 384  # Standard vector dimension

    def _fallback_embedding(self, text: str) -> List[float]:
        """Generate a deterministic normalized semantic hash vector as fallback."""
        vec = np.zeros(self.embedding_dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            return vec.tolist()

        for word in words:
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self.embedding_dim
            sign = 1.0 if ((h >> 8) % 2 == 0) else -1.0
            vec[idx] += sign

        # Add 3-gram char hashes for subword sensitivity
        for i in range(len(text) - 2):
            gram = text[i:i+3].lower()
            h = int(hashlib.sha256(gram.encode("utf-8")).hexdigest(), 16)
            idx = h % self.embedding_dim
            sign = 0.5 if ((h >> 4) % 2 == 0) else -0.5
            vec[idx] += sign

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def get_embedding(self, text: str, provider: Optional[str] = None) -> List[float]:
        """Get embedding vector for a single text chunk."""
        embeddings = await self.get_embeddings([text], provider=provider)
        return embeddings[0] if embeddings else self._fallback_embedding(text)

    async def get_embeddings(self, texts: List[str], provider: Optional[str] = None) -> List[List[float]]:
        """Get embeddings for a list of texts using available AI provider or fallback."""
        if not texts:
            return []

        # Try OpenAI if configured
        if (provider == "openai" or not provider) and settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                resp = await client.embeddings.create(
                    model="text-embedding-3-small",
                    input=texts
                )
                return [item.embedding for item in resp.data]
            except Exception:
                pass

        # Try Gemini if configured
        if (provider == "gemini" or not provider) and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                results = []
                for text in texts:
                    res = genai.embed_content(
                        model="models/text-embedding-004",
                        content=text,
                        task_type="retrieval_document"
                    )
                    results.append(res["embedding"])
                return results
            except Exception:
                pass

        # Robust Fallback
        return [self._fallback_embedding(t) for t in texts]


embedding_service = EmbeddingService()
