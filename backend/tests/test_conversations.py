def test_create_and_get_conversations(client, auth_headers):
    # Create conversation
    res = client.post(
        "/api/conversations",
        json={"title": "Python Architecture", "provider": "gemini", "model": "gemini-2.5-flash"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    conv_data = res.json()
    assert conv_data["title"] == "Python Architecture"
    conv_id = conv_data["id"]

    # List conversations
    list_res = client.get("/api/conversations", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Search filter
    search_res = client.get("/api/conversations?q=Architecture", headers=auth_headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1

    # Update conversation
    patch_res = client.patch(
        f"/api/conversations/{conv_id}",
        json={"title": "Updated Architecture"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated Architecture"

    # Delete conversation
    del_res = client.delete(f"/api/conversations/{conv_id}", headers=auth_headers)
    assert del_res.status_code == 204
