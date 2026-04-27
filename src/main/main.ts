import { app, BrowserWindow, ipcMain, shell } from "electron";
import type { BrowserWindow as BrowserWindowType } from "electron";
import { join } from "node:path";
import { IPC_CHANNELS } from "../shared/ipc.js";
import type { ProfileInput, ProviderId } from "../shared/types.js";
import { ProfileStore } from "./store.js";

let mainWindow: BrowserWindowType | undefined;
let store: ProfileStore;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "Coding Plan Manager",
    backgroundColor: "#f7f4ef",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC_CHANNELS.getState, () => store.getState());
  ipcMain.handle(IPC_CHANNELS.rescan, () => store.getState());
  ipcMain.handle(IPC_CHANNELS.saveProfile, (_event, input: ProfileInput) => store.saveProfile(input));
  ipcMain.handle(IPC_CHANNELS.deleteProfile, (_event, profileId: string) => store.deleteProfile(profileId));
  ipcMain.handle(IPC_CHANNELS.activateProfile, (_event, providerId: ProviderId, profileId: string) =>
    store.activateProfile(providerId, profileId)
  );
  ipcMain.handle(IPC_CHANNELS.openAppData, () => shell.openPath(store.getAppDataPath()));
}

void app.whenReady().then(() => {
  store = new ProfileStore(app.getPath("userData"));
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
