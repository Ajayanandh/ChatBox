import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ChatRequest, ChatResponse, RegenerateRequest
from app.schemas.message import MessageResponse
from app.services.ai.factory import ai_factory
from app.services.ai.prompt import build_system_prompt
from app.services.rag.service import rag_service
from app.services.memory.service import memory_service
from app.services.tools.registry import tool_registry

router = APIRouter(tags=["Chat"])


def generate_title_from_message(msg: str) -> str:
    cleaned = msg.strip().replace("\n", " ")
    if len(cleaned) <= 30:
        return cleaned
    return cleaned[:30].rsplit(" ", 1)[0] + "..."


@router.post("/chat", response_model=ChatResponse)
async def chat_sync(
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if chat_in.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == chat_in.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        title = generate_title_from_message(chat_in.message)
        conv = Conversation(
            user_id=current_user.id,
            title=title,
            provider=chat_in.provider or "gemini",
            model=chat_in.model or "gemini-2.5-flash",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=chat_in.message.strip(),
    )
    db.add(user_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    memories = []
    if chat_in.use_memory:
        memories = memory_service.get_user_memories(db, current_user.id)

    retrieved_sources = []
    if chat_in.document_ids or len(chat_in.message.split()) > 2:
        try:
            retrieved_sources = await rag_service.retrieve_context(
                query=chat_in.message,
                user_id=current_user.id,
                document_ids=chat_in.document_ids,
                top_k=4,
                provider=chat_in.provider,
            )
        except Exception:
            retrieved_sources = []

    tools_used = []
    tool_augmented_prompt = ""
    math_pattern = re.search(r"(?:calculate|compute|what is|solve)\s+([\d\s\+\-\*\/\^\(\)\.\%eEsqrt|sin|cos|tan|pi]+)\??", chat_in.message, re.IGNORECASE)
    if chat_in.use_tools and math_pattern:
        expr = math_pattern.group(1).strip()
        if any(c in expr for c in "+-*/^%"):
            tool_res = await tool_registry.execute("calculator", {"expression": expr})
            if tool_res.get("success"):
                tools_used.append({"tool": "calculator", "input": expr, "output": tool_res.get("result")})
                tool_augmented_prompt = f"\n[Calculator Tool Result for '{expr}']: {tool_res.get('result')}\n"

    system_prompt = build_system_prompt(
        memories=memories,
        retrieved_context=retrieved_sources,
    )
    if tool_augmented_prompt:
        system_prompt += tool_augmented_prompt

    history_records = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()

    formatted_history = [{"role": m.role, "content": m.content} for m in history_records]

    provider = ai_factory.get_provider(chat_in.provider or conv.provider)
    model_name = chat_in.model or conv.model

    try:
        ai_result = await provider.generate_response(
            messages=formatted_history,
            model=model_name,
            system_prompt=system_prompt,
            temperature=chat_in.temperature or 0.7,
        )
        ai_content = ai_result.get("content", "")
    except Exception as e:
        ai_content = f"Error generating response: {str(e)}"

    asst_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=ai_content,
    )
    db.add(asst_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(asst_msg)

    implicit_mem = memory_service.extract_implicit_memory(chat_in.message)
    if implicit_mem:
        k, v = implicit_mem
        memory_service.add_memory(db, current_user.id, k, v)

    return ChatResponse(
        message=MessageResponse.model_validate(asst_msg),
        conversation_id=conv.id,
        sources=retrieved_sources if retrieved_sources else None,
        tools_used=tools_used if tools_used else None,
    )


@router.post("/chat/stream")
async def chat_stream(
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_new_conv = False
    if chat_in.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == chat_in.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        is_new_conv = True
        title = generate_title_from_message(chat_in.message)
        conv = Conversation(
            user_id=current_user.id,
            title=title,
            provider=chat_in.provider or "gemini",
            model=chat_in.model or "gemini-2.5-flash",
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    conv_id = conv.id
    conv_title = conv.title
    provider_name = chat_in.provider or conv.provider
    model_name = chat_in.model or conv.model

    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=chat_in.message.strip(),
    )
    db.add(user_msg)
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()

    memories = []
    if chat_in.use_memory:
        memories = memory_service.get_user_memories(db, current_user.id)

    retrieved_sources = []
    if chat_in.document_ids or len(chat_in.message.split()) > 2:
        try:
            retrieved_sources = await rag_service.retrieve_context(
                query=chat_in.message,
                user_id=current_user.id,
                document_ids=chat_in.document_ids,
                top_k=4,
                provider=provider_name,
            )
        except Exception:
            retrieved_sources = []

    tools_used = []
    tool_augmented_prompt = ""
    math_pattern = re.search(r"(?:calculate|compute|what is|solve)\s+([\d\s\+\-\*\/\^\(\)\.\%eEsqrt|sin|cos|tan|pi]+)\??", chat_in.message, re.IGNORECASE)
    if chat_in.use_tools and math_pattern:
        expr = math_pattern.group(1).strip()
        if any(c in expr for c in "+-*/^%"):
            tool_res = await tool_registry.execute("calculator", {"expression": expr})
            if tool_res.get("success"):
                tools_used.append({"tool": "calculator", "input": expr, "output": tool_res.get("result")})
                tool_augmented_prompt = f"\n[Calculator Tool Result for '{expr}']: {tool_res.get('result')}\n"

    system_prompt = build_system_prompt(
        memories=memories,
        retrieved_context=retrieved_sources,
    )
    if tool_augmented_prompt:
        system_prompt += tool_augmented_prompt

    history_records = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()

    formatted_history = [{"role": m.role, "content": m.content} for m in history_records]

    implicit_mem = memory_service.extract_implicit_memory(chat_in.message)
    if implicit_mem:
        k, v = implicit_mem
        memory_service.add_memory(db, current_user.id, k, v)

    async def sse_event_stream():
        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conv_id, 'title': conv_title, 'is_new': is_new_conv})}\n\n"

        if retrieved_sources:
            yield f"data: {json.dumps({'type': 'sources', 'sources': retrieved_sources})}\n\n"

        if tools_used:
            for t in tools_used:
                yield f"data: {json.dumps({'type': 'tool', 'tool': t})}\n\n"

        full_content = ""
        provider = ai_factory.get_provider(provider_name)

        try:
            async for chunk in provider.generate_stream(
                messages=formatted_history,
                model=model_name,
                system_prompt=system_prompt,
                temperature=chat_in.temperature or 0.7,
            ):
                chunk_type = chunk.get("type")
                if chunk_type == "content":
                    content_piece = chunk.get("content", "")
                    full_content += content_piece
                    yield f"data: {json.dumps({'type': 'content', 'content': content_piece})}\n\n"
                elif chunk_type == "error":
                    err_msg = chunk.get("error", "Unknown error")
                    yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
                    full_content = f"Error: {err_msg}"
                elif chunk_type == "done":
                    break
        except Exception as e:
            err_msg = str(e)
            yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
            full_content = f"Error generating response: {err_msg}"

        from app.database.session import SessionLocal
        save_db = SessionLocal()
        try:
            asst_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=full_content,
            )
            save_db.add(asst_msg)
            c = save_db.query(Conversation).filter(Conversation.id == conv_id).first()
            if c:
                c.updated_at = datetime.now(timezone.utc)
            save_db.commit()
            save_db.refresh(asst_msg)
            asst_msg_id = asst_msg.id
            created_at = asst_msg.created_at.isoformat()
        finally:
            save_db.close()

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id, 'message_id': asst_msg_id, 'created_at': created_at})}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/regenerate")
async def chat_regenerate(
    regen_in: RegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(
        Conversation.id == regen_in.conversation_id,
        Conversation.user_id == current_user.id,
    ).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    last_msg = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.desc()).first()

    if last_msg and last_msg.role == "assistant":
        db.delete(last_msg)
        db.commit()

    last_user_msg = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.role == "user"
    ).order_by(Message.created_at.desc()).first()

    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message to regenerate from")

    provider_name = regen_in.provider or conv.provider
    model_name = regen_in.model or conv.model

    memories = []
    if regen_in.use_memory:
        memories = memory_service.get_user_memories(db, current_user.id)

    system_prompt = build_system_prompt(memories=memories)

    history_records = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at.asc()).all()

    formatted_history = [{"role": m.role, "content": m.content} for m in history_records]

    async def sse_event_stream():
        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conv.id, 'title': conv.title})}\n\n"

        full_content = ""
        provider = ai_factory.get_provider(provider_name)

        try:
            async for chunk in provider.generate_stream(
                messages=formatted_history,
                model=model_name,
                system_prompt=system_prompt,
                temperature=regen_in.temperature or 0.7,
            ):
                chunk_type = chunk.get("type")
                if chunk_type == "content":
                    content_piece = chunk.get("content", "")
                    full_content += content_piece
                    yield f"data: {json.dumps({'type': 'content', 'content': content_piece})}\n\n"
                elif chunk_type == "error":
                    err_msg = chunk.get("error", "Unknown error")
                    yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
                    full_content = f"Error: {err_msg}"
                elif chunk_type == "done":
                    break
        except Exception as e:
            err_msg = str(e)
            yield f"data: {json.dumps({'type': 'error', 'error': err_msg})}\n\n"
            full_content = f"Error generating response: {err_msg}"

        from app.database.session import SessionLocal
        save_db = SessionLocal()
        try:
            asst_msg = Message(
                conversation_id=conv.id,
                role="assistant",
                content=full_content,
            )
            save_db.add(asst_msg)
            c = save_db.query(Conversation).filter(Conversation.id == conv.id).first()
            if c:
                c.updated_at = datetime.now(timezone.utc)
            save_db.commit()
            save_db.refresh(asst_msg)
            asst_msg_id = asst_msg.id
            created_at = asst_msg.created_at.isoformat()
        finally:
            save_db.close()

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv.id, 'message_id': asst_msg_id, 'created_at': created_at})}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    msg = db.query(Message).join(Conversation).filter(
        Message.id == message_id,
        Conversation.user_id == current_user.id,
    ).first()

    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    db.delete(msg)
    db.commit()
    return None
