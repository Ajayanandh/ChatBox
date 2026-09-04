import pytest


def test_create_and_get_memory(client, auth_headers):
    # Add memory
    res = client.post(
        "/api/memory",
        headers=auth_headers,
        json={"key": "Favorite Language", "value": "Python"},
    )
    assert res.status_code == 201
    mem = res.json()
    assert mem["key"] == "Favorite Language"
    assert mem["value"] == "Python"

    # List memories
    list_res = client.get("/api/memory", headers=auth_headers)
    assert list_res.status_code == 200
    mems = list_res.json()
    assert any(m["key"] == "Favorite Language" for m in mems)


def test_sensitive_memory_rejected(client, auth_headers):
    res = client.post(
        "/api/memory",
        headers=auth_headers,
        json={"key": "api_key", "value": "sk-1234567890abcdef12345678"},
    )
    assert res.status_code == 400
    assert "sensitive" in res.json()["detail"].lower()


def test_delete_memory(client, auth_headers):
    res = client.post(
        "/api/memory",
        headers=auth_headers,
        json={"key": "Temp Note", "value": "To be cleared"},
    )
    mem_id = res.json()["id"]

    del_res = client.delete(f"/api/memory/{mem_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_clear_all_memories(client, auth_headers):
    client.post("/api/memory", headers=auth_headers, json={"key": "K1", "value": "V1"})
    client.post("/api/memory", headers=auth_headers, json={"key": "K2", "value": "V2"})

    del_res = client.delete("/api/memory", headers=auth_headers)
    assert del_res.status_code == 200

    list_res = client.get("/api/memory", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 0
