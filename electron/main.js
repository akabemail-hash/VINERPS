
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "VinERP POS",
    // icon: path.join(__dirname, '../public/icon.ico'), // Ensure you have an icon here or comment this out
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false // Set to true if you need to debug
    },
    autoHideMenuBar: true, // Hides the File/Edit menu
    frame: true, 
  });

  // Remove the application menu completely
  Menu.setApplicationMenu(null);

  // In development, load from Vite server. In production, load from built file.
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); 
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
