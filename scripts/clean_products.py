#!/usr/bin/env python3
"""
Clean and validate scraped product data.
Transforms raw JSON → clean JSON matching SPEC.md database schema.
"""

import argparse
import json
import glob
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ──────────────────────────────────────────────────────────────
# Models (matching SPEC.md database schema)
# ──────────────────────────────────────────────────────────────

class RawProduct(BaseModel):
    """Raw product from scraper."""
    name: str = ""
    href: str = ""
    img: str = ""
    images: list[str] = Field(default_factory=list)
    price: str = ""
    collection: str | None = None
    article_no: str = ""
    # Comprehensive scraper fields
    source_url: str = ""
    slug: str = ""
    description: str = ""
    materials: str = ""
    colors: str = ""
    specifications: str = ""
    dimensions: str = ""
    weight: str = ""
    carton_dimensions: str = ""
    product_gallery: list[dict] = Field(default_factory=list)
    color_swatches: list[dict] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)  # Category hierarchy from breadcrumb

    # R2 fields (from download_and_upload_to_r2.py)
    r2_images: list[str] = Field(default_factory=list)
    r2_primary_image: str = ""


class MaterialSpec(BaseModel):
    """Structured material specification."""
    part: str
    material: str
    finish: str
    code: str


class ColorOption(BaseModel):
    """Structured color option."""
    part: str
    name: str
    code: str
    hex: str


class ProductImage(BaseModel):
    """Product image with metadata."""
    id: str
    product_id: str = ""
    url: str
    alt_text: str | None = None
    sort_order: int = 0
    is_primary: bool = False
    width: int | None = None
    height: int | None = None
    created_at: str = ""


class CleanProduct(BaseModel):
    """Cleaned product matching SPEC.md Product interface."""
    id: str
    article_no: str
    collection_id: str
    name: str
    slug: str
    description: str | None = None
    short_description: str | None = None
    width_mm: int | None = None
    depth_mm: int | None = None
    height_mm: int | None = None
    weight_kg: float | None = None
    volume_m3: float | None = None
    pack_type: str | None = None
    carton_length_mm: int | None = None
    carton_width_mm: int | None = None
    carton_height_mm: int | None = None
    materials: list[MaterialSpec] | None = None
    colors: list[ColorOption] | None = None
    price_usd: float = 0.0
    cost_usd: float | None = None
    moq: int = 1
    lead_time_weeks: int = 8
    stock_available: int = 10
    stock_reserved: int = 0
    stock_incoming: int = 0
    low_stock_threshold: int = 5
    is_active: bool = True
    is_new: bool = False
    is_bestseller: bool = False
    sort_order: int = 0
    created_at: str = ""
    updated_at: str = ""
    images: list[ProductImage] = Field(default_factory=list)

    @field_validator("id", mode="before")
    @classmethod
    def ensure_id(cls, v: str, info) -> str:
        if v:
            return v
        data = info.data if hasattr(info, 'data') else {}
        article_no = data.get("article_no", "")
        name = data.get("name", "")
        if article_no:
            return f"prod-{article_no}"
        return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or "unknown"

    @field_validator("slug", mode="before")
    @classmethod
    def ensure_slug(cls, v: str, info) -> str:
        if v:
            return v
        name = info.data.get("name", "") if hasattr(info, 'data') else ""
        return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or "unknown"

    @field_validator("created_at", mode="before")
    @classmethod
    def ensure_created_at(cls, v: str) -> str:
        return v or datetime.now().isoformat()

    @field_validator("updated_at", mode="before")
    @classmethod
    def ensure_updated_at(cls, v: str) -> str:
        return v or datetime.now().isoformat()


# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Convert text to URL-safe slug."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')


def load_latest_raw(input_pattern: str) -> list[RawProduct]:
    """Load the most recent raw scrape file matching pattern."""
    files = sorted(glob.glob(input_pattern))
    if not files:
        raise FileNotFoundError(f"No files matching {input_pattern}")
    latest = files[-1]
    print(f"Loading: {latest}")
    with open(latest) as f:
        data = json.load(f)
    products = [RawProduct(**p) for p in data.get("products", [])]
    print(f"Loaded {len(products)} raw products")
    return products


def parse_collection_name(full_name: str | None) -> tuple[str, str]:
    """Parse collection name into (collection_name, brand_name)."""
    if not full_name:
        return "Unknown", ""
    match = re.match(r'^(.+?)\s*\((.+)\)$', full_name)
    if match:
        return match[1].strip(), match[2].strip()
    return full_name.strip(), ""


