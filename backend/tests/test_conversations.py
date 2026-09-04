import pytest


def test_create_and_list_conversations(client, auth_headers):
    # Create conversation
    create_res = client.post(
        "/api/conversations",
        headers=auth_headers,
        json={"title": "Python Discussion", "provider": "gemini", "model": "gemini-2.5-flash"},
    )
    assert create_res.status_code == 201
    conv = create_res.json()
    assert conv["title"] == "Python Discussion"
    assert conv["provider"] == "gemini"

    # List conversations
    list_res = client.get("/api/conversations", headers=auth_headers)
    assert list_res.status_code == 200
    conversations = list_res.json()
    assert len(conversations) >= 1
    assert any(c["id"] == conv["id"] for c in conversations)


def test_get_conversation_detail(client, auth_headers):
    create_res = client.post(
        "/api/conversations",
        headers=auth_headers,
        json={"title": "Detail Test", "provider": "openai", "model": "gpt-4o"},
    )
    conv_id = create_res.json()["id"]

    get_res = client.get(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == conv_id
    assert "messages" in data
    assert isinstance(data["messages"], list)


def test_update_conversation_title(client, auth_headers):
    create_res = client.post(
        "/api/conversations",
        headers=auth_headers,
        json={"title": "Initial Title"},
    )
    conv_id = create_res.json()["id"]

    update_res = client.patch(
        f"/api/conversations/{conv_id}",
        headers=auth_headers,
        json={"title": "Updated Title"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"


def test_delete_conversation(client, auth_headers):
    create_res = client.post(
        "/api/conversations",
        headers=auth_headers,
        json={"title": "To Be Deleted"},
    )
    conv_id = create_res.json()["id"]

    del_res = client.delete(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert del_res.status_code == 204

    get_res = client.get(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert get_res.status_code == 404
