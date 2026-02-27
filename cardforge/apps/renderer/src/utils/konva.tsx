import React from 'react';
import { resolveImageSrc } from './file';
import { isVideoMediaUrl } from './media';

export function useHtmlImage(src?: string, projectRoot?: string) {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  React.useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.src = resolveImageSrc(src, projectRoot);
  }, [src, projectRoot]);
  return img;
}

export function useHtmlMedia(src?: string, projectRoot?: string) {
  const [media, setMedia] = React.useState<
    HTMLImageElement | HTMLVideoElement | null
  >(null);

  React.useEffect(() => {
    if (!src) {
      setMedia(null);
      return;
    }
    const resolved = resolveImageSrc(src, projectRoot);

    if (isVideoMediaUrl(resolved)) {
      const video = document.createElement('video');
      const onLoadedMetadata = () => {
        // Video dimensions are now available
        setMedia(video);
        // Video is ready, now safe to play
        video.play().catch((e) => {
          console.error("Video play blocked by browser:", e);
        });
      };
      const onLoadedData = () => {
        // Video data is loaded
        video.play().catch((e) => {
          console.error("Video play blocked by browser:", e);
        });
      };
      const onCanPlay = () => {
        // Alternative event for when video can play
        video.play().catch((e) => {
          console.error("Video play blocked by browser:", e);
        });
      };
      
      // Enforce browser autoplay policies
      // Only set crossOrigin for non-blob URLs to avoid blocking local files
      if (!resolved.startsWith('blob:') && !resolved.startsWith('data:')) {
        video.crossOrigin = 'anonymous';
      }
      video.muted = true; // CRITICAL for autoplay
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      
      // Add multiple event listeners for reliability
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('canplaythrough', onCanPlay);
      
      video.src = resolved;
      video.load();

      return () => {
        video.pause();
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('canplaythrough', onCanPlay);
        video.src = '';
        video.load();
      };
    }

    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setMedia(image);
    image.src = resolved;

    return () => {
      image.onload = null;
    };
  }, [src, projectRoot]);

  return media;
}
