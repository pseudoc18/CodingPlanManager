export type ProviderId = "codex" | "claude" | "hermes";

export type AccountType = "unknown" | "free" | "plus" | "pro" | "team" | "business" | "enterprise" | "api";

export type QuotaStatus = "healthy" | "watch" | "limited" | "unknown";

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  description: string;
  homePath: string;
  enabled: boolean;
  envKeys: string[];
}

export interface ConfigDiscovery {
  providerId: ProviderId;
  homePath: string;
  exists: boolean;
  files: string[];
  hints: string[];
  lastScannedAt: string;
}

export interface UsageSnapshot {
  used: number;
  limit: number;
  unit: "requests" | "tokens" | "usd" | "minutes";
  resetAt?: string;
  updatedAt: string;
}

export interface AccountProfile {
  id: string;
  providerId: ProviderId;
  label: string;
  accountEmail?: string;
  workspace?: string;
  accountType: AccountType;
  apiKey?: string;
  organizationId?: string;
  projectId?: string;
  baseUrl?: string;
  notes?: string;
  usage?: UsageSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveProfile {
  providerId: ProviderId;
  profileId?: string;
  appliedAt?: string;
  envFile?: string;
}

export interface AppState {
  providers: ProviderDefinition[];
  discoveries: ConfigDiscovery[];
  profiles: AccountProfile[];
  activeProfiles: ActiveProfile[];
}

export interface ProfileInput {
  id?: string;
  providerId: ProviderId;
  label: string;
  accountEmail?: string;
  workspace?: string;
  accountType?: AccountType;
  apiKey?: string;
  organizationId?: string;
  projectId?: string;
  baseUrl?: string;
  notes?: string;
  usage?: UsageSnapshot;
}

export interface ActivateResult {
  active: ActiveProfile;
  envPreview: Record<string, string>;
}
