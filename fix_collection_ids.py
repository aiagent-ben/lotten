import json

# Load products
with open('public/data/products.json') as f:
    data = json.load(f)
products = data.get('products', [])

# Load collections to get name -> id mapping
with open('public/data/collections.json') as f:
    collections_data = json.load(f)

name_to_id = {c['name']: c['id'] for c in collections_data['collections']}
slug_to_id = {c['slug']: c['id'] for c in collections_data['collections']}

# Fix products - map collection name to collection_id
for p in products:
    collection_name = p.get('collection')
    if collection_name and collection_name in name_to_id:
        p['collection_id'] = name_to_id[collection_name]
    else:
        p['collection_id'] = None

# Also fix any products with old col-* IDs
for p in products:
    coll_id = p.get('collection_id')
    if coll_id and coll_id.startswith('col-'):
        collection_slug = coll_id[4:]  # remove 'col-'
        if collection_slug in slug_to_id:
            p['collection_id'] = slug_to_id[collection_slug]

# Save
data['products'] = products
with open('public/data/products.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Fixed {len(products)} products")

# Check Dover
dover_products = [p for p in products if 'dover' in p.get('slug', '').lower()]
for p in dover_products:
    print(f"  {p['slug']}: collection = '{p.get('collection')}', collection_id = '{p.get('collection_id')}'")