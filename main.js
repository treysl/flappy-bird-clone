const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 450,
    height: 650,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Flappy Bird Clone',
    autoHideMenuBar: true,
    resizable: true
  });

  // Ensure audio is not muted
  mainWindow.webContents.setAudioMuted(false);

  // Load the index.html file using absolute path
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // DevTools disabled for production
  // Uncomment the line below if you need to debug:
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

