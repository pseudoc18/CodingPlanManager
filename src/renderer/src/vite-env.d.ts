/// <reference types="vite/client" />

import type { CodingPlanManagerApi } from "../../../preload/preload";

declare global {
  interface Window {
    codingPlanManager: CodingPlanManagerApi;
  }
}
