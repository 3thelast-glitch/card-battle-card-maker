/// <reference types="vite/client" />

declare global {
  interface Window {
    cardsmith?: {
      openFile: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      saveFile: () => Promise<{ canceled: boolean; filePath?: string }>;
      selectFolder: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      selectImagesFolder: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      openImageFiles: () => Promise<{ canceled: boolean; filePaths?: string[] }>;
      readFile: (filePath: string) => Promise<{ ok: boolean; text?: string }>;
      writeFile: (filePath: string, payload: { text?: string; data?: ArrayBuffer }) => Promise<{ ok: boolean }>;
      copyFile: (sourcePath: string, destinationPath: string) => Promise<{ ok: boolean; size?: number; error?: string }>;
      fileExists: (filePath: string) => Promise<{ ok: boolean; exists?: boolean }>;
    };
  }
}

export {};
