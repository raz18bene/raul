"""
Script import produse TechNest → Supabase
Rulează: python3 import_produse_technest.py
Necesită: pip install httpx openpyxl pandas
"""

import httpx
import pandas as pd
import json
import re
import sys

# ══════════════════════════════════════════════════════════════
# CONFIG — înlocuiește dacă s-a schimbat ceva
# ══════════════════════════════════════════════════════════════
SUPABASE_URL = "https://blykqidmtdadvocvfilm.supabase.co"
SERVICE_KEY   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWtxaWRtdGRhZHZvY3ZmaWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY5OTg3MSwiZXhwIjoyMDk1Mjc1ODcxfQ.UdlGkv4B9uhVYkfubMtzNORax8Ur4Ii_K5V8ZVzIvig"
EXCEL_FILE    = "TECHLAB_IMPORT_PRODUSE_COMPLET_1.xlsx"

# URL-ul bazei unde sunt pozele (Google Drive folder public sau alt host)
# Dacă pozele sunt pe Google Drive public, pune linkul de tip:
# https://drive.google.com/uc?id=FILE_ID
# Sau dacă sunt pe același domeniu: https://technest.ro/images/
IMAGE_BASE_URL = "https://blykqidmtdadvocvfilm.supabase.co/storage/v1/object/public/products/"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

SQL_CREATE = """
CREATE TABLE IF NOT EXISTS categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price numeric(10,2),
    sale_price numeric(10,2),
    stock integer DEFAULT 0,
    sku text,
    category_id uuid REFERENCES categories(id),
    images text[],
    is_active boolean DEFAULT true,
    featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_name text,
    customer_email text,
    customer_phone text,
    shipping_address jsonb,
    total_amount numeric(10,2),
    status text DEFAULT 'pending',
    payment_status text DEFAULT 'pending',
    payment_method text DEFAULT 'cash',
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES orders(id),
    product_id uuid REFERENCES products(id),
    product_name text,
    quantity integer,
    unit_price numeric(10,2),
    total_price numeric(10,2),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Public read categories') THEN
    CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Public read products') THEN
    CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Public insert orders') THEN
    CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Public read orders') THEN
    CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Public insert order_items') THEN
    CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Public read order_items') THEN
    CREATE POLICY "Public read order_items" ON order_items FOR SELECT USING (true);
  END IF;
END $$;
"""

def rest_get(table, params=None):
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params, timeout=30)
    return r.status_code, r.json()

def rest_post(table, data):
    r = httpx.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data, timeout=30)
    if r.text:
        try:
            return r.status_code, r.json()
        except:
            return r.status_code, r.text
    return r.status_code, {}

def run_sql(sql):
    """Rulează SQL via Supabase RPC sau direct"""
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec",
        headers=HEADERS,
        json={"sql": sql},
        timeout=60
    )
    return r.status_code, r.text[:200]

def clean_val(v):
    """Returnează None dacă valoarea e goală/NaN"""
    if v is None:
        return None
    if isinstance(v, float):
        import math
        if math.isnan(v):
            return None
    s = str(v).strip()
    return None if s == '' or s.lower() == 'nan' else s

# ══════════════════════════════════════════════════════════════
# PASUL 1: Crează tabelele (rulează SQL în Supabase Dashboard)
# ══════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("PASUL 1: CREARE TABELE")
print("="*60)
print("⚠️  Mergi în Supabase Dashboard → SQL Editor și rulează SQL-ul de mai jos:")
print("-"*60)
print(SQL_CREATE)
print("-"*60)
input("\nApasă ENTER după ce ai rulat SQL-ul în dashboard... ")

# ══════════════════════════════════════════════════════════════
# PASUL 2: Verifică conexiunea
# ══════════════════════════════════════════════════════════════
print("\n📡 Testez conexiunea...")
status, data = rest_get("categories", {"limit": "1"})
if status not in [200, 206]:
    print(f"❌ Conexiune eșuată: {status} - {data}")
    print("Verifică URL-ul și cheile Supabase!")
    sys.exit(1)
print(f"✅ Conexiune OK!")

# ══════════════════════════════════════════════════════════════
# PASUL 3: Citește Excel
# ══════════════════════════════════════════════════════════════
print(f"\n📊 Citesc {EXCEL_FILE}...")
try:
    df_cat = pd.read_excel(EXCEL_FILE, sheet_name="CATEGORII")
    df_prod = pd.read_excel(EXCEL_FILE, sheet_name="PRODUSE")
    print(f"✅ Categorii: {len(df_cat)} | Produse: {len(df_prod)}")
