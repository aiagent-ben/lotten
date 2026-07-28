#!/usr/bin/env python3
"""
One-time migration: seed Supabase from parser's clean JSON output.

Reads: data/clean/products.json (from clean_products.py)
Writes: Supabase (brands, collections, products, product_images, product_variants)
"""

import asyncio
import json
import os
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load env from lotten project root BEFORE reading env vars
load_dotenv(Path(__file__).parent.parent / ".env.local")

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client, Client

# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

CLEAN_JSON_PATH = Path(__file__).parent.parent / "data" / "clean" / "products.json"
R2_PUBLIC_DOMAIN = "pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev"


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')


def parse_price(price_str) -> tuple[Optional[float], bool]:
    """Parse price string -> (amount_usd, is_contact_for_price)."""
    if not price_str or price_str.strip() == "":
        return None, True

    price_str = str(price_str).strip().lower()
    if "contact" in price_str or "enquiry" in price_str or price_str in ["0", "0.00", "rm 0.00"]:
        return None, True

    # Extract numeric value
    match = re.search(r'[\d,]+\.?\d*', price_str.replace(",", "").replace("rm", ""))
    if match:
        try:
            amount = float(match.group())
            return round(amount / 4.5, 2), False
        except:
            pass

    return None, True


def parse_dimensions(dim_str: str) -> dict:
    """Parse 'L1050.0 W560.0 H340.0' -> dict with mm values."""
    result = {}
    for prefix, key in [('L', 'width_mm'), ('W', 'depth_mm'), ('H', 'height_mm')]:
        match = re.search(rf'{prefix}(\d+(?:\.\d+)?)', dim_str)
        if match:
            result[key] = float(match.group(1))
    return result


def parse_weight(weight_str: str) -> Optional[float]:
    """Parse '27.4 kg' -> 27.4"""
    match = re.search(r'([\d.]+)', weight_str)
    if match:
        return float(match.group(1))
    return None


def parse_materials(materials_str: str) -> list[dict]:
    """Parse 'table_leg: MALAYSIAN OAK\ntable_top: MDF+OAK VENEER' -> list of dicts."""
    materials = []
    for line in materials_str.split('\n'):
        line = line.strip()
        if not line:
            continue
        if ':' in line:
            part, material = line.split(':', 1)
            materials.append({
                "part": part.strip(),
                "material": material.strip()
            })
    return materials


def parse_finishes(colors_str: str) -> list[dict]:
    """Parse '1001 SMOKED OAK' -> list of dicts."""
    finishes = []
    for line in colors_str.split('\n'):
        line = line.strip()
        if not line:
            continue
        parts = line.split(' ', 1)
        if len(parts) == 2:
            code, name = parts
            finishes.append({"code": code, "name": name})
        else:
            finishes.append({"code": "", "name": line})
    return finishes


def parse_specifications(spec_str: str) -> dict:
    """Parse specification text -> structured dict."""
    specs = {}
    for line in spec_str.split('\n'):
        line = line.strip()
        if not line:
            continue
        if ':' in line:
            key, val = line.split(':', 1)
            specs[key.strip().lower().replace(' ', '_')] = val.strip()
    return specs


def parse_dimensions_raw(dim_raw: str) -> dict:
    """Extract structured dimensions from raw text."""
    result = {}
    lines = dim_raw.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Dimension (mm): L1000 W500 H430
        for prefix, key in [('L', 'width_mm'), ('W', 'depth_mm'), ('H', 'height_mm')]:
            match = re.search(rf'{prefix}(\d+(?:\.\d+)?)', line)
            if match and key not in result:
                result[key] = float(match.group(1))
        # Gross Weight (kg): 27.40
        if 'weight' in line.lower() or 'gross weight' in line.lower():
            match = re.search(r'([\d.]+)', line)
            if match:
                result['weight_kg'] = float(match.group(1))
        # m³: 0.1999
        if 'm³' in line.lower() or 'm3' in line.lower():
            match = re.search(r'([\d.]+)', line)
            if match:
                result['volume_m3'] = float(match.group(1))
        # Pack Type: 1PC/CTN
        if 'pack type' in line.lower():
            match = re.search(r':\s*(\S+)', line)
            if match:
                result['pack_type'] = match.group(1)
        # Carton Dimension (mm): L1050 W560 H340
        if 'carton' in line.lower():
            for prefix, key in [('L', 'carton_length_mm'), ('W', 'carton_width_mm'), ('H', 'carton_height_mm')]:
                match = re.search(rf'{prefix}(\d+(?:\.\d+)?)', line)
                if match:
                    result[key] = float(match.group(1))
    return result


