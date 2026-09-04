from typing import List, Dict, Any


class TextChunk:
    def __init__(self, content: str, chunk_index: int, metadata: Dict[str, Any] = None):
        self.content = content
        self.chunk_index = chunk_index
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "chunk_index": self.chunk_index,
            "metadata": self.metadata,
        }


class RecursiveTextChunker:
    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100, separators: List[str] = None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "! ", "? ", "; ", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """Recursively split text using hierarchy of separators."""
        final_chunks: List[str] = []
        if not separators:
            return [text]

        separator = separators[0]
        new_separators = separators[1:]

        if separator == "":
            # Split character by character if needed
            return [text[i:i + self.chunk_size] for i in range(0, len(text), self.chunk_size - self.chunk_overlap)]

        splits = text.split(separator)
        current_doc: List[str] = []
        total_len = 0

        for s in splits:
            s_len = len(s)
            if total_len + s_len + (len(separator) if current_doc else 0) <= self.chunk_size:
                current_doc.append(s)
                total_len += s_len + (len(separator) if current_doc else 0)
            else:
                if current_doc:
                    doc_text = separator.join(current_doc).strip()
                    if doc_text:
                        final_chunks.append(doc_text)
                    # Handle overlap by keeping trailing parts
                    overlap_doc = []
                    overlap_len = 0
                    for prev_s in reversed(current_doc):
                        if overlap_len + len(prev_s) <= self.chunk_overlap:
                            overlap_doc.insert(0, prev_s)
                            overlap_len += len(prev_s) + len(separator)
                        else:
                            break
                    current_doc = overlap_doc
                    total_len = sum(len(x) for x in current_doc) + max(0, len(current_doc) - 1) * len(separator)

                if s_len > self.chunk_size:
                    # Recursive split on deeper separators
                    sub_chunks = self._split_text(s, new_separators)
                    final_chunks.extend(sub_chunks)
                else:
                    current_doc.append(s)
                    total_len += s_len + (len(separator) if current_doc else 0)

        if current_doc:
            doc_text = separator.join(current_doc).strip()
            if doc_text:
                final_chunks.append(doc_text)

        return final_chunks

    def chunk_document(
        self,
        text: str,
        document_id: str,
        user_id: str,
        filename: str
    ) -> List[TextChunk]:
        """Split document text into indexed chunks with full metadata."""
        if not text or not text.strip():
            return []

        raw_chunks = self._split_text(text.strip(), self.separators)
        chunks: List[TextChunk] = []

        for idx, chunk_content in enumerate(raw_chunks):
            cleaned = chunk_content.strip()
            if len(cleaned) < 15:  # skip trivial whitespace or fragments
                continue
            metadata = {
                "document_id": document_id,
                "user_id": user_id,
                "filename": filename,
                "chunk_index": idx,
                "char_count": len(cleaned),
            }
            chunks.append(TextChunk(content=cleaned, chunk_index=idx, metadata=metadata))

        return chunks


text_chunker = RecursiveTextChunker()
