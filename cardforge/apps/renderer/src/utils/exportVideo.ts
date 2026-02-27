import type Konva from 'konva';

type ExportCanvasToVideoOptions = {
  durationMs?: number;
  fps?: number;
  fileName?: string;
  mimeType?: string;
};

function resolveMimeType(preferred?: string) {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    preferred,
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].filter(Boolean) as string[];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function exportCanvasToVideo(
  stage: Konva.Stage | null | undefined,
  options: ExportCanvasToVideoOptions = {},
) {
  const durationMs = Math.max(250, Math.floor(options.durationMs ?? 4000));
  const fps = Math.max(1, Math.floor(options.fps ?? 30));
  const fileName = String(options.fileName ?? 'animated-card.webm').trim();

  if (!stage) {
    throw new Error('Canvas stage is not ready yet.');
  }
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Video recording is not supported in this browser.');
  }

  const container = stage.container();
  const sourceCanvases = Array.from(container.querySelectorAll('canvas'));
  if (!sourceCanvases.length) {
    throw new Error('Unable to find a canvas to record.');
  }

  const width = Math.max(1, Math.floor(stage.width()));
  const height = Math.max(1, Math.floor(stage.height()));
  const recordingCanvas = document.createElement('canvas');
  recordingCanvas.width = width;
  recordingCanvas.height = height;
  const context = recordingCanvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to initialize recording context.');
  }

  const drawFrame = () => {
    context.clearRect(0, 0, width, height);
    stage.batchDraw();
    sourceCanvases.forEach((canvas) => {
      if (!canvas.width || !canvas.height) return;
      context.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        width,
        height,
      );
    });
  };

  const canvasWithCapture = recordingCanvas as HTMLCanvasElement & {
    captureStream?: (frameRate?: number) => MediaStream;
  };
  if (typeof canvasWithCapture.captureStream !== 'function') {
    throw new Error('Canvas stream capture is not supported in this browser.');
  }

  const mimeType = resolveMimeType(options.mimeType) ?? 'video/webm';
  const stream = canvasWithCapture.captureStream(fps);
  const chunks: BlobPart[] = [];

  return new Promise<void>((resolve, reject) => {
    let rafId = 0;
    let stopTimer: number | undefined;
    const recorder = new MediaRecorder(stream, { mimeType });

    const cleanup = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (stopTimer != null) {
        window.clearTimeout(stopTimer);
      }
      stream.getTracks().forEach((track) => track.stop());
    };

    const tick = () => {
      drawFrame();
      rafId = requestAnimationFrame(tick);
    };

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      cleanup();
      reject(
        event.error ?? new Error('An error occurred while recording video.'),
      );
    };

    recorder.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: mimeType });
      if (!blob.size) {
        reject(new Error('No video data was captured.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'animated-card.webm';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
      resolve();
    };

    try {
      drawFrame();
      tick();
      recorder.start(100);
      stopTimer = window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, durationMs);
    } catch (error) {
      cleanup();
      reject(
        error instanceof Error
          ? error
          : new Error('Failed to start video recording.'),
      );
    }
  });
}
