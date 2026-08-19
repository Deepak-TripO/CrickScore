export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;
  // If it's a raw UUID or ID string without a slash or protocol, it is not a valid image URL
  if (!trimmed.includes('/') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

export function sanitizeImageUrl(url?: string | null): string {
  if (!isValidImageUrl(url)) return '';
  const trimmed = url!.trim();
  if (trimmed.includes('/storage/v1/object/') && !trimmed.includes('/storage/v1/object/public/')) {
    return trimmed.replace('/storage/v1/object/', '/storage/v1/object/public/');
  }
  return trimmed;
}
