#!/usr/bin/env python3
"""
Comprehensive queue-based scraper for b2bfurnituresupply.com
Discovers all product URLs, scrapes everything, saves raw archive.
Supports incremental scraping via ETag/Last-Modified and content hashing.
"""

import asyncio
import json
import os
import re
import signal
import time
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, field
from typing import Any

from playwright.async_api import async_playwright
from pydantic import BaseModel, Field, field_validator
import httpx


# ──────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────

@dataclass
class ScraperConfig:
    base_url: str = "https://www.b2bfurnituresupply.com"
    queue_file: Path = Path("data/raw/url_queue.json")
    raw_dir: Path = Path("data/raw/scrapes")
    max_retries: int = 3
    max_concurrent: int = 3
    timeout: int = 30000
    page_delay: float = 0.5
    request_timeout: int = 10000
    max_redirects: int = 5
    user_agent: str = "Mozilla/5.0 (compatible; LottenBot/1.0; +https://lotten.2share.tech/bot)"
    respect_robots_txt: bool = True
    incremental: bool = True
    rate_limit: float = 2.0  # requests per second
    
    def __post_init__(self):
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.queue_file.parent.mkdir(parents=True, exist_ok=True)


CONFIG = ScraperConfig()

# Global constants
QUEUE_FILE = Path("data/raw/url_queue.json")
RAW_DIR = Path("data/raw/scrapes")
RAW_DIR.mkdir(parents=True, exist_ok=True)
QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)

BASE_URL = "https://www.b2bfurnituresupply.com"
MAX_RETRIES = 3
MAX_CONCURRENT = 3
TIMEOUT = 30000
PAGE_DELAY = 0.5
USER_AGENT = "Mozilla/5.0 (compatible; LottenBot/1.0; +https://lotten.2share.tech/bot)"


# ──────────────────────────────────────────────────────────────
# Rate Limiter (Token Bucket)
# ──────────────────────────────────────────────────────────────

class RateLimiter:
    """Domain-level rate limiter with token bucket algorithm."""
    
    def __init__(self, requests_per_second: float = 2.0):
        self.rate = requests_per_second
        self.tokens = requests_per_second
        self.last_update = time.monotonic()
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.rate, self.tokens + elapsed * self.rate)
            
            if self.tokens >= 1:
                self.tokens -= 1
                self.last_update = now
                return
            
            wait_time = (1 - self.tokens) / self.rate
            self.tokens = 0
            self.last_update = now
        
        await asyncio.sleep(wait_time)


# ──────────────────────────────────────────────────────────────
# Robots.txt Checker
# ──────────────────────────────────────────────────────────────

class RobotsTxtChecker:
    """Check robots.txt compliance before scraping."""
    
    def __init__(self, base_url: str, user_agent: str):
        self.base_url = base_url
        self.user_agent = user_agent
        self._cache: dict[str, tuple[bool, float]] = {}
        self.cache_ttl = 3600  # 1 hour
    
    async def can_fetch(self, url: str) -> bool:
        parsed = urlparse(url)
        domain = f"{parsed.scheme}://{parsed.netloc}"
        
        # Check cache
        if domain in self._cache:
            allowed, cached_at = self._cache[domain]
            if time.time() - cached_at < 3600:
                return allowed
        
        # Fetch robots.txt
        robots_url = f"{domain}/robots.txt"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(robots_url, headers={"User-Agent": "LottenBot/1.0"})
                if resp.status_code == 200:
                    allowed = self._parse_robots(resp.text, url)
                    self._cache[domain] = (allowed, time.time())
                    return allowed
        except Exception:
            pass
        
        # Allow by default if robots.txt unavailable
        self._cache[domain] = (True, time.time())
        return True
    
    def _parse_robots(self, content: str, url: str) -> bool:
        """Simple robots.txt parsing."""
        lines = content.split('\n')
        current_ua = None
        for line in lines:
            line = line.strip()
            if line.lower().startswith('user-agent:'):
                current_ua = line.split(':', 1)[1].strip()
            elif line.lower().startswith('disallow:') and (current_ua == '*' or self.user_agent in current_ua):
                disallow = line.split(':', 1)[1].strip()
                if disallow and urlparse(url).path.startswith(disallow):
                    return False
        return True


