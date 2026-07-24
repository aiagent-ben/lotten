#!/usr/bin/env python3
"""
Upload clean product images (already have hinlim URLs) to Cloudflare R2.

Clean products format has images as list of objects with 'url' field.
R2 structure: products/{article_no}/{slug}/{index}.webp
"""

import asyncio
import io
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import aiohttp
from PIL import Image
from pydantic import BaseModel, Field
import boto3
from botocore.config import Config
import tqdm.asyncio as tqdm_asyncio

import dotenv
from pathlib import Path as PathLib
dotenv.load_dotenv(PathLib("/opt/data/workspace/projects/lotten/.env.local"), override=True)

# ──────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET_NAME", "lotten-images")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL")  # e.g., https://pub-xxx.r2.dev

MAX_CONCURRENT_DOWNLOADS = 10
MAX_CONCURRENT_UPLOADS = 5
WEBP_QUALITY = 85
CHECKPOINT_FILE = Path("data/r2_upload_clean_checkpoint.json")

# ──────────────────────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────────────────────

class CleanProductImage(BaseModel):
    id: str
    product_id: str
    url: str
    alt_text: str | None = None
    sort_order: int = 0
    is_primary: bool = False
    width: int | None = None
    height: int | None = None
    created_at: str = ""

class CleanProduct(BaseModel):
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
    materials: list[dict] | None = None
    colors: list[dict] | None = None
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
    images: list[CleanProductImage] = Field(default_factory=list)
    
    # R2 fields
    r2_images: list[str] = Field(default_factory=list)
    r2_primary_image: str = ""
    processed: bool = False

# ──────────────────────────────────────────────────────────────
# R2 Client
# ──────────────────────────────────────────────────────────────

def get_r2_client():
    """Create R2 S3 client."""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(
            retries={"max_attempts": 3, "mode": "adaptive"},
            max_pool_connections=MAX_CONCURRENT_UPLOADS,
        ),
        region_name="auto",
    )

# ──────────────────────────────────────────────────────────────
# Checkpoint handling
# ──────────────────────────────────────────────────────────────

def load_checkpoint() -> dict[str, Any]:
    """Load upload checkpoint to resume interrupted runs."""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE) as f:
            return json.load(f)
    return {}

def save_checkpoint(data: dict[str, Any]):
    """Save upload checkpoint."""
    CHECKPOINT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(data, f, indent=2)

# ──────────────────────────────────────────────────────────────
# Image processing
# ──────────────────────────────────────────────────────────────

def convert_to_webp(image_bytes: bytes, quality: int = WEBP_QUALITY) -> bytes:
    """Convert image bytes to WebP format."""
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert RGBA to RGB with white background
    if img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")
    
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=quality, method=6)
    return output.getvalue()

async def download_image(session: aiohttp.ClientSession, url: str) -> bytes | None:
    """Download image with retries."""
    for attempt in range(3):
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status == 200:
                    return await resp.read()
                else:
                    print(f"  HTTP {resp.status} for {url}")
        except Exception as e:
            if attempt == 2:
                print(f"  Failed after 3 attempts: {url} - {e}")
            await asyncio.sleep(2 ** attempt)
    return None

def is_color_swatch(url: str, width: int = 0, height: int = 0) -> bool:
    """Check if image is a color swatch (should be skipped)."""
    parsed = urlparse(url)
    if "/color/" in parsed.path:
        return True
    if width and height and width <= 100 and height <= 100:
        return True
    return False

# ──────────────────────────────────────────────────────────────
# Processing pipeline
# ──────────────────────────────────────────────────────────────

