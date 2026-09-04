import pytest
from app.models.message import Message


def test_delete_message(client, auth_headers, db_session):
    # Create conversation
    c_res = client.post("/api/conversations", headers=auth_headers, json={"title": "Msg Test"})
    conv_id = c_res.json()["id"]

    msg = Message(
        conversation_id=conv_id,
        role="user",
        content="Test delete this message",
    )
    db_session.add(msg)
    db_session.commit()
    db_session.refresh(msg)
    msg_id = msg.id

    del_res = client.delete(f"/api/messages/{msg_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "providers" in data