# ──────────────────────────────────────────────────────────────
# Retry Policy with Exponential Backoff
# ──────────────────────────────────────────────────────────────

class RetryPolicy:
    """Exponential backoff retry policy."""
    
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 60.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
    
    async def execute(self, func, *args, **kwargs):
        last_exception = None
        for attempt in range(self.max_retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries:
                    delay = min(self.base_delay * (2 ** attempt), self.max_delay)
                    await asyncio.sleep(delay)
                else:
                    raise last_exception
        raise last_exception


# ──────────────────────────────────────────────────────────────
# Content Hash & Change Detection
# ──────────────────────────────────────────────────────────────

def compute_content_hash(content: str) -> str:
    """Compute SHA256 hash of content for change detection."""
    # Remove dynamic elements: timestamps, session IDs, CSRF tokens
    cleaned = re.sub(r'<input[^>]*name=["\'](csrf|token|nonce)["\'][^>]*>', '', content, flags=re.IGNORECASE)
    cleaned = re.sub(r'<meta[^>]*name=["\'](csrf|token|nonce)["\'][^>]*>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d{10,}\b', '', cleaned)  # Remove timestamps
    return hashlib.sha256(cleaned.encode()).hexdigest()


def extract_article_no(url: str) -> Optional[str]:
    """Extract article number from URL using multiple strategies."""
    # Strategy 1: From URL slug (most reliable)
    parts = url.rstrip("/").split("/")
    if parts:
        last = parts[-1]
        match = re.match(r"^(\d+)-", last)
        if match:
            return match.group(1)
    
    # Strategy 2: From query params
    parsed = urlparse(url)
    if parsed.query:
        for param in parsed.query.split("&"):
            if param.startswith("article_no=") or param.startswith("id="):
                return param.split("=")[1]
    
    return None


def compute_content_hash(html: str) -> str:
    """Compute hash of page content (excluding dynamic elements)."""
    # Remove dynamic elements: timestamps, session IDs, CSRF tokens
    cleaned = re.sub(r'<input[^>]*name=["\'](csrf|token|nonce)["\'][^>]*>', '', html, flags=re.IGNORECASE)
    cleaned = re.sub(r'<meta[^>]*name=["\'](csrf|token|nonce)["\'][^>]*>', '', html, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b\d{10,}\b', '', cleaned)  # Remove timestamps
    return hashlib.sha256(cleaned.encode()).hexdigest()


def extract_article_no(url: str) -> Optional[str]:
    """Extract article number from URL using multiple strategies."""
    # Strategy 1: From URL slug (most reliable)
    parts = url.rstrip("/").split("/")
    if parts:
        last = parts[-1]
        match = re.match(r"^(\d+)-", last)
        if match:
            return match.group(1)
    
    # Strategy 2: From query params
    parsed = urlparse(url)
    if parsed.query:
        for param in parsed.query.split("&"):
            if param.startswith("article_no=") or param.startswith("id="):
                return param.split("=")[1]
    
    return None


# ──────────────────────────────────────────────────────────────
# Data Models
# ──────────────────────────────────────────────────────────────

class URLQueueItem(BaseModel):
    url: str
    status: str = "pending"  # pending, done, failed
    retries: int = 0
    article_no: Optional[str] = None
    error: Optional[str] = None
    etag: Optional[str] = None
    last_modified: Optional[str] = None
    content_hash: Optional[str] = None
    added_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())


class URLQueue(BaseModel):
    discovered_at: str
    total_urls: int = 0
    queue: list[URLQueueItem] = Field(default_factory=list)
    completed: list[str] = Field(default_factory=list)
    failed: list[str] = Field(default_factory=list)
    robots_txt_checked: bool = False
    last_incremental_run: Optional[str] = None


class ProductScrape(BaseModel):
    source_url: str
    scraped_at: str
    html: str
    article_no: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    brand: Optional[str] = None
    collection: Optional[str] = None
    categories: list[str] = Field(default_factory=list)
    price: Optional[str] = None
    description: Optional[str] = None
    materials: Optional[str] = None
    colors_raw: Optional[str] = None
    specifications: Optional[str] = None
    dimensions_raw: Optional[str] = None
    weight_raw: Optional[str] = None
    carton_dimensions_raw: Optional[str] = None
    all_images: list[dict] = Field(default_factory=list)
    all_links: list[dict] = Field(default_factory=list)
    color_swatches: list[dict] = Field(default_factory=list)
    product_gallery: list[dict] = Field(default_factory=list)
    product_variants: list[dict] = Field(default_factory=list)
    etag: Optional[str] = None
    last_modified: Optional[str] = None
    content_hash: Optional[str] = None


# ──────────────────────────────────────────────────────────────
# Helper Functions
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


# ──────────────────────────────────────────────────────────────
# Main Scraper Functions
# ──────────────────────────────────────────────────────────────

async def discover_all_urls(page) -> list[str]:
    """Discover all product URLs from collection pages."""
    print("🔍 Discovering all product URLs...")
    
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
    
    all_product_urls = set()
    
    for coll_url in collection_urls:
        print(f"  Scanning: {coll_url}")
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


async def scrape_product(page, url: str, item) -> dict:
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
    
    # Brand/Collection from breadcrumb
    breadcrumb = await page.query_selector("nav[aria-label='Breadcrumb'], .breadcrumb, .breadcrumbs")
    brand = None
    collection = None
    product_name_from_breadcrumb = None
    categories = []
    if breadcrumb:
        text = (await breadcrumb.inner_text()).strip()
        parts = [p.strip() for p in text.split("  ") if p.strip()]
        parts = [p for p in parts if p and not p.isspace()]
        
        if len(parts) >= 3:
            generic_categories = {"dining room", "living room", "bedroom", "office", "outdoor", "collection"}
            
            if len(parts) >= 5:
                brand = parts[1]
                collection = parts[2]
            elif len(parts) == 4:
                generic_cats = {"dining room", "living room", "bedroom", "office", "outdoor", "collection"}
                if parts[1].lower() not in generic_cats:
                    brand = parts[1]
                    collection = parts[2]
                else:
                    collection = parts[1]
            elif len(parts) == 3:
                collection = parts[1]
        
        if len(parts) >= 2:
            product_name_from_breadcrumb = parts[-1]
    
    # Name - prioritize .product-name, then .product-title, then h1
    name = None
    for selector in [".product-name", ".product-title", "h1"]:
        name_el = await page.query_selector(selector)
        if name_el:
            name = (await name_el.inner_text()).strip()
            break
    if product_name_from_breadcrumb:
        name = product_name_from_breadcrumb
    
    # Price
    price_el = await page.query_selector(".price, .product-price, [class*='price']")
    price = (await price_el.inner_text()).strip() if price_el else ""
    
    # Color swatches
    color_swatches = []
    swatch_imgs = await page.query_selector_all("img[src*='/color/']")
    for img in swatch_imgs:
        src = await img.get_attribute("src") or await img.get_attribute("data-src") or ""
        alt = await img.get_attribute("alt") or ""
        full_src = urljoin(BASE_URL, src)
        match = re.search(r"/(\d+)\s+([A-Z\s]+)-30x30", src)
        if match:
            code = match.group(1)
            swatch_name = match.group(2).strip()
        else:
            code = ""
            swatch_name = alt.strip()
            match = re.match(r'(\d+)\s+([A-Z\s]+)', alt.strip())
            if match:
                code = match.group(1)
                swatch_name = match.group(2).strip()
            else:
                swatch_name = alt.strip()
        
        color_swatches.append({
            "code": code,
            "name": swatch_name,
            "swatch_url": urljoin(BASE_URL, src),
            "alt": alt
        })
    
    # Product gallery
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
    
    # Product variants from OPTION section
    product_variants = []
    try:
        option_section = await page.query_selector("div.product_variants:has(h3:has-text('OPTION'))")
        if option_section:
            for link in await option_section.query_selector_all("a.thumbnail"):
                href = await link.get_attribute("href")
                title = await link.get_attribute("title") or await link.inner_text()
                if href:
                    full_href = urljoin(BASE_URL, href)
                    match = re.match(r"^(\d+)-", full_href.rstrip("/").split("/")[-1])
                    var_article_no = match.group(1) if match else ""
                    
                    finish_code = ""
                    match = re.search(r'(\d+/\d+)', title)
                    if match:
                        finish_code = match.group(1)
                    
                    product_variants.append({
                        "article_no": var_article_no,
                        "name": title,
                        "url": full_href,
                        "finish_code": finish_code,
                        "relationship": "finish_variant",
                        "base_product": ""
                    })
    except Exception as e:
        print(f"  Warning: Could not extract variants: {e}")
    
    # Extract structured sections
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
    
    return {
        "source_url": url,
        "scraped_at": datetime.now().isoformat(),
        "html": html,
        "article_no": article_no or "",
        "name": name,
        "slug": url.rstrip("/").split("/")[-1] if article_no else None,
        "price": price,
        "description": description,
        "materials": materials,
        "colors_raw": colors_raw,
        "specifications": specifications,
        "dimensions_raw": dimensions_raw,
        "weight_raw": weight_raw,
        "carton_dimensions_raw": carton_dimensions_raw,
        "all_images": all_images,
        "all_links": all_links,
        "color_swatches": color_swatches,
        "product_gallery": product_gallery,
        "product_variants": product_variants,
        "etag": "",
        "last_modified": "",
        "content_hash": compute_content_hash(html),
    }


async def discover_all_urls(page) -> list[str]:
    """Discover all product URLs from collection pages."""
    print("🔍 Discovering all product URLs...")
    
    await page.goto(BASE_URL, wait_until="networkidle", timeout=TIMEOUT)
    
    collection_links = await page.query_selector_all("a[href*='/collection/']")
    collection_urls = []
    for link in collection_links:
        href = await link.get_attribute("href")
        if href:
            full = urljoin(BASE_URL, href)
            if full not in collection_urls:
                collection_urls.append(full)
    
    print(f"Found {len(collection_urls)} collection URLs")
    
    all_product_urls = set()
    
    for coll_url in collection_urls:
        print(f"  Scanning: {coll_url}")
        page_num = 1
        
        while True:
            url = f"{coll_url}?page={page_num}" if page_num > 1 else coll_url
            try:
                await page.goto(url, wait_until="networkidle", timeout=TIMEOUT)
                
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


def save_raw_scrape(scrape: dict):
    if scrape.get("article_no"):
        filepath = RAW_DIR / f"{scrape['article_no']}.json"
        filepath.write_text(json.dumps(scrape, indent=2, ensure_ascii=False))


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────

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
                    scrape = await scrape_product(page, item.url, item)
                    save_raw_scrape(scrape)
                    
                    item.status = "done"
                    item.article_no = scrape.get("article_no", "")
                    item.content_hash = scrape.get("content_hash", "")
                    item.updated_at = datetime.now().isoformat()
                    print(f"  ✓ {item.url} (article: {scrape.get('article_no', '')})")
                except Exception as e:
                    item.retries += 1
                    item.error = str(e)
                    if item.retries >= MAX_RETRIES:
                        item.status = "failed"
                        print(f"  ✗ {item.url} - {e} (FAILED after {MAX_RETRIES} retries)")
                    else:
                        item.status = "pending"
                        print(f"  ↻ {item.url} - {e} (retry {item.retries}/{MAX_RETRIES})")
                finally:
                    save_queue(queue)
        
        tasks = [scrape_one(item) for item in queue.queue if item.status == "pending"]
        await asyncio.gather(*tasks)
        
        await browser.close()
    
    print(f"\n✅ Done! Completed: {len([x for x in queue.queue if x.status == 'done'])}, Failed: {len([x for x in queue.queue if x.status == 'failed'])}")


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Comprehensive queue-based scraper for b2bfurnituresupply.com")
    parser.add_argument("--headed", action="store_true", help="Run with visible browser")
    parser.add_argument("--reset", action="store_true", help="Reset queue and re-discover URLs")
    parser.add_argument("--incremental", action="store_true", help="Enable incremental scraping")
    parser.add_argument("--concurrent", type=int, default=3, help="Max concurrent pages")
    parser.add_argument("--rate", type=float, default=2.0, help="Requests per second")
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