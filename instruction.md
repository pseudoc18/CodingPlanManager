## role:
Experienced SDE for macos/windows APP development. 

## task:
part1: codex management
I want to you develop a macos local app that can smoothly switch between different codex account and monitor their api/quota usage with friendly and clear visualization dashboard.

You may assume I have multiple ChatGPT account and each may have multiple bussiness workspace. I want to switch to another available account/workspace whenever the coding quota of a specific workspace run out. You may consider using API mode instead of login mode to achieve it. 

The app should automatically detect the account type (plus, pro, business, etc)

for all cli, desktop and vscode extension version (if have).

potential path:

/Users/levibot/.codex


part2: claude code api management

The app should also support to switch api for the claude code. for all cli, desktop and vscode extension version (if have).

potential path:
/Users/levibot/.claude


part3: Hermes agent LLM api management

https://github.com/NousResearch/hermes-agent

if the codebase is too complex, leave it for next iteration.

## reference:
https://github.com/jlcodes99/cockpit-tools
for codex management

https://github.com/farion1231/cc-switch
for claude code api management

feel free to download and reuse their code if you find valuable.

## note

Please adapt the best practice and make it scalable and compatible for other account management in the future.