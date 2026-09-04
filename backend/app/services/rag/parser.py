import os
from typing import Tuple
import pypdf
import docx


class DocumentParser:
    @staticmethod
    def parse_pdf(file_path: str) -> str:
        """Extract text from a PDF file."""
        text_parts = []
        try:
            reader = pypdf.PdfReader(file_path)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text_parts.append(f"--- Page {page_num + 1} ---\n{page_text.strip()}")
            return "\n\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    @staticmethod
    def parse_docx(file_path: str) -> str:
        """Extract text from a DOCX file."""
        try:
            doc = docx.Document(file_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX document: {str(e)}")

    @staticmethod
    def parse_text(file_path: str) -> str:
        """Extract text from a TXT or Markdown file."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read().strip()
        except Exception as e:
            raise ValueError(f"Failed to parse text document: {str(e)}")

    @classmethod
    def extract_text(cls, file_path: str, file_type: str) -> str:
        """Extract text based on file extension / type."""
        ext = file_type.lower().strip(".")
        if ext == "pdf":
            return cls.parse_pdf(file_path)
        elif ext in ("docx", "doc"):
            return cls.parse_docx(file_path)
        elif ext in ("txt", "md", "markdown", "json", "csv"):
            return cls.parse_text(file_path)
        else:
            raise ValueError(f"Unsupported file format: .{ext}")


document_parser = DocumentParser()
