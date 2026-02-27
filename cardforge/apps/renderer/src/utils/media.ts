const VIDEO_EXTENSIONS = ['.mp4', '.webm'];

export function isVideoMediaUrl(url?: string) {
  if (!url) return false;
  const trimmed = String(url).trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:')) {
    return trimmed.startsWith('data:video/');
  }
  const withoutHash = trimmed.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0];
  return VIDEO_EXTENSIONS.some((ext) => withoutQuery.endsWith(ext));
}

export function resolveMediaKind(url?: string): 'video' | 'image' | 'none' {
  if (!url || !String(url).trim()) return 'none';
  return isVideoMediaUrl(url) ? 'video' : 'image';
}
