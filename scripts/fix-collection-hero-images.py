#!/usr/bin/env python3
"""
Download collection hero images from hinlim.com, upload to R2, update Supabase.
"""
import os
import sys
import asyncio
import aiohttp

# Add project root to path
sys.path.insert(0, '/opt/data/workspace/projects/lotten')

from supabase import create_client

# Load env
from dotenv import load_dotenv
load_dotenv('/opt/data/workspace/projects/lotten/.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.getenv('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET = os.getenv('R2_BUCKET_NAME', 'lotten-images')
R2_PUBLIC_URL = os.getenv('R2_PUBLIC_URL', 'https://pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev')
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Collections with hinlim.com hero images
COLLECTIONS_TO_FIX = [
    {
        "id": "7e9b2419-9292-4961-b247-b8250a1e5e7b",
        "slug": "breda",
        "hero_image_url": "https://mm.hinlim.com/cache/b2bfs/product/335048/335048-550x500.jpg"
    },
    {
        "id": "1ef73dd1-67b8-49e0-a58c-724cf56e50c7",
        "slug": "castor",
        "hero_image_url": "https://mm.hinlim.com/cache/b2bfs/product/335043/335043-550x500.jpg"
    },
    {
        "id": "d3737b59-5402-4c7e-8312-10eab78efd6b",
        "slug": "dover",
        "hero_image_url": "https://mm.hinlim.com/cache/b2bfs/product/346036/346036-550x500.jpg"
    },
    {
        "id": "a880d3ef-a8e9-4071-96cc-65a638536e21",
        "slug": "dudley",
        "hero_image_url": "https://mm.hinlim.com/cache/b2bfs/product/345066/345066-550x500.jpg"
    },
]

async def download_image(session, url):
    """Download image from hinlim.com"""
    try:
        async with session.get(url) as resp:
            if resp.status == 200:
                return await resp.read()
            else:
                print(f"Failed to download {url}: {resp.status}")
                return None
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

async def upload_to_r2(collection_slug, image_data):
    """Upload image to Cloudflare R2"""
    import boto3
    from botocore.config import Config
    
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )
    
    key = f"collections/{collection_slug}/hero.webp"
    
    try:
        s3.put_object(
            Bucket=R2_BUCKET,
            Key=key,
            Body=image_data,
            ContentType='image/webp',
            ACL='public-read'
        )
        return f"{R2_PUBLIC_URL}/{key}"
    except Exception as e:
        print(f"Error uploading to R2: {e}")
        return None

async def main():
    async with aiohttp.ClientSession() as session:
        for coll in COLLECTIONS_TO_FIX:
            print(f"\nProcessing {coll['slug']}...")
            
            # Download
            print(f"  Downloading from hinlim.com...")
            image_data = await download_image(session, coll['hero_image_url'])
            if not image_data:
                print(f"  FAILED: Could not download")
                continue
            
            # Upload to R2
            print(f"  Uploading to R2...")
            r2_url = await upload_to_r2(coll['slug'], image_data)
            if not r2_url:
                print(f"  FAILED: Could not upload to R2")
                continue
            
            # Update Supabase
            print(f"  Updating Supabase...")
            try:
                result = supabase.table('collections').update({
                    'hero_image_url': r2_url
                }).eq('id', coll['id']).execute()
                
                if result.data:
                    print(f"  SUCCESS: Updated to {r2_url}")
                else:
                    print(f"  FAILED: No data returned")
            except Exception as e:
                print(f"  FAILED: {e}")

if __name__ == '__main__':
    asyncio.run(main())