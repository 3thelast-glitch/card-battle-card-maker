import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cardsmith', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: () => ipcRenderer.invoke('dialog:saveFile'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', { filePath }),
  writeFile: (filePath: string, payload: { text?: string; data?: ArrayBuffer }) =>
    ipcRenderer.invoke('fs:writeFile', { filePath, ...payload }),
});
