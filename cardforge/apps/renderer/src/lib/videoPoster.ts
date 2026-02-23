async function captureFromVideo(video: HTMLVideoElement, timeSec: number) {
  const seekTime = Math.min(
    Math.max(timeSec, 0),
    Math.max(0, (video.duration || 1) - 0.05),
  );
  await new Promise<void>((resolve, reject) => {
    video.currentTime = seekTime;
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error('Video seek failed'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}

export async function captureVideoPoster(
  file: File,
  timeSec = 0.1,
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Video metadata load failed'));
    });

    return await captureFromVideo(video, timeSec);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function captureVideoPosterFromUrl(
  src: string,
  timeSec = 0.1,
): Promise<string> {
  const video = document.createElement('video');
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Video metadata load failed'));
  });

  return captureFromVideo(video, timeSec);
}
