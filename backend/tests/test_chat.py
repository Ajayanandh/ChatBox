import json
import pytest
from app.models.conversation import Conversation
from app.models.message import Message


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "database" in data
    assert "providers" in data


def test_chat_message_flow(client, auth_headers, test_user, db_session):
    # 1. Create conversation
    conv = Conversation(
        user_id=test_user.id,
        title="Test Chat",
        provider="gemini",
        model="gemini-2.5-flash",
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    # 2. Add message directly
    msg = Message(
        conversation_id=conv.id,
        role="user",
        content="Hello, what is 10 + 20?",
    )
    db_session.add(msg)
    db_session.commit()
    db_session.refresh(msg)

    # 3. Test messages list
    res = client.get(f"/api/conversations/{conv.id}/messages", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["content"] == "Hello, what is 10 + 20?"

    # 4. Test delete message
    del_res = client.delete(f"/api/messages/{msg.id}", headers=auth_headers)
    assert del_res.status_code == 204
