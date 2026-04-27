import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ConfigDiscovery, ProviderDefinition, ProviderId } from "../shared/types.js";

const HOME = homedir();

export const providers: ProviderDefinition[] = [
  {
    id: "codex",
    name: "Codex",
    description: "OpenAI Codex CLI, desktop app, and editor extension account/API profiles.",
    homePath: join(HOME, ".codex"),
    enabled: true,
    envKeys: ["OPENAI_API_KEY", "OPENAI_ORG_ID", "OPENAI_PROJECT_ID", "OPENAI_BASE_URL"]
  },
  {
    id: "claude",
    name: "Claude Code",
    description: "Anthropic Claude Code CLI, desktop app, and editor extension API profiles.",
    homePath: join(HOME, ".claude"),
    enabled: true,
    envKeys: ["ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL"]
  },
  {
    id: "hermes",
    name: "Hermes Agent",
    description: "Reserved adapter for NousResearch Hermes Agent LLM API routing.",
    homePath: join(HOME, ".hermes-agent"),
    enabled: false,
    envKeys: ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "HERMES_AGENT_MODEL"]
  }
];

const interestingExtensions = new Set([".json", ".toml", ".yaml", ".yml", ".env", ".txt"]);
const hintPatterns = [
  /workspace/i,
  /organization/i,
  /org[_-]?id/i,
  /project[_-]?id/i,
  /api[_-]?key/i,
  /anthropic/i,
  /openai/i,
  /plan/i,
  /quota/i,
  /account/i,
  /email/i
];

export function getProvider(providerId: ProviderId): ProviderDefinition {
  const provider = providers.find((candidate) => candidate.id === providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider;
}

export function scanProvider(provider: ProviderDefinition): ConfigDiscovery {
  const files: string[] = [];
  const hints = new Set<string>();
  const root = provider.homePath;

  if (existsSync(root)) {
    walk(root, files, 2);
    for (const file of files) {
      for (const pattern of hintPatterns) {
        if (pattern.test(file)) {
          hints.add(`Found ${file.split("/").pop() ?? file}`);
        }
      }
    }
  }

  return {
    providerId: provider.id,
    homePath: root,
    exists: existsSync(root),
    files,
    hints: [...hints].slice(0, 8),
    lastScannedAt: new Date().toISOString()
  };
}

export function scanAllProviders(): ConfigDiscovery[] {
  return providers.map(scanProvider);
}

function walk(directory: string, files: string[], depth: number): void {
  if (depth < 0 || files.length >= 80) {
    return;
  }

  let entries: string[] = [];
  try {
    entries = readdirSync(directory);
  } catch {
    return;
  }

  for (const entry of entries) {
    const path = join(directory, entry);
    let stats;
    try {
      stats = statSync(path);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walk(path, files, depth - 1);
      continue;
    }

    const extension = entry.includes(".") ? entry.slice(entry.lastIndexOf(".")).toLowerCase() : "";
    if (interestingExtensions.has(extension) || entry.includes("config") || entry.includes("settings")) {
      files.push(path);
    }
  }
}
