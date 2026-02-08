import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { constants as fsConstants, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import ffmpeg = require('fluent-ffmpeg');
import ffmpegPath = require('ffmpeg-static');
import ffprobePath = require('ffprobe-static');

const isDev = !app.isPackaged;

const loadEnvValue = (content: string, key: string) => {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const [rawKey, ...rest] = line.split('=');
    if (rawKey?.trim() !== key) continue;
    return rest.join('=').trim();
  }
  return '';
};

const ensureGeminiKey = () => {
  if (process.env.GEMINI_API_KEY) return;
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', 'renderer', '.env'),
  ];
  for (const envPath of candidates) {
    try {
      const text = readFileSync(envPath, 'utf-8');
      const value = loadEnvValue(text, 'GEMINI_API_KEY');
      if (value) {
        process.env.GEMINI_API_KEY = value;
        break;
      }
    } catch {
      // ignore missing env file
    }
  }
};

ensureGeminiKey();

const resolvedFfmpegPath = typeof ffmpegPath === 'string' ? ffmpegPath : '';
const resolvedFfprobePath = (ffprobePath as any)?.path || (ffprobePath as string | undefined);
if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
}
if (resolvedFfprobePath) {
  ffmpeg.setFfprobePath(resolvedFfprobePath);
}

// âœ… Fix: force Chromium cache directories to a writable location (userData)
const userData = app.getPath('userData');
app.commandLine.appendSwitch('disk-cache-dir', path.join(userData, 'Cache'));
app.commandLine.appendSwitch('gpu-disk-cache-dir', path.join(userData, 'GPUCache'));
// Optional: reduce noisy GPU shader cache warnings (keep GPU on)
// app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    backgroundColor: '#0b0f19',
    title: 'CardSmith Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(__dirname, '../../renderer/dist/index.html');
    win.loadFile(indexHtml);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

type VideoProbeResult =
  | {
      ok: true;
      container?: string;
      duration?: number;
      width?: number;
      height?: number;
      videoCodec?: string;
      audioCodec?: string;
      hasAudio?: boolean;
      bitrate?: number;
      size?: number;
    }
  | { ok: false; error: string };

const toNumber = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const sanitizeId = (value: string) => value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');

const resolveMediaRoot = (projectPath?: string) => {
  if (projectPath) {
    return path.join(path.dirname(projectPath), 'media');
  }
  return path.join(app.getPath('userData'), 'media');
};

const resolveMediaPaths = (projectPath?: string, assetId?: string) => {
  const root = resolveMediaRoot(projectPath);
  const base = sanitizeId(assetId || randomUUID()) || randomUUID();
  const videosDir = path.join(root, 'videos');
  const postersDir = path.join(root, 'posters');
  return {
    videosDir,
    postersDir,
    videoPath: path.join(videosDir, `${base}.mp4`),
    posterPath: path.join(postersDir, `${base}.png`),
  };
};

const probeVideo = async (filePath: string): Promise<VideoProbeResult> => {
  if (!resolvedFfmpegPath || !resolvedFfprobePath) {
    return { ok: false, error: 'FFMPEG_UNAVAILABLE' };
  }
  try {
    const stat = await fs.stat(filePath);
    const metadata = await new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error: any, data: any) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
    const format = metadata?.format ?? {};
    const streams = metadata?.streams ?? [];
    const videoStream = streams.find((stream: any) => stream.codec_type === 'video');
    const audioStream = streams.find((stream: any) => stream.codec_type === 'audio');
    return {
      ok: true,
      container: String(format.format_name || '').split(',')[0] || undefined,
      duration: toNumber(format.duration),
      width: toNumber(videoStream?.width),
      height: toNumber(videoStream?.height),
      videoCodec: videoStream?.codec_name,
      audioCodec: audioStream?.codec_name,
      hasAudio: Boolean(audioStream),
      bitrate: toNumber(format.bit_rate),
      size: stat.size,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'PROBE_FAILED' };
  }
};

type GeminiPayload = {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

ipcMain.handle('dialog:openFile', async () => {
  return dialog.showOpenDialog({
    title: 'Open CardSmith Project',
    filters: [{ name: 'CardSmith Project (.cardsmith.json)', extensions: ['json'] }],
    properties: ['openFile'],
  });
});

ipcMain.handle('dialog:saveFile', async () => {
  return dialog.showSaveDialog({
    title: 'Save CardSmith Project',
    defaultPath: 'project.cardsmith.json',
    filters: [{ name: 'CardSmith Project (.cardsmith.json)', extensions: ['json'] }],
  });
});

ipcMain.handle('dialog:selectFolder', async () => {
  return dialog.showOpenDialog({
    title: 'Choose Export Folder',
    properties: ['openDirectory', 'createDirectory'],
  });
});

ipcMain.handle('dialog:selectImagesFolder', async () => {
  return dialog.showOpenDialog({
    title: 'Choose Images Folder',
    properties: ['openDirectory'],
  });
});

ipcMain.handle('dialog:openImageFiles', async () => {
  return dialog.showOpenDialog({
    title: 'Import Images',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'],
      },
    ],
  });
});

ipcMain.handle('fs:readFile', async (_evt, { filePath }: { filePath: string }) => {
  const text = await fs.readFile(filePath, 'utf-8');
  return { ok: true, text };
});

