# CodingPlanManager
CodingPlanManager helps smooth transition among your codex/claude code coding account or API Keys. It has clear and informative visualization on the usage of your different accounts and API keys. 

## Current implementation

This first desktop iteration is an Electron + React local app for macOS and Windows. It includes:

- Codex, Claude Code, and placeholder Hermes provider adapters.
- Local discovery for `~/.codex` and `~/.claude`.
- A profile store for account/workspace/API key metadata.
- Manual quota snapshots with dashboard visualization.
- Safe activation that writes provider-specific env files under the app data directory instead of rewriting unknown vendor config files.

Activated env files are written with `0600` permissions. Tools can source them from the app data directory shown by the **App Data** button.

## Development

```bash
npm install
npm run dev
```

The dev launcher clears `ELECTRON_RUN_AS_NODE` before starting Electron. Some terminal environments export that variable for agent tooling; if it is left enabled, Electron starts as plain Node and the desktop APIs are unavailable.

## Verification

```bash
npm run typecheck
npm run build
```

## Next steps

- Add importers for known Codex and Claude Code config formats.
- Add tool-specific switch adapters once target CLI/desktop/extension config contracts are confirmed.
- Add optional usage refreshers from provider APIs where quota endpoints are available.
- Expand Hermes support after validating the `hermes-agent` configuration shape.
