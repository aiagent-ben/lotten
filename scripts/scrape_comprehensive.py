#!/usr/bin/env python3
"""
Comprehensive queue-based scraper for b2bfurnituresupply.com
Discovers all product URLs, scrapes everything, saves raw archive.
"""

import asyncio
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────
# Data Models
# ──────────────────────────────────────────────────────────────

class URLQueueItem(BaseModel):
    url: str
    status: str = "pending"  # pending, done, failed
    retries: int = 0
    article_no: str | None = None
    error: str | None = None


class URLQueue(BaseModel):
    discovered_at: str
    total_urls: int = 0
    queue: list[URLQueueItem] = Field(default_factory=list)
    completed: list[str] = Field(default_factory=list)
    failed: list[str] = Field(default_factory=list)


class ProductScrape(BaseModel):
    source_url: str
    scraped_at: str
    html: str
    article_no: str | None = None
    name: str | None = None
    slug: str | None = None
    brand: str | None = None
    collection: str | None = None
    categories: list[str] = Field(default_factory=list)  # Category hierarchy from breadcrumb
    price: str | None = None
    description: str | None = None
    materials: str | None = None
    colors_raw: str | None = None
    specifications: str | None = None
    dimensions_raw: str | None = None
    weight_raw: str | None = None
    carton_dimensions_raw: str | None = None
    all_images: list[dict] = Field(default_factory=list)
    all_links: list[dict] = Field(default_factory=list)
    color_swatches: list[dict] = Field(default_factory=list)
    product_gallery: list[dict] = Field(default_factory=list)


# ──────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────

BASE_URL = "https://www.b2bfurnituresupply.com"
QUEUE_FILE = Path("data/raw/url_queue.json")
RAW_DIR = Path("data/raw/scrapes")
RAW_DIR.mkdir(parents=True, exist_ok=True)

MAX_RETRIES = 3
MAX_CONCURRENT = 3
TIMEOUT = 30000


# ──────────────────────────────────────────────────────────────
# URL Discovery
# ──────────────────────────────────────────────────────────────

async def discover_all_urls(page) -> list[str]:
    """Discover all product detail URLs from the site."""
    print("Discovering all product URLs...")

    # Go to homepage
    await page.goto(BASE_URL, wait_until="networkidle", timeout=TIMEOUT)

    # Find all collection links from homepage
    collection_links = await page.query_selector_all("a[href*='/collection/']")
    collection_urls = []
    for link in collection_links:
        href = await link.get_attribute("href")
        if href:
            full = urljoin(BASE_URL, href)
            if full not in collection_urls:
                collection_urls.append(full)

    print(f"Found {len(collection_urls)} collection URLs")

    # For each collection, paginate to get all product URLs
    all_product_urls = set()

    for coll_url in collection_urls:
        print(f"  Scanning collection: {coll_url}")
        page_num = 1
        while True:
            url = f"{coll_url}?page={page_num}" if page_num > 1 else coll_url
            try:
                await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
                # Find product links
                product_links = await page.query_selector_all("a[href*='/collection/'][href*='-']")
                found = 0
                for link in product_links:
                    href = await link.get_attribute("href")
                    if href:
                        full = urljoin(BASE_URL, href)
                        parts = full.rstrip("/").split("/")
                        if parts and re.match(r"^\d+-", parts[-1]):
                            all_product_urls.add(full)
                            found += 1
                if found == 0:
                    break
                page_num += 1
                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"    Error on page {page_num}: {e}")
                break

    urls = sorted(all_product_urls)
    print(f"Discovered {len(urls)} total product URLs")
    return urls


# ──────────────────────────────────────────────────────────────
# Product Scraping
# ──────────────────────────────────────────────────────────────

def extract_article_no(url: str) -> str | None:
    parts = url.rstrip("/").split("/")
    if parts:
        last = parts[-1]
        match = re.match(r"^(\d+)-", last)
        if match:
            return match.group(1)
    return None


