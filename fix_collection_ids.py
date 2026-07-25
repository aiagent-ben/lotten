import json

# Load products
with open('public/data/products.json') as f:
    products = json.load(f)

# Load collections to get name -> id mapping
with open('public/data/collections.json') as f:
    collections_data = json.load(f)

name_to_id = {c['name']: c['id'] for c in collections_data['collections']}

# Fix products
for p in products:
    collection_name = p.get('collection')
    if collection_name and collection_name in name_to_id:
        p['collection_id'] = name_to_id[collection_name]
    else:
        p['collection_id'] = None

# Save
with open('public/data/products.json', 'w') as f:
    json.dump(products, f, indent=2)

print(f"Fixed {len(products)} products")
# Check Loftus
loftus_count = sum(1 for p in products if p.get('collection') == 'Loftus')
print(f"Loftus products: {loftus_count}")
