import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client


# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

CLEAN_JSON_PATH = Path(__file__).parent.parent / "b2b-furniture-ecommerce" / "data" / "clean" / "products.json"
R2_PUBLIC_DOMAIN = "pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev"


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')


def parse_price(price_str: str) -> tuple[Optional[float], bool]:
    """Parse price string → (amount_usd, is_contact_for_price)."""
    if not price_str or price_str.strip() == "":
        return None, True
    
    price_str = price_str.strip().lower()
    if "contact" in price_str or "enquiry" in price_str or price_str in ["0", "0.00", "rm 0.00"]:
        return None, True
    
    # Extract numeric value
    match = re.search(r'[\d,]+\.?\d*', price_str.replace(",", "").replace("rm", ""))
    if match:
        try:
            amount = float(match.group())
            # Assume MYR, convert to USD (rough rate: 1 USD = 4.5 MYR)
            # Or keep as MYR if price_usd column expects MYR
            return round(amount / 4.5, 2), False  # Convert MYR to USD
        except:
            pass
    
    return None, True


def parse_dimensions(dim_str: str) -> dict:
    """Parse 'L1050.0 W560.0 H340.0' → dict with mm values."""
    result = {}
    for prefix, key in [('L', 'width_mm'), ('W', 'depth_mm'), ('H', 'height_mm')]:
        match = re.search(rf'{prefix}(\d+(?:\.\d+)?)', dim_str)
        if match:
            result[key] = float(match.group(1))
    return result


def parse_weight(weight_str: str) -> Optional[float]:
    """Parse '27.4 kg' → 27.4"""
    match = re.search(r'([\d.]+)', weight_str)
    if match:
        return float(match.group(1))
    return None


