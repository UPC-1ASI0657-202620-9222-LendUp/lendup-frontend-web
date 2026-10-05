export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export function photoSelectionError(
  files: readonly { type: string; size: number }[],
  currentCount: number,
): 'limit' | 'format' | 'size' | undefined {
  if (currentCount + files.length > MAX_PHOTOS) return 'limit';
  if (
    files.some(
      (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    )
  )
    return 'format';
  if (files.some((file) => file.size === 0 || file.size > MAX_PHOTO_BYTES))
    return 'size';
}
