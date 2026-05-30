"""Backend API tests for bar order tracking + inventory management app."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://drink-stock-hub-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@bar.nl"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Auth tests ----
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data["token"], str) and len(data["token"]) > 10
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"

    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self, auth):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

    def test_me_unauthorized(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_menu_unauthorized(self):
        assert requests.get(f"{BASE_URL}/api/menu").status_code == 401

    def test_inventory_unauthorized(self):
        assert requests.get(f"{BASE_URL}/api/inventory").status_code == 401

    def test_orders_unauthorized(self):
        assert requests.get(f"{BASE_URL}/api/orders").status_code == 401


# ---- Categories ----
class TestCategories:
    def test_categories(self, auth):
        r = requests.get(f"{BASE_URL}/api/categories", headers=auth)
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) == 5
        assert set(cats) == {"Frisdrank", "Non alcoholisch Bier", "Alcohol", "Snacks", "Eten"}


# ---- Menu seeded ----
class TestMenuSeed:
    def test_menu_seed_count_and_prices(self, auth):
        r = requests.get(f"{BASE_URL}/api/menu", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 18, f"expected 18 seeded items, got {len(items)}"
        by_name = {i["name"]: i for i in items}
        assert by_name["Coca Cola"]["price"] == 2.00
        assert by_name["Coca Cola"]["category"] == "Frisdrank"
        assert by_name["Naturel Chips"]["price"] == 1.50
        assert by_name["Naturel Chips"]["category"] == "Snacks"
        assert by_name["Affligem Blond 0.0"]["price"] == 2.50
        assert by_name["Affligem Blond 0.0"]["category"] == "Non alcoholisch Bier"
        # Each item has inventory_id linked
        for i in items:
            assert i.get("inventory_id"), f"{i['name']} missing inventory_id"


class TestInventorySeed:
    def test_inventory_seed(self, auth):
        r = requests.get(f"{BASE_URL}/api/inventory", headers=auth)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 18
        for it in items:
            assert it["loose_units"] == 0
            assert it["trays_in_storage"] == 0
            assert it["units_per_tray"] == 0


# ---- Menu CRUD ----
class TestMenuCRUD:
    def test_menu_crud(self, auth):
        # create inventory link first
        inv = requests.post(f"{BASE_URL}/api/inventory", headers=auth, json={
            "name": "TEST_LinkedInv", "category": "Frisdrank",
        }).json()
        inv_id = inv["id"]

        c = requests.post(f"{BASE_URL}/api/menu", headers=auth, json={
            "name": "TEST_Drink", "category": "Frisdrank", "price": 3.5, "inventory_id": inv_id
        })
        assert c.status_code == 200
        created = c.json()
        assert created["name"] == "TEST_Drink"
        assert created["inventory_id"] == inv_id
        mid = created["id"]

        # Verify GET shows it
        all_items = requests.get(f"{BASE_URL}/api/menu", headers=auth).json()
        assert any(i["id"] == mid for i in all_items)

        u = requests.put(f"{BASE_URL}/api/menu/{mid}", headers=auth, json={
            "name": "TEST_Drink2", "category": "Frisdrank", "price": 4.0, "inventory_id": inv_id
        })
        assert u.status_code == 200
        assert u.json()["name"] == "TEST_Drink2"
        assert u.json()["price"] == 4.0

        d = requests.delete(f"{BASE_URL}/api/menu/{mid}", headers=auth)
        assert d.status_code == 200

        # cleanup inv
        requests.delete(f"{BASE_URL}/api/inventory/{inv_id}", headers=auth)


# ---- Inventory CRUD ----
class TestInventoryCRUD:
    def test_inventory_crud(self, auth):
        c = requests.post(f"{BASE_URL}/api/inventory", headers=auth, json={
            "name": "TEST_Inv", "category": "Alcohol",
            "loose_units": 5, "trays_in_storage": 2, "units_per_tray": 12,
        })
        assert c.status_code == 200
        created = c.json()
        assert created["loose_units"] == 5
        assert created["trays_in_storage"] == 2
        assert created["units_per_tray"] == 12
        iid = created["id"]

        u = requests.put(f"{BASE_URL}/api/inventory/{iid}", headers=auth, json={
            "name": "TEST_Inv2", "category": "Alcohol",
            "loose_units": 10, "trays_in_storage": 3, "units_per_tray": 24,
        })
        assert u.status_code == 200
        data = u.json()
        assert data["loose_units"] == 10
        assert data["trays_in_storage"] == 3
        assert data["units_per_tray"] == 24

        d = requests.delete(f"{BASE_URL}/api/inventory/{iid}", headers=auth)
        assert d.status_code == 200


# ---- Tables CRUD ----
class TestTablesCRUD:
    def test_tables_crud(self, auth):
        c = requests.post(f"{BASE_URL}/api/tables", headers=auth, json={
            "name": "TEST_T1", "x": 150.5, "y": 200.0, "seats": 6
        })
        assert c.status_code == 200
        created = c.json()
        assert created["x"] == 150.5
        assert created["y"] == 200.0
        assert created["seats"] == 6
        tid = created["id"]

        u = requests.put(f"{BASE_URL}/api/tables/{tid}", headers=auth, json={
            "name": "TEST_T1_upd", "x": 300, "y": 400, "seats": 8
        })
        assert u.status_code == 200
        assert u.json()["x"] == 300
        assert u.json()["name"] == "TEST_T1_upd"

        d = requests.delete(f"{BASE_URL}/api/tables/{tid}", headers=auth)
        assert d.status_code == 200


# ---- Orders + inventory decrement ----
class TestOrdersAndDecrement:
    def test_inventory_decrement_with_tray_conversion(self, auth):
        # Create inventory item with loose=2, trays=2, per_tray=6
        inv = requests.post(f"{BASE_URL}/api/inventory", headers=auth, json={
            "name": "TEST_DecrInv", "category": "Frisdrank",
            "loose_units": 2, "trays_in_storage": 2, "units_per_tray": 6,
        }).json()
        inv_id = inv["id"]

        # Create linked menu item
        menu = requests.post(f"{BASE_URL}/api/menu", headers=auth, json={
            "name": "TEST_DecrItem", "category": "Frisdrank", "price": 1.0, "inventory_id": inv_id
        }).json()
        mid = menu["id"]

        # Order qty=5
        o = requests.post(f"{BASE_URL}/api/orders", headers=auth, json={
            "table_name": "Bar", "items": [
                {"menu_item_id": mid, "name": "TEST_DecrItem", "price": 1.0, "qty": 5}
            ]
        })
        assert o.status_code == 200
        order = o.json()
        assert order["status"] == "open"
        assert order["total"] == 5.0
        order_id = order["id"]

        # Verify decrement: expected loose=3, trays=1
        all_inv = requests.get(f"{BASE_URL}/api/inventory", headers=auth).json()
        upd = next(i for i in all_inv if i["id"] == inv_id)
        assert upd["loose_units"] == 3, f"expected 3 loose, got {upd['loose_units']}"
        assert upd["trays_in_storage"] == 1, f"expected 1 tray, got {upd['trays_in_storage']}"

        # Filter open orders
        open_orders = requests.get(f"{BASE_URL}/api/orders?status=open", headers=auth).json()
        assert any(x["id"] == order_id for x in open_orders)

        # Pay
        p = requests.post(f"{BASE_URL}/api/orders/{order_id}/pay", headers=auth)
        assert p.status_code == 200
        assert p.json()["status"] == "paid"

        # Filter paid
        paid = requests.get(f"{BASE_URL}/api/orders?status=paid", headers=auth).json()
        assert any(x["id"] == order_id for x in paid)

        # Verify open no longer contains
        open_again = requests.get(f"{BASE_URL}/api/orders?status=open", headers=auth).json()
        assert not any(x["id"] == order_id for x in open_again)

        # Cleanup
        requests.delete(f"{BASE_URL}/api/orders/{order_id}", headers=auth)
        requests.delete(f"{BASE_URL}/api/menu/{mid}", headers=auth)
        requests.delete(f"{BASE_URL}/api/inventory/{inv_id}", headers=auth)

    def test_empty_order_rejected(self, auth):
        r = requests.post(f"{BASE_URL}/api/orders", headers=auth, json={"items": []})
        assert r.status_code == 400
