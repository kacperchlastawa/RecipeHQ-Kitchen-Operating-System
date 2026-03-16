import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    """
        Test kompletnego przepływu: Rejestracja -> Logowanie -> Dostęp do chronionego zasobu.
        """
    user_credentials = {
        "login": "test_chef_1",
        "password": "strong_password_123",
        "repeat_password": "strong_password_123"
    }
    #1.TEST REJESTRACJI
    reg_response = await client.post("/api/v1/auth", json=user_credentials)
    assert reg_response.status_code == 201
    assert reg_response.json()["login"] == user_credentials["login"]

    #2. TEST LOGOWANIA
    login_data = {
        "username":user_credentials["login"],
        "password":user_credentials["password"]
    }
    login_response = await client.post("/api/v1/login", data=login_data)
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    assert token is not None

    #3.TEST DOSTĘPU
    headers = {"Authorization": f"Bearer {token}"}
    me_response = await client.get("/api/v1/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["login"] == user_credentials["login"]

    @pytest.mark.asyncio
    async def test_register_duplicate_login_fails(client: AsyncClient):
        """Sprawdza, czy system blokuje rejestrację dwóch kucharzy o tym samym loginie."""
        user_data = {
            "login": "clone_chef",
            "password": "password123",
            "repeat_password": "password123"
        }

        # Pierwszy raz - sukces
        await client.post("/api/v1/auth", json=user_data)

        # Drugi raz - błąd 400
        response = await client.post("/api/v1/auth", json=user_data)
        assert response.status_code == 400
        assert response.json()["detail"] == "User with this login already exists"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(client: AsyncClient):
        """Sprawdza, czy błędne hasło poprawnie odrzuca logowanie."""
        login_data = {
            "username": "non_existent_chef",
            "password": "wrong_password"
        }
        response = await client.post("/api/v1/login", data=login_data)
        assert response.status_code == 401
        assert "WWW-Authenticate" in response.headers