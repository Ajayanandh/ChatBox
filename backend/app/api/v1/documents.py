import os
import re
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.rag.service import rag_service

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "md", "markdown"}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal or unsafe characters."""
    clean = re.sub(r"[^\w\s\.-]", "_", os.path.basename(filename))
    return clean.strip() or "uploaded_file"


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document (PDF, DOCX, TXT, MD), chunk, embed, and index for RAG."""
    filename = file.filename or "uploaded_document"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type .{ext}. Allowed formats: PDF, DOCX, TXT, MD.",
        )

    # Read content and check file size
    contents = await file.read()
    file_size = len(contents)
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Generate safe storage path
    doc_id = str(uuid.uuid4())
    safe_name = sanitize_filename(filename)
    saved_filename = f"{doc_id}_{safe_name}"
    saved_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(saved_path, "wb") as f:
        f.write(contents)

    # Ingest document into RAG
    try:
        chunk_count = await rag_service.ingest_document(
            file_path=saved_path,
            file_type=ext,
            filename=safe_name,
            document_id=doc_id,
            user_id=current_user.id,
        )
    except Exception as e:
        if os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process document content: {str(e)}",
        )

    # Save to database
    doc_record = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=safe_name,
        file_type=ext,
        file_size=file_size,
        file_path=saved_path,
        chunk_count=chunk_count,
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    return DocumentResponse.model_validate(doc_record)


@router.get("", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all indexed documents for the current user."""
    docs = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document and remove its embeddings from vector search."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Remove physical file if exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Remove vector chunks
    await rag_service.delete_document(doc.id, current_user.id)

    db.delete(doc)
    db.commit()
    return None