except Exception as e:
    print(f"❌ Eroare la citirea Excel: {e}")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════
# PASUL 4: Import categorii
# ══════════════════════════════════════════════════════════════
print("\n📁 Import categorii...")

# Verifică ce există deja
status, existing = rest_get("categories", {"select": "slug"})
existing_slugs = {c["slug"] for c in (existing if isinstance(existing, list) else [])}

cat_slug_to_id = {}
inserted_cats = 0
skipped_cats = 0

for _, row in df_cat.iterrows():
    name = clean_val(row.get("name"))
    slug = clean_val(row.get("slug"))
    if not name or not slug:
        continue

    if slug in existing_slugs:
        # Obține ID-ul existent
        s, d = rest_get("categories", {"slug": f"eq.{slug}", "select": "id,slug"})
        if s == 200 and d:
            cat_slug_to_id[slug] = d[0]["id"]
        skipped_cats += 1
        continue

    cat_data = {
        "name": name,
        "slug": slug,
        "description": clean_val(row.get("description")),
        "image_url": None
    }
    cat_data = {k: v for k, v in cat_data.items() if v is not None}

    status, result = rest_post("categories", cat_data)
    if status in [200, 201] and isinstance(result, list) and result:
        cat_slug_to_id[slug] = result[0]["id"]
        inserted_cats += 1
        print(f"  ✅ {name}")
    else:
        print(f"  ❌ {name}: {result}")

# Obține și categoriile existente care au fost skipped
if skipped_cats > 0:
    s, d = rest_get("categories", {"select": "id,slug"})
    if s == 200:
        for c in d:
            if c["slug"] not in cat_slug_to_id:
                cat_slug_to_id[c["slug"]] = c["id"]

print(f"\n  Inserare: {inserted_cats} | Existente: {skipped_cats}")
print(f"  Categorii mapate: {list(cat_slug_to_id.keys())}")

# ══════════════════════════════════════════════════════════════
# PASUL 5: Import produse
# ══════════════════════════════════════════════════════════════
print("\n📦 Import produse...")

# Verifică produse existente
status, existing_prods = rest_get("products", {"select": "slug"})
existing_prod_slugs = {p["slug"] for p in (existing_prods if isinstance(existing_prods, list) else [])}

inserted = 0
skipped = 0
errors = 0

for i, row in df_prod.iterrows():
    name = clean_val(row.get("name"))
    slug = clean_val(row.get("slug"))
    if not name or not slug:
        continue

    if slug in existing_prod_slugs:
        skipped += 1
        continue

    # Construiește lista de imagini
    images = []
    for img_col in ["images_url_1", "images_url_2", "images_url_3"]:
        img = clean_val(row.get(img_col))
        if img:
            # Dacă e doar nume de fișier, adaugă base URL
            if not img.startswith("http"):
                img = IMAGE_BASE_URL + img
            images.append(img)

    # Category ID
    cat_slug = clean_val(row.get("category_slug"))
    category_id = cat_slug_to_id.get(cat_slug) if cat_slug else None

    # Price
    price = clean_val(row.get("price"))
    try:
        price = float(price) if price else None
    except:
        price = None

    # Stock
    stock = clean_val(row.get("stock"))
    try:
        stock = int(float(stock)) if stock else 0
    except:
        stock = 0

    prod_data = {
        "name": name,
        "slug": slug,
        "description": clean_val(row.get("description")),
        "price": price,
        "stock": stock,
        "category_id": category_id,
        "images": images,
        "is_active": True,
        "featured": False
    }
    # Elimină None values (opțional)
    prod_data = {k: v for k, v in prod_data.items() if v is not None or k in ["price", "category_id"]}

    status, result = rest_post("products", prod_data)
    if status in [200, 201]:
        inserted += 1
        if inserted % 20 == 0:
            print(f"  ... {inserted} produse importate")
    else:
        errors += 1
        if errors <= 5:  # afișează primele 5 erori
            print(f"  ❌ {name}: {str(result)[:100]}")

print(f"\n✅ DONE!")
print(f"   Produse inserare: {inserted}")
print(f"   Produse existente (skipped): {skipped}")
print(f"   Erori: {errors}")

if errors == 0 and inserted > 0:
    print("\n🎉 Import complet cu succes!")
elif errors > 0:
    print(f"\n⚠️  Au fost {errors} erori. Verifică mai sus pentru detalii.")