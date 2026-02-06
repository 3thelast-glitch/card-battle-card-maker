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
});
