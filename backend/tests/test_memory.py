def test_memory_crud_and_safety(client, auth_headers):
    # 1. Create memory
    res = client.post(
        "/api/memory",
        json={"key": "Favorite Language", "value": "Python and TypeScript"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    mem_id = res.json()["id"]
    assert res.json()["key"] == "Favorite Language"

    # 2. Sensitive memory rejection
    sec_res = client.post(
        "/api/memory",
        json={"key": "My Secret Password", "value": "supersecret123"},
        headers=auth_headers,
    )
    assert sec_res.status_code == 400

    # 3. List memories
    list_res = client.get("/api/memory", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Delete specific memory
    del_res = client.delete(f"/api/memory/{mem_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # 5. Clear all memories
    clear_res = client.delete("/api/memory", headers=auth_headers)
    assert clear_res.status_code == 200
