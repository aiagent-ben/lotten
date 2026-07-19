'use server';

import { createServiceClient } from '@/lib/db/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { revalidatePath } from 'next/cache';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function generateUploadUrl(
  productId: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string } | { error: string }> {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return { error: 'R2 credentials not configured' };
  }

  // Sanitize filename
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
  if (!allowedExts.includes(ext)) {
    return { error: 'Invalid file type. Allowed: jpg, jpeg, png, webp, avif' };
  }

  // Generate unique key
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const key = `products/${productId}/${timestamp}-${random}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hour

    return {
      uploadUrl,
      publicUrl: `${R2_PUBLIC_URL}/${key}`,
      key,
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return { error: 'Failed to generate upload URL' };
  }
}

export async function deleteImage(key: string): Promise<{ success: boolean; error?: string }> {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    return { success: false, error: 'R2 credentials not configured' };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    await r2Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}

export async function createProductImageRecord(
  productId: string,
  url: string,
  altText: string | null,
  sortOrder: number,
  isPrimary: boolean
): Promise<{ success: boolean; error?: string; image?: { id: string } }> {
  const supabase = createServiceClient();

  // If this is primary, unset other primary images
  if (isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url,
      alt_text: altText,
      sort_order: sortOrder,
      is_primary: isPrimary,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { success: true, image: { id: data.id } };
}

export async function updateProductImage(
  imageId: string,
  updates: { alt_text?: string; sort_order?: number; is_primary?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // If setting as primary, unset others
  if (updates.is_primary) {
    const { data: currentImage } = await supabase
      .from('product_images')
      .select('product_id')
      .eq('id', imageId)
      .single();

    if (currentImage) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', currentImage.product_id)
        .eq('is_primary', true)
        .neq('id', imageId);
    }
  }

  const { error } = await supabase
    .from('product_images')
    .update(updates)
    .eq('id', imageId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/products');
  return { success: true };
}

export async function deleteProductImage(
  imageId: string,
  key: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Delete from R2
  const deleteResult = await deleteImage(key);
  if (!deleteResult.success) {
    return deleteResult;
  }

  // Delete from database
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/products');
  return { success: true };
}

export async function reorderProductImages(
  imageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const updates = imageIds.map((id, index) =>
    supabase.from('product_images').update({ sort_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error).map((r) => r.error!.message);

  if (errors.length > 0) {
    return { success: false, error: errors.join(', ') };
  }

  revalidatePath('/admin/products');
  return { success: true };
}