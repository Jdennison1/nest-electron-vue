const {app, BrowserWindow, Tray, ipcMain, nativeImage} = require('electron');
const Store = require('electron-store');
const store = new Store();
const path = require('path');
const isWin = process.platform === 'win32';

let mainWindow;
let tray;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600, 
    height: 300,
    frame: false,
    resizable: false,
    show: !store.has('NestToken'),
    alwaysOnTop: true
  });
  
  // Update icon based on OS
  let icon = isWin ? nativeImage.createFromPath(path.join(__dirname, 'src/assets/thermometerIcon.png')) : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setTitle('--℉');

  tray.on('click', function(event) {
    toggleWindow();
  });

  mainWindow.loadFile('./dist/index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

// Quit
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Receive message on update-tray-temp channel from renderer processes
ipcMain.on('update-tray-temp', (event, arg) => {
  tray.setTitle(arg);
});

ipcMain.on('nest-auth-complete', () => mainWindow.hide());

ipcMain.on('electron-window-size', (event, width, height) => {
  mainWindow.setSize(width, height);
});

const toggleWindow = () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  if(!isWin) {
    const trayPos = tray.getBounds();
    const windowPos = mainWindow.getBounds();
    let x, y = 0;
    if (process.platform == 'darwin') {
      x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
      y = Math.round(trayPos.y + trayPos.height);
    } else {
      x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
      y = Math.round(trayPos.y + trayPos.height * 10);
    }

    mainWindow.setPosition(x, y, false);
  }

  mainWindow.show();
  mainWindow.focus();
}