async def scrape_product(page, url: str) -> ProductScrape:
    """Scrape EVERYTHING from a product detail page."""
    article_no = extract_article_no(url)

    await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
    await page.wait_for_load_state("domcontentloaded", timeout=10000)

    # Get full HTML
    html = await page.content()

    # Get all images with context
    all_images = []
    img_elements = await page.query_selector_all("img")
    for img in img_elements:
        src = await img.get_attribute("src") or await img.get_attribute("data-src") or ""
        if src:
            alt = await img.get_attribute("alt") or ""
            parent_class = ""
            try:
                parent = await img.evaluate_handle("el => el.parentElement")
                if parent:
                    parent_class = await parent.evaluate("el => el.className") or ""
            except:
                pass
            all_images.append({
                "src": urljoin(BASE_URL, src),
                "alt": alt,
                "parent_class": parent_class
            })

    # Get all links
    all_links = []
    link_elements = await page.query_selector_all("a[href]")
    for link in link_elements:
        href = await link.get_attribute("href")
        text = (await link.inner_text()).strip()
        if href and text:
            all_links.append({
                "href": urljoin(BASE_URL, href),
                "text": text
            })

    # Brand/Collection from breadcrumb - ALSO extract product name AND categories
    breadcrumb = await page.query_selector("nav[aria-label='Breadcrumb'], .breadcrumb, .breadcrumbs")
    brand = None
    collection = None
    product_name_from_breadcrumb = None
    categories = []  # Store category hierarchy (e.g., ["Dining Room", "Bar and Counter Table"])
    if breadcrumb:
        text = (await breadcrumb.inner_text()).strip()
        # Parse breadcrumb for brand/collection
        # Format varies:
        # "Home  Collection  luooma  Castor  CASTOR 1.5M TV CABINET 114/102/1325" (5+ parts)
        # "Home  Dining Room  Bar and Counter Table  ALFORD COUNTER TABLE 1802 (SOLID)" (4 parts)
        parts = [p.strip() for p in text.split("  ") if p.strip()]
        if len(parts) >= 5:
            # brand is typically the 3rd element (index 2), collection is 4th, product name is last
            brand = parts[2]
            collection = parts[3]
            product_name_from_breadcrumb = parts[-1]
            # Categories are between Home and brand (parts[1:2])
            categories = parts[1:2]
        elif len(parts) >= 4:
            # Shorter breadcrumb: Home > Category > Subcategory > Product
            # No explicit brand/collection, but product name is the last part
            product_name_from_breadcrumb = parts[-1]
            # Categories are everything between Home and product name
            categories = parts[1:-1]

    # Name - prioritize .product-name, then .product-title, then h1
    # (comma-separated selectors return first DOM match, so try in order)
    name = None
    for selector in [".product-name", ".product-title", "h1"]:
        name_el = await page.query_selector(selector)
        if name_el:
            name = (await name_el.inner_text()).strip()
            break
    # Override with breadcrumb name if available (it has the full descriptive name)
    if product_name_from_breadcrumb:
        name = product_name_from_breadcrumb

    # Price
    price_el = await page.query_selector(".price, .product-price, [class*='price']")
    price = (await price_el.inner_text()).strip() if price_el else ""

    # Color swatches from "Colours" section
    color_swatches = []
    # Look for color images in the Colours section
    swatch_imgs = await page.query_selector_all("img[src*='/color/']")
    for img in swatch_imgs:
        src = await img.get_attribute("src") or await img.get_attribute("data-src") or ""
        alt = await img.get_attribute("alt") or ""
        if src:
            full_src = urljoin(BASE_URL, src)
            # Extract code and name from alt or src
            code = ""
            swatch_name = ""
            match = re.search(r"/(\d+)\s+([A-Z\s]+)-30x30", src)
            if match:
                code = match.group(1)
                swatch_name = match.group(2).strip()
            color_swatches.append({
                "code": code,
                "name": swatch_name,
                "swatch_url": full_src,
                "alt": alt
            })

    # Product gallery (main images only - exclude carousel/owl-item)
    product_gallery = []
    gallery_imgs = await page.query_selector_all(".thumbnail img")
    for img in gallery_imgs:
        src = await img.get_attribute("src") or await img.get_attribute("data-src") or ""
        if src and "/color/" not in src:
            full_src = urljoin(BASE_URL, src)
            parent_class = ""
            try:
                parent = await img.evaluate_handle("el => el.parentElement")
                if parent:
                    parent_class = await parent.evaluate("el => el.className") or ""
            except:
                pass
            if "thumbnail" in parent_class:
                product_gallery.append({
                    "src": full_src,
                    "parent_class": parent_class
                })

    # All visible text
    body_text = await page.inner_text("body")

    # Extract structured sections from PRODUCT DETAILS tab
    description = ""
    materials = ""
    colors_raw = ""
    specifications = ""
    dimensions_raw = ""
    weight_raw = ""
    carton_dimensions_raw = ""

    try:
        detail_tab = await page.query_selector("button:has-text('PRODUCT DETAILS'), [role='tab']:has-text('PRODUCT DETAILS')")
        if detail_tab:
            await detail_tab.click()
            await page.wait_for_timeout(500)

        panel = await page.query_selector("[role='tabpanel']:has-text('Description'), .product-details, #tab-description")
        if panel:
            full_text = (await panel.inner_text()).strip()

            def extract_section(text, start, ends):
                start_idx = -1
                for line in text.split("\n"):
                    if start.lower() in line.lower():
                        start_idx = text.find(line)
                        break
                if start_idx == -1:
                    return ""
                end_idx = len(text)
                for kw in ends:
                    idx = text.find(kw, start_idx + len(start))
                    if idx != -1 and idx < end_idx:
                        end_idx = idx
                section = text[start_idx:end_idx].strip()
                lines = section.split("\n")
                if len(lines) > 1:
                    return "\n".join(lines[1:]).strip()
                return ""

            description = extract_section(full_text, "Description", ["Article No", "Materials", "Colours", "Specification", "Carton"])
            materials = extract_section(full_text, "Materials", ["Colours", "Specification", "Carton", "Assembly"])
            colors_raw = extract_section(full_text, "Colours", ["Specification", "Carton", "Assembly"])
            specifications = extract_section(full_text, "Specification", ["Carton", "Assembly"])
            dimensions_raw = extract_section(full_text, "Dimension", ["Gross Weight", "m³", "Pack Type", "Assembly"])
            weight_raw = extract_section(full_text, "Gross Weight", ["m³", "Pack Type", "Assembly"])
            carton_dimensions_raw = extract_section(full_text, "Carton Dimension", ["Assembly"])
    except:
        pass

    return ProductScrape(
        source_url=url,
        scraped_at=datetime.now().isoformat(),
        html=html,
        article_no=article_no,
        name=name,
        slug=url.rstrip("/").split("/")[-1] if article_no else None,
        price=price,
        description=description,
        materials=materials,
        colors_raw=colors_raw,
        specifications=specifications,
        dimensions_raw=dimensions_raw,
        weight_raw=weight_raw,
        carton_dimensions_raw=carton_dimensions_raw,
        all_images=all_images,
        all_links=all_links,
        color_swatches=color_swatches,
        product_gallery=product_gallery,
        brand=brand,
        collection=collection,
        categories=categories,
    )


