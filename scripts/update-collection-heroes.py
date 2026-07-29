#!/usr/bin/env python3
"""
Update collection hero_image_url from first product's primary image.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.local")

sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase import create_client

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def main():
    # Get all collections
    collections = supabase.table('collections').select('id, slug').execute().data
    print(f"Found {len(collections)} collections")
    
    for coll in collections:
        # Get first product in this collection with a primary image
        products = supabase.table('products')\
            .select('id')\
            .eq('collection_id', coll['id'])\
            .eq('is_active', True)\
            .limit(1)\
            .execute().data
        
        if not products:
            print(f"  ⊘ {coll['slug']}: no products")
            continue
            
        product_id = products[0]['id']
        
        # Get primary image for this product
        images = supabase.table('product_images')\
            .select('url')\
            .eq('product_id', product_id)\
            .eq('is_primary', True)\
            .limit(1)\
            .execute().data
        
        if not images:
            # Try any image
            images = supabase.table('product_images')\
                .select('url')\
                .eq('product_id', product_id)\
                .order('sort_order')\
                .limit(1)\
                .execute().data
        
        if not images:
            print(f"  ⊘ {coll['slug']}: no images for product {product_id}")
            continue
            
        hero_url = images[0]['url']
        
        # Update collection
        result = supabase.table('collections').update({
            'hero_image_url': hero_url
        }).eq('id', coll['id']).execute()
        
        if result.data:
            print(f"  ✓ {coll['slug']}: {hero_url}")
        else:
            print(f"  ✗ {coll['slug']}: update failed")

if __name__ == '__main__':
    main()