# ──────────────────────────────────────────────────────────────
# Main Migration
# ──────────────────────────────────────────────────────────────

async def migrate():
    # Load clean products
    print(f"Loading products from {CLEAN_JSON_PATH}")
    with open(CLEAN_JSON_PATH) as f:
        clean_products = json.load(f)

    print(f"Loaded {len(clean_products)} products")

    # ──────────────────────────────────────────────────────────
    # 1. Extract unique collection_ids and brand mappings
    # ──────────────────────────────────────────────────────────

    collection_ids = set()
    brand_map = {}  # collection_id -> brand_name

    for p in clean_products:
        cid = p.get('collection_id')
        if cid:
            collection_ids.add(cid)
            # Derive brand from collection name
            collection_name = p.get('collection', '')
            brand_name = collection_name or 'B2B Furniture Supply'
            brand_map[cid] = brand_name

    print(f"Found {len(collection_ids)} unique collections, {len(brand_map)} brand mappings")

    # ──────────────────────────────────────────────────────────
    # 2. Seed Brands
    # ──────────────────────────────────────────────────────────

    brand_id_map = {}  # collection_id -> brand_id
    brand_slug_map = {}  # brand_name -> slug

    for cid, brand_name in brand_map.items():
        brand_slug = slugify(brand_name)
        brand_slug_map[brand_name] = brand_slug

        # Check if brand already exists
        existing = supabase.table('brands').select('id, slug').eq('name', brand_name).execute()
        if existing.data:
            brand_id_map[cid] = existing.data[0]['id']
            print(f"  ✓ Brand (existing): {brand_name} -> {existing.data[0]['id']}")
        else:
            result = supabase.table('brands').upsert({
                "name": brand_name,
                "slug": brand_slug,
                "description": f"{brand_name} furniture collection",
            }, on_conflict="name").execute()

            if result.data:
                brand_id_map[cid] = result.data[0]['id']
                print(f"  ✓ Brand: {brand_name} -> {result.data[0]['id']}")
            else:
                print(f"  ✗ Failed to seed brand: {brand_name}")

    # ──────────────────────────────────────────────────────────
    # 3. Seed Collections
    # ──────────────────────────────────────────────────────────

    collection_id_map = {}  # collection_id -> id

    for cid in collection_ids:
        brand_id = brand_id_map.get(cid)
        if not brand_id:
            print(f"  ✗ No brand_id for collection: {cid}")
            continue

        result = supabase.table('collections').upsert({
            "brand_id": brand_id,
            "name": cid.replace('col-', '').replace('-', ' ').title(),
            "slug": cid.replace('col-', ''),
            "description": f"{cid.replace('col-', '').replace('-', ' ').title()} furniture collection",
        }, on_conflict="slug").execute()

        if result.data:
            collection_id_map[cid] = result.data[0]['id']
            print(f"  ✓ Collection: {cid} -> {result.data[0]['id']}")
        else:
            print(f"  ✗ Failed to seed collection: {cid}")

    # ──────────────────────────────────────────────────────────
    # 4. Seed Products
    # ──────────────────────────────────────────────────────────

    print(f"\n🌱 Seeding {len(clean_products)} products...")
    success = 0
    errors = 0

    for p in clean_products:
        try:
            article_no = p.get('article_no', '')
            collection_id = p.get('collection_id')

            if not collection_id or collection_id not in collection_id_map:
                print(f"  ⊘ Skipping: {p.get('name', 'Unknown')} (no valid collection_id)")
                errors += 1
                continue

            supabase_collection_id = collection_id_map[collection_id]

            # Price (already in USD from parser)
            price_amount = p.get('price_usd', 0) or 0

            # Parse dimensions
            dims = parse_dimensions(p.get('dimensions', ''))
            weight = parse_weight(p.get('weight', ''))
            carton = parse_dimensions_raw(p.get('carton_dimensions', ''))

            # Parse structured data - already structured from parser
            materials = p.get('materials') if isinstance(p.get('materials'), list) else parse_materials(p.get('materials', ''))
            colors_data = p.get('colors')
            if isinstance(colors_data, list):
                finishes = colors_data
            else:
                finishes = parse_finishes(colors_data)
            specs = p.get('specifications') or {}
            raw_dims = parse_dimensions_raw(str(specs)) if specs else {}

            # Merge dimensions from different sources
            width = raw_dims.get('width_mm') or dims.get('width_mm')
            depth = raw_dims.get('depth_mm') or dims.get('depth_mm')
            height = raw_dims.get('height_mm') or dims.get('height_mm')
            weight_kg = raw_dims.get('weight_kg') or weight
            volume = raw_dims.get('volume_m3')
            pack_type = raw_dims.get('pack_type')
            carton_length = raw_dims.get('carton_length_mm')
            carton_width = raw_dims.get('carton_width_mm')
            carton_height = raw_dims.get('carton_height_mm')

            # Build image list
            image_urls = []
            primary_image = ""

            if p.get('r2_images'):
                image_urls = p['r2_images']
                primary_image = p.get('r2_primary_image') or p['r2_images'][0]
            elif p.get('product_gallery'):
                image_urls = [g['src'] for g in p['product_gallery'] if 'src' in g]
                primary_image = image_urls[0] if image_urls else ""
            elif p.get('images'):
                image_urls = p['images']
                primary_image = p.get('img') or image_urls[0]
            elif p.get('img'):
                image_urls = [p['img']]
                primary_image = p['img']

            # Build ProductImage objects
            product_images = []
            for idx, url in enumerate(image_urls):
                product_images.append({
                    "id": f"img-{idx}",
                    "url": url,
                    "alt_text": f"{p.get('name', '')} - Image {idx + 1}",
                    "sort_order": idx,
                    "is_primary": (idx == 0),
                    "width": 1200,
                    "height": 1200,
                    "created_at": datetime.now().isoformat()
                })

            # Build product variants
            product_variants = []
            if p.get('product_variants'):
                for v in p['product_variants']:
                    var_article_no = v.get('article_no')
                    var_name = v.get('name')
                    var_slug = slugify(f"{var_article_no}-{var_name}") if var_article_no else slugify(var_name)

                    product_variants.append({
                        "article_no": var_article_no,
                        "name": var_name,
                        "slug": var_slug,
                        "price_usd": price_amount,
                        "variant_attributes": {
                            "finish_code": v.get('finish_code', ''),
                            "relationship": v.get('relationship', 'finish_variant'),
                            "base_product": v.get('base_product', article_no)
                        },
                        "is_active": True,
                        "sort_order": 0,
                    })

            pid = f"prod-{article_no}" if article_no else slugify(p.get('name', ''))
            # Generate proper UUID from the pid
            pid = str(uuid.uuid5(uuid.NAMESPACE_DNS, pid))
            slug = p.get('slug', slugify(p.get('name', '')))

            # Upsert product
            product_data = {
                "id": pid,
                "article_no": article_no,
                "collection_id": supabase_collection_id,
                "name": p.get('name', '').strip(),
                "slug": slug,
                "description": p.get('description', '').strip() if p.get('description') else None,
                "short_description": p.get('description', '').strip()[:200] if p.get('description') else None,
                "width_mm": width,
                "depth_mm": depth,
                "height_mm": height,
                "weight_kg": weight_kg,
                "volume_m3": volume,
                "pack_type": pack_type,
                "carton_length_mm": carton_length,
                "carton_width_mm": carton_width,
                "carton_height_mm": carton_height,
                "materials": materials if materials else None,
                "colors": finishes if finishes else None,
                "price_usd": price_amount,
                "cost_usd": None,
                "moq": 1,
                "lead_time_weeks": 8,
                "stock_available": 10,
                "stock_reserved": 0,
                "stock_incoming": 0,
                "low_stock_threshold": 5,
                "is_active": True,
                "is_new": False,
                "is_bestseller": False,
                "sort_order": 0,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            result = supabase.table('products').upsert(product_data, on_conflict="id").execute()

            if result.data:
                product_id = result.data[0]['id']

                # Delete existing variants
                if product_variants:
                    supabase.table('product_variants').delete().eq('product_id', product_id).execute()

                    for v in product_variants:
                        v['product_id'] = product_id
                        supabase.table('product_variants').upsert(v, on_conflict="article_no").execute()

                # Delete existing images and re-insert
                supabase.table('product_images').delete().eq('product_id', product_id).execute()
                for idx, img in enumerate(product_images):
                    img['product_id'] = product_id
                    img['id'] = f"img-{product_id}-{idx}"
                    supabase.table('product_images').upsert(img).execute()

                print(f"  ✓ {p.get('name', 'Unknown')} ({article_no})")
                success += 1
            else:
                print(f"  ✗ {p.get('name', 'Unknown')}: No data returned")
                errors += 1

        except Exception as e:
            print(f"  ✗ {p.get('name', 'Unknown')}: {e}")
            errors += 1

    print(f"\n✅ Migration complete: {success} success, {errors} errors")


if __name__ == "__main__":
    asyncio.run(migrate())