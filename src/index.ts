import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import { FileManager } from './util/FileManager';
import { ChannelNames, IFileManager } from './model';
import * as url from 'url';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

  // make file access available to the renderer
  const fileManager = new FileManager();
  ipcMain.handle(ChannelNames.getSelectedDirectoryAndExistingCategories, () => fileManager.getSelectedDirectoryAndExistingCategories());
  ipcMain.handle(ChannelNames.getNextFileAndFileCount, (event, workingDirectoryAbsolutePath: string) => fileManager.getNextFileAndFileCount(workingDirectoryAbsolutePath));
  ipcMain.handle(ChannelNames.moveFile, (event, request) => fileManager.moveFile(request));

  protocol.registerFileProtocol('pilefile', (request, callback) => {
    const absolutePath = request.url.slice('pilefile://'.length);
    if (fileManager.isInOpenedDirectory(absolutePath)) {
      const filePath = url.fileURLToPath('file://' + absolutePath)
      callback(filePath)
    } else {
      console.warn(`Rejected file request ${request.url} because it is not in the opened directory`);
    }
  });

  // start window
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
