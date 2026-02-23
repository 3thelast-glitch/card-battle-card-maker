/// <reference types="vite/client" />

declare global {
  interface Window {
    cardsmith?: {
      openFile: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      saveFile: () => Promise<{ canceled: boolean; filePath?: string }>;
      selectFolder: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      selectImagesFolder: () => Promise<{
        canceled: boolean;
        filePaths?: string[];
      }>;
      openImageFiles: () => Promise<{
        canceled: boolean;
        filePaths?: string[];
      }>;
      readFile: (filePath: string) => Promise<{ ok: boolean; text?: string }>;
      writeFile: (
        filePath: string,
        payload: { text?: string; data?: ArrayBuffer },
      ) => Promise<{ ok: boolean }>;
      copyFile: (
        sourcePath: string,
        destinationPath: string,
      ) => Promise<{ ok: boolean; size?: number; error?: string }>;
      fileExists: (
        filePath: string,
      ) => Promise<{ ok: boolean; exists?: boolean }>;
      video?: {
        probe: (filePath: string) => Promise<
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
          | { ok: false; error?: string }
        >;
        transcode: (
          filePath: string,
          opts: {
            projectPath?: string;
            keepAudio?: boolean;
            requestId?: string;
            assetId?: string;
            copyOnly?: boolean;
          },
        ) => Promise<
          | { ok: true; outPath: string; stats?: { size?: number } }
          | { ok: false; error?: string }
        >;
        poster: (
          filePath: string,
          opts: {
            projectPath?: string;
            assetId?: string;
            timeSec?: number;
            size?: number;
          },
        ) => Promise<
          { ok: true; posterPath: string } | { ok: false; error?: string }
        >;
        onTranscodeProgress: (
          handler: (payload: {
            requestId?: string;
            pct?: number;
            fps?: number;
            time?: string;
          }) => void,
        ) => () => void;
      };
    };
    ai?: {
      generate: (payload: {
        prompt: string;
        model?: string;
        temperature?: number;
        maxOutputTokens?: number;
      }) => Promise<{ ok: boolean; text?: string; error?: string }>;
    };
  }
}

export {};