def parse_specifications(specs: str) -> dict:
    """Parse specifications text into structured fields."""
    result = {}
    
    dim_match = re.search(r'Dimension\s*\(mm\):\s*W(\d+)\s*D(\d+)\s*H(\d+)', specs, re.IGNORECASE)
    if dim_match:
        result['width'] = int(dim_match.group(1))
        result['depth'] = int(dim_match.group(2))
        result['height'] = int(dim_match.group(3))
    
    weight_match = re.search(r'Gross Weight\s*\(kg\):\s*([\d.]+)', specs, re.IGNORECASE)
    if weight_match:
        result['weight'] = float(weight_match.group(1))
    
    volume_match = re.search(r'm³?\s*:\s*([\d.]+)', specs, re.IGNORECASE)
    if volume_match:
        result['volume'] = float(volume_match.group(1))
    
    pack_match = re.search(r'Pack Type:\s*(.+)', specs, re.IGNORECASE)
    if pack_match:
        result['pack_type'] = pack_match.group(1).strip()
    
    return result


def parse_carton_dimensions(carton_str: str) -> dict:
    """Parse carton dimensions text into structured fields."""
    result = {}
    match = re.search(r'L(\d+)\s*W(\d+)\s*H(\d+)', carton_str, re.IGNORECASE)
    if match:
        result['length'] = int(match.group(1))
        result['width'] = int(match.group(2))
        result['height'] = int(match.group(3))
    return result


def parse_materials(materials_str: str) -> list[MaterialSpec]:
    """Parse materials text into structured MaterialSpec array."""
    lines = materials_str.split('\n')
    lines = [l.strip() for l in lines if l.strip() and 'Article No' not in l and 'Materials' not in l]
    result = []
    
    for line in lines:
        match = re.match(r'^(.+?):\s*(.+)$', line)
        if match:
            part = match.group(1).strip()
            value = match.group(2).strip()
            parts = value.split('+')
            material = parts[0].strip() if parts else ''
            finish = parts[1].strip() if len(parts) > 1 else ''
            
            # Extract code from finish if present (e.g., "MINDY VENEER" -> no code, "109" -> code)
            code = ''
            if finish and finish.isdigit():
                code = finish
                finish = ''
            
            # Normalize part names
            part_normalized = part.lower().replace(' ', '_').replace('-', '_')
            
            result.append(MaterialSpec(
                part=part_normalized,
                material=material,
                finish=finish,
                code=code
            ))
    return result


def parse_colors(colors_str: str) -> list[ColorOption]:
    """Parse colors text into structured ColorOption array."""
    lines = colors_str.split('\n')
    lines = [l.strip() for l in lines if l.strip()]
    result = []
    
    for line in lines:
        match = re.match(r'^(.+?):\s*(.+)$', line)
        if match:
            part = match.group(1).strip()
            value = match.group(2).strip()
            parts = value.split(' ')
            code = parts[0] if parts else ''
            name = ' '.join(parts[1:]) if len(parts) > 1 else value
            
            part_normalized = part.lower().replace(' ', '_').replace('-', '_')
            
            # Try to get hex from known color names (simplified)
            hex_color = get_hex_for_color(name, code)
            
            result.append(ColorOption(
                part=part_normalized,
                name=name,
                code=code,
                hex=hex_color
            ))
    return result


def get_hex_for_color(name: str, code: str) -> str:
    """Get hex color for known finishes."""
    color_hex_map = {
        'COCOA': '#4A3728',
        'NATURAL': '#D4B896',
        'OAK': '#C19A6B',
        'ANTHRACITE': '#383E42',
        'GREY': '#808080',
        'WALNUT': '#3D2B1F',
        'TOFFEE': '#A67B5B',
        'SMOKED': '#5D4E4A',
        'RUSTIC': '#8B6B4A',
        'CHERRY': '#8B2A2A',
        'CHOCOLATE': '#5C3A21',
        'TYROLEAN': '#6B5B4A',
        'BEECH': '#D9B48A',
        'SPACE': '#1A1A2E',
        'BLUE': '#2A4A7A',
        'CREAM': '#F5F0E1',
        'GREYMIST': '#A8A8A8',
        'GUNMETAL': '#4A4A4A',
        'LIGHT': '#E8E0D8',
        'TENNESSEE': '#B8956A',
        'WARM': '#C49A6C',
        'WOODLINE': '#8B7355',
        'WOODSTOCK': '#A08A6D',
        'WOTAN': '#6B4A3A',
        'BOSTON': '#5C4A3A',
        'LACQUERED': '#C8A888',
        'MARBLE': '#F5F5F5',
        'WASH': '#E8E0D8',
        'WHITE': '#FFFFFF',
        'BLACK': '#000000',
    }
    
    name_upper = name.upper()
    for key, hex_val in color_hex_map.items():
        if key in name_upper:
            return hex_val
    
    # Try code-based mapping
    code_map = {
        '109': '#4A3728',  # COCOA
        '102': '#D4B896',  # NATURAL
        '114': '#A67B5B',  # TOFFEE
        '113': '#3D2B1F',  # WALNUT
        '167': '#F5F5F5',  # WHITE MARBLE
        '170': '#8B6B4A',  # RUSTIC
        '172': '#5C3A21',  # CHOCOLATE
        '173': '#4A3728',  # COCOA
        '1802': '#B8956A', # LIGHT TENNESSEE WALNUT
        '802': '#8B6B4A',  # DARK WALNUT
        '808': '#5C3A21',  # CHOCOLATE
    }
    
    if code in code_map:
        return code_map[code]
    
    return '#FFFFFF'