# ──────────────────────────────────────────────────────────────
# Queue Management
# ──────────────────────────────────────────────────────────────

def load_queue() -> URLQueue:
    if QUEUE_FILE.exists():
        data = json.loads(QUEUE_FILE.read_text())
        return URLQueue(**data)
    return URLQueue(discovered_at=datetime.now().isoformat())


def save_queue(queue: URLQueue):
    QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)
    QUEUE_FILE.write_text(json.dumps(queue.model_dump(), indent=2, ensure_ascii=False))


def save_raw_scrape(scrape: ProductScrape):
    if scrape.article_no:
        filepath = RAW_DIR / f"{scrape.article_no}.json"
        filepath.write_text(json.dumps(scrape.model_dump(), indent=2, ensure_ascii=False))


async def run_scraper():
    # Load or create queue
    queue = load_queue()

    if queue.total_urls == 0:
        # Discovery phase
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(viewport={"width": 1920, "height": 1080})
            page = await context.new_page()

            urls = await discover_all_urls(page)

            queue.discovered_at = datetime.now().isoformat()
            queue.total_urls = len(urls)
            queue.queue = [URLQueueItem(url=u) for u in urls]
            save_queue(queue)

            await browser.close()

    # Scraping phase
    pending = [item for item in queue.queue if item.status == "pending"]
    print(f"Starting scrape of {len(pending)} pending URLs...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})

        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        async def scrape_one(item: URLQueueItem):
            async with semaphore:
                page = await context.new_page()
                try:
                    scrape = await scrape_product(page, item.url)
                    save_raw_scrape(scrape)

                    item.status = "done"
                    item.article_no = scrape.article_no
                    queue.completed.append(item.url)
                    print(f"  ✓ {item.url} (article: {scrape.article_no})")
                except Exception as e:
                    item.retries += 1
                    item.error = str(e)
                    if item.retries >= MAX_RETRIES:
                        item.status = "failed"
                        queue.failed.append(item.url)
                        print(f"  ✗ {item.url} - {e} (FAILED after {MAX_RETRIES} retries)")
                    else:
                        item.status = "pending"
                        print(f"  ↻ {item.url} - {e} (retry {item.retries}/{MAX_RETRIES})")
                finally:
                    await page.close()
                    save_queue(queue)

        # Process all pending
        tasks = [scrape_one(item) for item in queue.queue if item.status == "pending"]
        await asyncio.gather(*tasks)

        await browser.close()

    # Final save
    save_queue(queue)
    print(f"\nDone! Completed: {len(queue.completed)}, Failed: {len(queue.failed)}")


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Comprehensive queue-based scraper for b2bfurnituresupply.com")
    parser.add_argument("--headed", action="store_true", help="Run with visible browser")
    parser.add_argument("--reset", action="store_true", help="Reset queue and re-discover URLs")
    args = parser.parse_args()

    if args.reset and QUEUE_FILE.exists():
        QUEUE_FILE.unlink()
        print("Queue reset.")

    start = time.time()
    await run_scraper()
    elapsed = time.time() - start
    print(f"\nDone in {elapsed:.1f}s")


if __name__ == "__main__":
    asyncio.run(main())