def parse_materials(materials_str: str) -> list[dict]:
    """Parse 'table_leg: MALAYSIAN OAK\ntable_top: MDF+OAK VENEER' → list of dicts."""
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
    """Parse '1001 SMOKED OAK' → list of dicts."""
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
    """Parse specification text → structured dict."""
    specs = {}
    for line in spec_str.split('\n'):
        line = line.strip()
        if not line:
            continue
        if ':' in line:
            key, val = line.split(':', 1)
            specs[key.strip().lower().replace(' ', '_')] = val.strip()
        else:
            # Try to parse key-value without colon
            pass
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
    from supabase import create_client
    import os
    from dotenv import load_dotenv
    
    load_dotenv(Path(__file__).parent.parent / "lotten" / ".env.local")
    
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase = create_client(url, key)
    
    # Load clean products
    print(f"Loading products from {CLEAN_JSON_PATH}")
    with open(CLEAN_JSON_PATH) as f:
        clean_products = json.load(f)
    
    print(f"Loaded {len(clean_products)} products")
    
    # ──────────────────────────────────────────────────────────
    # 1. Collect unique brands & collections
    # ──────────────────────────────────────────────────────────
    
    brand_map = {}  # slug -> {name, slug, description}
    collection_map = {}  # slug -> {name, slug, brand_slug, description}
    
    for p in clean_products:
        collection = p.get('collection', '').strip()
        categories = p.get('categories', [])
        
        # Derive brand from categories or collection
        brand_name = categories[0] if categories else "B2B Furniture Supply"
        brand_slug = slugify(brand_name)
        
        if brand_slug not in brand_map:
            brand_map[brand_slug] = {
                "name": brand_name,
                "slug": brand_slug,
                "description": f"{brand_name} furniture collection"
            }
        
        collection_name = collection or "Uncategorized"
        collection_slug = slugify(collection_name)
        
        if collection_slug not in collection_map:
            collection_map[collection_slug] = {
                "name": collection_name,
                "slug": collection_slug,
                "brand_slug": brand_slug,
                "description": f"{collection_name} collection"
            }
    
    print(f"Found {len(brand_map)} brands, {len(collection_map)} collections")
    
    # ──────────────────────────────────────────────────────────
    # 2. Upsert Brands
    # ──────────────────────────────────────────────────────────
    
    print("\n🌱 Seeding brands...")
    brand_id_map = {}
    for slug, brand in brand_map.items():
        result = supabase.table('brands').upsert({
            "name": brand["name"],
            "slug": brand["slug"],
            "description": brand["description"],
            "sort_order": list(brand_map.keys()).index(slug),
        }, on_conflict="slug").execute()
        
        if result.data:
            brand_id_map[slug] = result.data[0]['id']
            print(f"  ✓ Brand: {brand['name']} ({slug})")
        else:
            print(f"  ✗ Brand failed: {slug}")
    
    # ──────────────────────────────────────────────────────────
    # 3. Upsert Collections
    # ──────────────────────────────────────────────────────────
    
    print("\n🌱 Seeding collections...")
    collection_id_map = {}
    for slug, coll in collection_map.items():
        brand_id = brand_id_map.get(coll["brand_slug"])
        if not brand_id:
            print(f"  ✗ Brand not found for collection: {slug}")
            continue
        
        result = supabase.table('collections').upsert({
            "brand_id": brand_id,
            "name": coll["name"],
            "slug": slug,
            "description": coll["description"],
            "is_active": True,
            "sort_order": list(collection_map.keys()).index(slug),
        }, on_conflict="slug").execute()
        
        if result.data:
            collection_id_map[slug] = result.data[0]['id']
            print(f"  ✓ Collection: {coll['name']} ({slug})")
        else:
            print(f"  ✗ Collection failed: {slug}")
    
    # ──────────────────────────────────────────────────────────
    # 4. Upsert Products
    # ──────────────────────────────────────────────────────────
    
    print(f"\n🌱 Seeding {len(clean_products)} products...")
    success = 0
    errors = 0
    
    for p in clean_products:
        try:
            article_no = p.get('articleNo') or p.get('id')
            if not article_no:
                print(f"  ✗ No article_no for: {p.get('name')}")
                errors += 1
                continue
            
            # Collection mapping
            collection_name = p.get('collection', '').strip()
            collection_slug = slugify(collection_name) if collection_name else "uncategorized"
            collection_id = collection_id_map.get(collection_slug)
            
            if not collection_id:
                print(f"  ⚠ Collection not found: {collection_slug}, using first available")
                collection_id = list(collection_id_map.values())[0] if collection_id_map else None
            
            if not collection_id:
                print(f"  ✗ No collection for: {p.get('name')}")
                errors += 1
                continue
            
            # Parse price
            price_amount, is_contact = parse_price(p.get('price', ''))
            
            # Parse dimensions
            dims = parse_dimensions(p.get('dimensions', ''))
            weight = parse_weight(p.get('weight', ''))
            carton = parse_dimensions(p.get('cartonDimensions', ''))
            
            # Parse structured data
            materials = parse_materials(p.get('materials', ''))
            finishes = parse_finishes(p.get('colors', ''))
            specs = parse_specifications(p.get('specifications', ''))
            dims_raw = parse_dimensions_raw(p.get('specifications', ''))  # specs often contain dims
            
            # Merge dimension sources
            final_dims = {**dims, **dims_raw}
            
            # Product data
            product_data = {
                "article_no": article_no,
                "collection_id": collection_id,
                "name": p.get('name', '').strip(),
                "slug": p.get('slug', ''),
                "description": p.get('description', ''),
                "short_description": p.get('description', '')[:200] if p.get('description') else None,
                "width_mm": final_dims.get('width_mm'),
                "depth_mm": final_dims.get('depth_mm'),
                "height_mm": final_dims.get('height_mm'),
                "weight_kg": final_dims.get('weight_kg') or weight,
                "volume_m3": final_dims.get('volume_m3'),
                "pack_type": final_dims.get('pack_type'),
                "carton_length_mm": carton.get('carton_length_mm'),
                "carton_width_mm": carton.get('carton_width_mm'),
                "carton_height_mm": carton.get('carton_height_mm'),
                "materials": materials,
                "colors": finishes,
                "price_usd": price_amount if price_amount is not None else 0,
                "cost_usd": None,
                "moq": 1,
                "lead_time_weeks": 8,
                "stock_available": 0,
                "stock_reserved": 0,
                "stock_incoming": 0,
                "low_stock_threshold": 5,
                "is_active": True,
                "is_new": False,
                "is_bestseller": False,
                "sort_order": 0,
            }
            
            # Upsert product
            result = supabase.table('products').upsert(
                product_data, on_conflict="article_no"
            ).execute()
            
            if not result.data:
                print(f"  ✗ Product upsert failed: {article_no}")
                errors += 1
                continue
            
            product_id = result.data[0]['id']
            
            # ────────────────────────────────────────────────────
            # Product Images
            # ────────────────────────────────────────────────────
            
            images = p.get('images', [])
            if images:
                # Delete existing images to avoid duplicates on re-run
                supabase.table('product_images').delete().eq('product_id', product_id).execute()
                
                for i, img_url in enumerate(images):
                    supabase.table('product_images').insert({
                        "product_id": product_id,
                        "url": img_url,
                        "alt_text": f"{p.get('name')} - Image {i + 1}",
                        "sort_order": i,
                        "is_primary": i == 0,
                    }).execute()
            
            # ────────────────────────────────────────────────────
            # Product Variants (finish variants)
            # ────────────────────────────────────────────────────
            
            variants = p.get('productVariants', [])
            for var in variants:
                var_article_no = var.get('article_no')
                if not var_article_no:
                    continue
                
                supabase.table('product_variants').upsert({
                    "product_id": product_id,
                    "article_no": var_article_no,
                    "name": var.get('name', ''),
                    "slug": slugify(var.get('name', '')),
                    "price_usd": 0,  # Will be updated when variant is scraped
                    "stock_available": 0,
                    "stock_reserved": 0,
                    "stock_incoming": 0,
                    "variant_attributes": {
                        "finish_code": var.get('finish_code', ''),
                        "relationship": var.get('relationship', 'finish_variant'),
                        "base_product": var.get('base_product', ''),
                    },
                    "is_active": True,
                    "sort_order": 0,
                }, on_conflict="article_no").execute()
            
            print(f"  ✓ {article_no}: {p.get('name')}")
            success += 1
            
        except Exception as e:
            print(f"  ✗ Error on {p.get('name', 'unknown')}: {e}")
            errors += 1
    
    print(f"\n✅ Migration complete: {success} success, {errors} errors")


if __name__ == "__main__":
    asyncio.run(migrate())