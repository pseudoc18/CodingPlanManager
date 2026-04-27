import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AccountProfile, ActiveProfile, AppState, ProfileInput, ProviderId } from "../shared/types.js";
import { providers, scanAllProviders } from "./providers.js";

interface PersistedState {
  profiles: AccountProfile[];
  activeProfiles: ActiveProfile[];
}

const defaultState: PersistedState = {
  profiles: [],
  activeProfiles: []
};

export class ProfileStore {
  private readonly dataDir: string;
  private readonly stateFile: string;
  private readonly activeDir: string;

  constructor(userDataPath: string) {
    this.dataDir = join(userDataPath, "profile-store");
    this.stateFile = join(this.dataDir, "profiles.json");
    this.activeDir = join(this.dataDir, "active");
    mkdirSync(this.activeDir, { recursive: true });
  }

  getAppDataPath(): string {
    return this.dataDir;
  }

  getState(): AppState {
    const persisted = this.read();
    return {
      providers,
      discoveries: scanAllProviders(),
      profiles: persisted.profiles,
      activeProfiles: persisted.activeProfiles
    };
  }

  saveProfile(input: ProfileInput): AccountProfile {
    const persisted = this.read();
    const now = new Date().toISOString();
    const existing = input.id ? persisted.profiles.find((profile) => profile.id === input.id) : undefined;
    const profile: AccountProfile = {
      id: existing?.id ?? randomUUID(),
      providerId: input.providerId,
      label: input.label.trim(),
      accountEmail: clean(input.accountEmail),
      workspace: clean(input.workspace),
      accountType: input.accountType ?? "unknown",
      apiKey: clean(input.apiKey),
      organizationId: clean(input.organizationId),
      projectId: clean(input.projectId),
      baseUrl: clean(input.baseUrl),
      notes: clean(input.notes),
      usage: input.usage,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    if (!profile.label) {
      throw new Error("Profile label is required.");
    }

    const nextProfiles = existing
      ? persisted.profiles.map((candidate) => (candidate.id === profile.id ? profile : candidate))
      : [...persisted.profiles, profile];

    this.write({ ...persisted, profiles: nextProfiles });
    return profile;
  }

  deleteProfile(profileId: string): void {
    const persisted = this.read();
    this.write({
      profiles: persisted.profiles.filter((profile) => profile.id !== profileId),
      activeProfiles: persisted.activeProfiles.map((active) =>
        active.profileId === profileId ? { providerId: active.providerId } : active
      )
    });
  }

  activateProfile(providerId: ProviderId, profileId: string) {
    const persisted = this.read();
    const profile = persisted.profiles.find(
      (candidate) => candidate.providerId === providerId && candidate.id === profileId
    );
    if (!profile) {
      throw new Error("Profile not found for this provider.");
    }

    const envPreview = buildEnv(profile);
    const envFile = join(this.activeDir, `${providerId}.env`);
    writeFileSync(envFile, serializeEnv(envPreview), { mode: 0o600 });

    const active: ActiveProfile = {
      providerId,
      profileId,
      appliedAt: new Date().toISOString(),
      envFile
    };
    const activeProfiles = [
      ...persisted.activeProfiles.filter((candidate) => candidate.providerId !== providerId),
      active
    ];
    this.write({ ...persisted, activeProfiles });
    return { active, envPreview };
  }

  private read(): PersistedState {
    if (!existsSync(this.stateFile)) {
      this.write(defaultState);
      return defaultState;
    }

    try {
      return JSON.parse(readFileSync(this.stateFile, "utf8")) as PersistedState;
    } catch {
      return defaultState;
    }
  }

  private write(state: PersistedState): void {
    mkdirSync(this.dataDir, { recursive: true });
    writeFileSync(this.stateFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  }
}

function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildEnv(profile: AccountProfile): Record<string, string> {
  if (profile.providerId === "codex") {
    return withoutEmpty({
      OPENAI_API_KEY: profile.apiKey,
      OPENAI_ORG_ID: profile.organizationId,
      OPENAI_PROJECT_ID: profile.projectId,
      OPENAI_BASE_URL: profile.baseUrl
    });
  }

  if (profile.providerId === "claude") {
    return withoutEmpty({
      ANTHROPIC_API_KEY: profile.apiKey,
      ANTHROPIC_BASE_URL: profile.baseUrl
    });
  }

  return withoutEmpty({
    OPENAI_API_KEY: profile.apiKey,
    ANTHROPIC_API_KEY: profile.apiKey,
    HERMES_AGENT_BASE_URL: profile.baseUrl
  });
}

function withoutEmpty(input: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => Boolean(value))) as Record<string, string>;
}

function serializeEnv(env: Record<string, string>): string {
  return `${Object.entries(env)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n")}\n`;
}
