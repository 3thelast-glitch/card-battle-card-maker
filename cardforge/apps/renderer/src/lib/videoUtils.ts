export async function getVideoMetadata(file: File) {
  return new Promise<{
    duration: number;
    width: number;
    height: number;
    canPlay: string;
  }>((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const meta = {
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
        canPlay: video.canPlayType(file.type || ''),
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid video'));
    };
  });
}

export async function generatePoster(file: File, time = 0.5): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const safeTime = Math.min(
        Math.max(time, 0),
        Math.max(0, video.duration - 0.1),
      );
      video.currentTime = Number.isFinite(safeTime) ? safeTime : 0;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1;
      canvas.height = video.videoHeight || 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Poster failed'));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Poster failed'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.92,
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid video'));
    };
  });
}
