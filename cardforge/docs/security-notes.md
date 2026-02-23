# Security Notes (Electron)

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- IPC restricted to open/save dialogs and file read/write only

Future hardening:

- Path allow-listing for writes
- File size checks for large images
