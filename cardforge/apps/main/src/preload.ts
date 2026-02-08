import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cardsmith', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: () => ipcRenderer.invoke('dialog:saveFile'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  selectImagesFolder: () => ipcRenderer.invoke('dialog:selectImagesFolder'),
  openImageFiles: () => ipcRenderer.invoke('dialog:openImageFiles'),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', { filePath }),
  writeFile: (filePath: string, payload: { text?: string; data?: ArrayBuffer }) =>
    ipcRenderer.invoke('fs:writeFile', { filePath, ...payload }),
  copyFile: (sourcePath: string, destinationPath: string) =>
    ipcRenderer.invoke('fs:copyFile', { sourcePath, destinationPath }),
  fileExists: (filePath: string) => ipcRenderer.invoke('fs:exists', { filePath }),
  video: {
    probe: (filePath: string) => ipcRenderer.invoke('video:probe', { filePath }),
    transcode: (
      filePath: string,
      opts: { projectPath?: string; keepAudio?: boolean; requestId?: string; assetId?: string; copyOnly?: boolean },
    ) => ipcRenderer.invoke('video:transcode', { filePath, ...opts }),
    poster: (filePath: string, opts: { projectPath?: string; assetId?: string; timeSec?: number; size?: number }) =>
      ipcRenderer.invoke('video:poster', { filePath, ...opts }),
    onTranscodeProgress: (handler: (payload: any) => void) => {
      const listener = (_event: any, payload: any) => handler(payload);
      ipcRenderer.on('video:transcode:progress', listener);
      return () => ipcRenderer.removeListener('video:transcode:progress', listener);
    },
  },
});

contextBridge.exposeInMainWorld('ai', {
  generate: (payload: { prompt: string; model?: string; temperature?: number; maxOutputTokens?: number }) =>
    ipcRenderer.invoke('gemini:generate', payload),
});