async def process_product_images(
    product: CleanProduct,
    session: aiohttp.ClientSession,
    r2_client,
    semaphore: asyncio.Semaphore,
    checkpoint: dict,
) -> CleanProduct:
    """Download, convert, upload all images for a product."""
    
    article_no = product.article_no
    checkpoint_key = f"{article_no}"
    
    if checkpoint_key in checkpoint:
        print(f"  ✓ Skipping {article_no} (checkpoint)")
        product.r2_images = checkpoint[checkpoint_key]["r2_images"]
        product.r2_primary_image = checkpoint[checkpoint_key]["r2_primary_image"]
        product.processed = True
        return product
    
    # Extract image URLs from clean product format
    image_urls = [img.url for img in product.images if img.url]
    
    if not image_urls:
        print(f"  ⚠ No images for {article_no}")
        return product
    
    # Filter out color swatches
    filtered_urls = []
    for url in image_urls:
        if is_color_swatch(url):
            print(f"    ⊘ Skipping color swatch: {url}")
            continue
        filtered_urls.append(url)
    
    if not filtered_urls:
        print(f"  ⚠ No valid images after filtering for {article_no}")
        return product
    
    # Primary image first
    primary_url = filtered_urls[0]
    all_urls = [primary_url] + [u for u in filtered_urls[1:] if u != primary_url]
    
    r2_urls = []
    
    for idx, url in enumerate(all_urls):
        async with semaphore:
            slug = product.slug or article_no
            r2_key = f"products/{article_no}/{slug}/{idx}.webp"
            r2_url = f"{R2_PUBLIC_URL}/{r2_key}"
            
            # Download
            image_bytes = await download_image(session, url)
            if not image_bytes:
                print(f"    ✗ Failed to download: {url}")
                continue
            
            # Get dimensions
            try:
                img = Image.open(io.BytesIO(image_bytes))
                width, height = img.size
                if is_color_swatch(url, width, height):
                    continue
            except Exception:
                width, height = 0, 0
            
            # Convert to WebP
            webp_bytes = convert_to_webp(image_bytes)
            
            # Upload to R2
            try:
                r2_client.put_object(
                    Bucket=R2_BUCKET,
                    Key=r2_key,
                    Body=webp_bytes,
                    ContentType="image/webp",
                    CacheControl="public, max-age=31536000, immutable",
                )
                r2_urls.append(r2_url)
                print(f"    ✓ Uploaded {idx+1}/{len(all_urls)}: {r2_url}")
            except Exception as e:
                print(f"    ✗ R2 upload failed for {url}: {e}")
                continue
    
    # Update product
    product.r2_images = r2_urls
    product.r2_primary_image = r2_urls[0] if r2_urls else ""
    product.processed = True
    
    # Save checkpoint
    checkpoint[checkpoint_key] = {
        "r2_images": r2_urls,
        "r2_primary_image": product.r2_primary_image,
        "processed_at": datetime.now().isoformat(),
    }
    save_checkpoint(checkpoint)
    
    return product

# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Upload clean product images to R2")
    parser.add_argument("--input", required=True, help="Input clean products JSON")
    parser.add_argument("--output", required=True, help="Output JSON with R2 URLs")
    parser.add_argument("--resume", action="store_true", help="Resume from checkpoint")
    args = parser.parse_args()
    
    # Validate env
    for var in ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_URL"]:
        if not os.getenv(var):
            print(f"ERROR: Missing env var {var}")
            return 1
    
    # Load products
    with open(args.input) as f:
        data = json.load(f)
    
    products = [CleanProduct(**p) for p in data]
    print(f"Loaded {len(products)} products from {args.input}")
    
    # Load checkpoint
    checkpoint = load_checkpoint() if args.resume else {}
    if checkpoint:
        print(f"Resuming from checkpoint with {len(checkpoint)} completed products")
    
    # Initialize R2 client
    r2_client = get_r2_client()
    
    # Semaphore for concurrent uploads
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_UPLOADS)
    
    # HTTP session
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT_DOWNLOADS)
    timeout = aiohttp.ClientTimeout(total=60)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        processed = []
        for product in tqdm_asyncio.tqdm(products, desc="Processing products"):
            if args.resume and product.article_no in checkpoint:
                # Merge checkpoint data
                cp = checkpoint[product.article_no]
                product.r2_images = cp.get("r2_images", [])
                product.r2_primary_image = cp.get("r2_primary_image", "")
                product.processed = True
                processed.append(product)
                continue
            
            result = await process_product_images(product, session, r2_client, semaphore, checkpoint)
            processed.append(result)
        
        # Save output
        output_data = {
            "scraped_at": datetime.now().isoformat(),
            "total_products": len(processed),
            "r2_public_url": R2_PUBLIC_URL,
            "products": [p.model_dump() for p in processed],
        }
        
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Saved {len(processed)} products with R2 URLs to {args.output}")
        
        # Clean up checkpoint on full success
        if all(p.processed for p in processed):
            CHECKPOINT_FILE.unlink(missing_ok=True)
            print("✓ All products processed, checkpoint cleared")

if __name__ == "__main__":
    asyncio.run(main())