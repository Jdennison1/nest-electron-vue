// NOTE: https://steemit.com/education/@ryanbaer/getting-started-with-electron-a-basic-menubar-app-part-1

// Modules to control application life and create native browser window
const {app, BrowserWindow, Tray, ipcMain, nativeImage} = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600, 
    height: 350,
    frame: false,
    resizable: false
  });
  let icon = nativeImage.createEmpty()
  tray = new Tray(icon);
  tray.setTitle("");

  tray.on('click', function(event) {
    toggleWindow();
  });

  // and load the index.html of the app.
  mainWindow.loadFile('./dist/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Receive message on update-tray-temp channel from renderer processes
ipcMain.on('update-tray-temp', (event, arg) => {
  mainWindow.hide()
  tray.setTitle(arg);
});

const toggleWindow = () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  const trayPos = tray.getBounds()
  const windowPos = mainWindow.getBounds()
  let x, y = 0
  if (process.platform == 'darwin') {
    x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2))
    y = Math.round(trayPos.y + trayPos.height)
  } else {
    x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2))
    y = Math.round(trayPos.y + trayPos.height * 10)
  }

  mainWindow.setPosition(x, y, false)
  mainWindow.show()
  mainWindow.focus()
}