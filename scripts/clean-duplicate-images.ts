import { createServiceClient } from '@/lib/db/client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createServiceClient();

async function cleanDuplicateImages() {
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, product_id, url, sort_order');

  if (error) {
    console.error('Error fetching images:', error);
    return;
  }

  if (!images) {
    console.log('No images found');
    return;
  }

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const img of images) {
    const key = `${img.product_id}|${img.url}|${img.sort_order}`;
    if (seen.has(key)) {
      toDelete.push(img.id);
    } else {
      seen.set(key, img.id);
    }
  }

  console.log('Total images:', images.length);
  console.log('Unique images:', seen.size);
  console.log('Duplicates to delete:', toDelete.length);

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .in('id', toDelete);
    
    if (error) {
      console.error('Delete error:', error);
    } else {
      console.log(`Deleted ${toDelete.length} duplicate images`);
    }
  }
}

cleanDuplicateImages().catch(console.error);