ipcMain.handle(
  'fs:writeFile',
  async (
    _evt,
    { filePath, text, data }: { filePath: string; text?: string; data?: ArrayBuffer },
  ) => {
    if (typeof text === 'string') {
      await fs.writeFile(filePath, text, 'utf-8');
      return { ok: true };
    }
    if (data instanceof ArrayBuffer) {
      const buf = Buffer.from(new Uint8Array(data));
      await fs.writeFile(filePath, buf);
      return { ok: true };
    }
    return { ok: false, error: 'Missing write payload' };
  },
);

ipcMain.handle('fs:exists', async (_evt, { filePath }: { filePath: string }) => {
  try {
    await fs.access(filePath, fsConstants.F_OK);
    return { ok: true, exists: true };
  } catch {
    return { ok: true, exists: false };
  }
});

ipcMain.handle(
  'fs:copyFile',
  async (
    _evt,
    { sourcePath, destinationPath }: { sourcePath: string; destinationPath: string },
  ) => {
    try {
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
      const stat = await fs.stat(destinationPath);
      return { ok: true, size: stat.size };
    } catch (error: any) {
      return { ok: false, error: error?.code ?? 'COPY_FAILED' };
    }
  },
);

ipcMain.handle('gemini:generate', async (_evt, payload: GeminiPayload) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'MISSING_API_KEY' };
  }
  const prompt = String(payload?.prompt ?? '').trim();
  if (!prompt) {
    return { ok: false, error: 'EMPTY_PROMPT' };
  }
  const model = payload?.model ?? 'gemini-1.5-flash';
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: payload?.temperature ?? 0.7,
            maxOutputTokens: payload?.maxOutputTokens ?? 512,
          },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data?.error?.message ?? 'API_ERROR' };
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? '').join('') ?? '';
    if (!text) {
      return { ok: false, error: 'EMPTY_RESPONSE' };
    }
    return { ok: true, text };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'REQUEST_FAILED' };
  }
});

ipcMain.handle('video:probe', async (_evt, { filePath }: { filePath: string }) => {
  return probeVideo(filePath);
});

ipcMain.handle(
  'video:transcode',
  async (
    event,
    {
      filePath,
      projectPath,
      keepAudio,
      requestId,
      assetId,
      copyOnly,
    }: {
      filePath: string;
      projectPath?: string;
      keepAudio?: boolean;
      requestId?: string;
      assetId?: string;
      copyOnly?: boolean;
    },
  ) => {
    if (!resolvedFfmpegPath || !resolvedFfprobePath) {
      return { ok: false, error: 'FFMPEG_UNAVAILABLE' };
    }
    try {
      const { videosDir, videoPath } = resolveMediaPaths(projectPath, assetId);
      await fs.mkdir(videosDir, { recursive: true });
      if (copyOnly) {
        await fs.copyFile(filePath, videoPath);
        const stat = await fs.stat(videoPath);
        return { ok: true, outPath: videoPath, stats: { size: stat.size } };
      }
      return await new Promise<{ ok: true; outPath: string; stats?: { size?: number } } | { ok: false; error?: string }>(
        (resolve) => {
          const command = ffmpeg(filePath)
            .outputOptions([
              '-y',
              '-movflags +faststart',
              '-pix_fmt yuv420p',
              '-preset veryfast',
              '-crf 30',
              "-vf scale='if(gte(iw,ih),min(iw,720),-2)':'if(gte(iw,ih),-2,min(ih,720))'",
            ])
            .videoCodec('libx264')
            .format('mp4');

          if (keepAudio) {
            command.audioCodec('aac').audioBitrate('96k');
          } else {
            command.noAudio();
          }

          command
            .on('progress', (progress: any) => {
              event.sender.send('video:transcode:progress', {
                requestId,
                pct: progress?.percent ?? 0,
                fps: progress?.currentFps ?? 0,
                time: progress?.timemark ?? '',
              });
            })
            .on('end', async () => {
              const stat = await fs.stat(videoPath);
              resolve({ ok: true, outPath: videoPath, stats: { size: stat.size } });
            })
            .on('error', (error: any) => {
              resolve({ ok: false, error: error?.message ?? 'TRANSCODE_FAILED' });
            })
            .save(videoPath);
        },
      );
    } catch (error: any) {
      return { ok: false, error: error?.message ?? 'TRANSCODE_FAILED' };
    }
  },
);

ipcMain.handle(
  'video:poster',
  async (
    _evt,
    {
      filePath,
      projectPath,
      assetId,
      timeSec,
      size,
    }: { filePath: string; projectPath?: string; assetId?: string; timeSec?: number; size?: number },
  ) => {
    if (!resolvedFfmpegPath || !resolvedFfprobePath) {
      return { ok: false, error: 'FFMPEG_UNAVAILABLE' };
    }
    try {
      const { postersDir, posterPath } = resolveMediaPaths(projectPath, assetId);
      await fs.mkdir(postersDir, { recursive: true });
      const probe = await probeVideo(filePath);
      const duration = probe.ok ? probe.duration ?? 0 : 0;
      const targetTime =
        typeof timeSec === 'number'
          ? timeSec
          : duration
            ? Math.min(Math.max(duration * 0.2, 0.2), Math.max(duration - 0.1, 0.2))
            : 1;
      const targetSize = typeof size === 'number' && size > 0 ? Math.floor(size) : 720;
      await new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
          .seekInput(targetTime)
          .outputOptions([
            '-y',
            '-frames:v 1',
            `-vf scale=${targetSize}:${targetSize}:force_original_aspect_ratio=increase,crop=${targetSize}:${targetSize}`,
          ])
          .on('end', () => resolve())
          .on('error', (error: any) => reject(error))
          .save(posterPath);
      });
      return { ok: true, posterPath };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? 'POSTER_FAILED' };
    }
  },
);
