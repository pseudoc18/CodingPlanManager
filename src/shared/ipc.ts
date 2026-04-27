export const IPC_CHANNELS = {
  getState: "app:get-state",
  saveProfile: "profiles:save",
  deleteProfile: "profiles:delete",
  activateProfile: "profiles:activate",
  rescan: "providers:rescan",
  openAppData: "app:open-data"
} as const;
