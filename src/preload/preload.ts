import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/ipc.js";
import type { ActivateResult, AppState, ProfileInput, ProviderId } from "../shared/types.js";

const api = {
  getState: () => ipcRenderer.invoke(IPC_CHANNELS.getState) as Promise<AppState>,
  rescan: () => ipcRenderer.invoke(IPC_CHANNELS.rescan) as Promise<AppState>,
  saveProfile: (input: ProfileInput) => ipcRenderer.invoke(IPC_CHANNELS.saveProfile, input),
  deleteProfile: (profileId: string) => ipcRenderer.invoke(IPC_CHANNELS.deleteProfile, profileId) as Promise<void>,
  activateProfile: (providerId: ProviderId, profileId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.activateProfile, providerId, profileId) as Promise<ActivateResult>,
  openAppData: () => ipcRenderer.invoke(IPC_CHANNELS.openAppData) as Promise<string>
};

contextBridge.exposeInMainWorld("codingPlanManager", api);

export type CodingPlanManagerApi = typeof api;
