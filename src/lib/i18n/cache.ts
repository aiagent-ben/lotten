import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Safely invalidate a Next.js cache tag (no-ops cleanly in Vitest/CLI contexts
 * where the Next.js incremental cache store is absent).
 */
export function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch {
    // Ignore outside Next.js request context (e.g., Vitest / CLI scripts)
  }
}

export function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request context
  }
}
