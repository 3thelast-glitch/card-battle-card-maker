import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';

const isDev = !app.isPackaged;

// ✅ Fix: force Chromium cache directories to a writable location (userData)
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
