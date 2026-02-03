import React from 'react';
import { resolveImageSrc } from './file';

export function useHtmlImage(src?: string) {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  React.useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.src = resolveImageSrc(src);
  }, [src]);
  return img;
}