def parse_dimensions(dimensions_str: str) -> dict:
    """Parse dimensions text (from dimensions field)."""
    result = {}
    # Pattern like "W600 D600 H525 T30" or "L600 W600 H525 T30"
    match = re.search(r'[LW]\s*(\d+)\s*[WD]\s*(\d+)\s*H\s*(\d+)', dimensions_str, re.IGNORECASE)
    if match:
        result['width'] = int(match.group(1))
        result['depth'] = int(match.group(2))
        result['height'] = int(match.group(3))
    return result


def clean_products(raw_products: list[RawProduct]) -> list[CleanProduct]:
    """Transform raw products to clean products with validation."""
    seen = set()
    clean = []
    
    # First pass: group by base slug (article_no + product name before color code)
    from collections import defaultdict
    by_base_slug = defaultdict(list)
    
    for raw in raw_products:
        if not raw.name:
            continue
        # Extract base slug: article_no + product name, before trailing color code (6+ digits)
        if raw.slug:
            match = re.match(r'^\d+-([a-z0-9-]+?)(?:-?\d{6})(?:-?\d{3,})?$', raw.slug.lower())
            if match:
                base_slug = match.group(1)
            else:
                # No color suffix, just remove article_no prefix
                match = re.match(r'^\d+-(.+)$', raw.slug.lower())
                if match:
                    base_slug = match.group(1)
                else:
                    base_slug = raw.slug.lower()
        else:
            base_slug = None
        by_base_slug[base_slug].append(raw)
    
    # Second pass: for each base slug, keep the best product (full name, not just color)
    for base_slug, variants in by_base_slug.items():
        if not base_slug:
            continue
        
        # Skip if all variants are just color names (likely not real products)
        color_names = {'BLACK', 'WHITE', 'COCOA', 'NATURAL', 'OAK', 'ANTHRACITE', 'GREY', 'WALNUT',
                       'TOFFEE', 'SMOKED', 'RUSTIC', 'CHERRY', 'CHOCOLATE', 'TYROLEAN', 'BEECH',
                       'SPACE', 'BLUE', 'CREAM', 'GREYMIST', 'GUNMETAL', 'LIGHT', 'TENNESSEE',
                       'WARM', 'WOODLINE', 'WOODSTOCK', 'WOTAN', 'BOSTON', 'LACQUERED', 'MARBLE', 'WASH'}
        
        # Prefer variant with longest, most descriptive name (not just a color)
        best_variant = None
        best_score = -1
        
        for raw in variants:
            name = raw.name.strip().upper()
            # Skip pure color name products (they're color variants)
            if name in color_names:
                continue
            # Score: longer name = more descriptive = better
            score = len(name)
            if score > best_score:
                best_score = score
                best_variant = raw
        
        # If all variants are color names, pick the first one with images
        if best_variant is None:
            for raw in variants:
                has_images = bool(
                    (hasattr(raw, 'r2_images') and raw.r2_images) or
                    (hasattr(raw, 'product_gallery') and raw.product_gallery) or
                    raw.images or raw.img
                )
                if has_images:
                    best_variant = raw
                    break
            if best_variant is None:
                best_variant = variants[0]  # fallback
        
        raw = best_variant
        
        # Filter out color swatches - they have no images, no slug, and names that are just color names
        has_images = False
        if hasattr(raw, 'r2_images') and raw.r2_images:
            has_images = True
        elif hasattr(raw, 'product_gallery') and raw.product_gallery:
            has_images = True
        elif raw.images:
            has_images = True
        elif raw.img:
            has_images = True
        
        # Skip if no images AND no slug (color swatches typically have neither)
        # Also skip if name is just a color name AND no article_no AND no product_gallery (color swatch page)
        is_color_swatch = (raw.name.strip().upper() in color_names and not raw.article_no and
                           not (hasattr(raw, 'product_gallery') and raw.product_gallery))
        if (not has_images and not raw.slug) or is_color_swatch:
            print(f"  ⊘ Skipping color swatch: {raw.name} (article_no: {raw.article_no})")
            continue
        
        # Deduplicate by base slug
        key = base_slug
        if key in seen:
            continue
        seen.add(key)
        
        # Use original slug if available, otherwise generate from name
        slug = raw.slug if raw.slug else slugify(raw.name)
        
        # Use article_no as id if available, else slug
        pid = f"prod-{raw.article_no}" if raw.article_no else slug
        
        # Build image list - support both old format (images) and new format (product_gallery, r2_images)
        image_urls = []
        primary_image = ""
        
        # Use R2 images if available (highest priority)
        if hasattr(raw, 'r2_images') and raw.r2_images:
            image_urls = raw.r2_images
            primary_image = raw.r2_primary_image or raw.r2_images[0]
        # Fall back to product_gallery from comprehensive scraper
        elif hasattr(raw, 'product_gallery') and raw.product_gallery:
            image_urls = [g['src'] for g in raw.product_gallery if 'src' in g]
            primary_image = image_urls[0] if image_urls else ""
        # Fall back to old format images
        elif raw.images:
            image_urls = raw.images
            primary_image = raw.img or image_urls[0]
        # Fall back to primary image
        elif raw.img:
            image_urls = [raw.img]
            primary_image = raw.img
        
        # Parse structured data
        specs = parse_specifications(raw.specifications)
        carton = parse_carton_dimensions(raw.carton_dimensions)
        materials = parse_materials(raw.materials)
        colors = parse_colors(raw.colors)
        dims = parse_dimensions(raw.dimensions)
        
        # Merge dimensions from different sources
        width = specs.get('width') or dims.get('width')
        depth = specs.get('depth') or dims.get('depth')
        height = specs.get('height') or dims.get('height')
        weight = specs.get('weight')
        volume = specs.get('volume')
        pack_type = specs.get('pack_type')
        
        # Parse collection to get collection_id (will be mapped later)
        collection_name, brand_name = parse_collection_name(raw.collection)
        collection_slug = slugify(collection_name) if collection_name else "unknown"
        collection_id = f"col-{collection_slug}"
        
        # Build ProductImage objects
        product_images = []
        for idx, url in enumerate(image_urls):
            product_images.append(ProductImage(
                id=f"img-{pid}-{idx}",
                product_id=pid,
                url=url,
                alt_text=f"{raw.name} - Image {idx + 1}",
                sort_order=idx,
                is_primary=(idx == 0),
                width=1200,
                height=1200,
                created_at=datetime.now().isoformat()
            ))
        
        # Build clean product
        clean_product = CleanProduct(
            id=pid,
            article_no=raw.article_no,
            collection_id=collection_id,
            name=raw.name.strip(),
            slug=slug,
            description=raw.description.strip() if raw.description else None,
            short_description=raw.description.strip()[:200] if raw.description else None,
            width_mm=width,
            depth_mm=depth,
            height_mm=height,
            weight_kg=weight,
            volume_m3=volume,
            pack_type=pack_type,
            carton_length_mm=carton.get('length'),
            carton_width_mm=carton.get('width'),
            carton_height_mm=carton.get('height'),
            materials=materials if materials else None,
            colors=colors if colors else None,
            price_usd=0.0,  # "Contact for Price" = 0
            cost_usd=None,
            moq=1,
            lead_time_weeks=8,
            stock_available=10,
            stock_reserved=0,
            stock_incoming=0,
            low_stock_threshold=5,
            is_active=True,
            is_new=False,
            is_bestseller=False,
            sort_order=0,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            images=product_images
        )
        clean.append(clean_product)
    
    # Sort by collection, then name
    clean.sort(key=lambda p: (p.collection_id, p.name))
    print(f"Cleaned: {len(clean)} unique products")
    return clean


def save_json(products: list[CleanProduct], output_path: Path):
    """Save clean products as JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    data = [p.model_dump() for p in products]
    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"Saved JSON: {output_path} ({len(data)} products)")


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Clean scraped product data")
    parser.add_argument("--input", type=str, default="data/raw/full_scrape_*.json",
                        help="Input raw JSON file pattern (newest used)")
    parser.add_argument("--output-json", type=str, default="data/clean/products.json",
                        help="Output clean JSON path")
    parser.add_argument("--validate-only", action="store_true",
                        help="Only validate, don't write output")
    args = parser.parse_args()
    
    # Load raw data
    raw_products = load_latest_raw(args.input)
    
    # Clean
    clean = clean_products(raw_products)
    
    if args.validate_only:
        print("Validation only - no output written")
        return
    
    # Save outputs
    save_json(clean, Path(args.output_json))
    
    print(f"\n✓ Done! {len(clean)} products ready for database seeding")


if __name__ == "__main__":
    main()