# BranchFlow Codebase Guide

This document explains how the BranchFlow codebase is organized and how the major parts work together.

It is intended for maintainers, contributors, and future refactors.

## Design Goal

BranchFlow is intentionally split into layers so the project can evolve without mixing:

- VS Code UI concerns
- Git execution
- policy-driven workflow logic
- provider behavior
- user prompts

The main rule is:

> commands should orchestrate behavior, not own the workflow rules.

## Runtime Flow

At a high level, a BranchFlow action runs like this:

1. VS Code executes a registered command from `src/extension.ts`
2. the command validates workspace, Git repo, and policy state
3. BranchFlow detects and classifies the current branch
4. BranchFlow resolves which actions are allowed
5. the command performs Git or provider work
6. the Activity Bar sidebar refreshes to show the new state

## Folder Map

```text
src/
  extension.ts
  commands/
  core/
  git/
  providers/
  storage/
  ui/
  types/
docs/
  CODEBASE.md
media/
  branchflow-activity.svg
```

## `src/extension.ts`

This is the extension entrypoint.

Responsibilities:

- activate the extension
- register every VS Code command
- register the Activity Bar webview provider
- wrap commands so the sidebar refreshes after every workflow action

Why the wrapper matters:

- many commands change the current branch or repository state
- refreshing after every command keeps the UI accurate without duplicate refresh code in every command file

## `src/core`

This folder contains business logic that should stay independent from the UI surface.

### `policyLoader.ts`

Responsibilities:

- locate `.branchflow.json`
- check whether it exists
- read it
- parse JSON

It only loads the file. It does not decide whether the workflow rules are valid.

### `policyValidator.ts`

Responsibilities:

- validate policy structure
- validate provider values
- validate finish modes
- validate branch-type lists
- validate promotion configuration

It returns an array of errors so the user can fix multiple problems at once.

### `branchClassifier.ts`

Responsibilities:

- map a branch name to a BranchFlow branch type

Classification order is important:

1. protected exact names
2. working exact names
3. feature prefix
4. release prefix
5. hotfix prefix
6. unknown

### `actionResolver.ts`

Responsibilities:

- compute which actions are available right now
- answer whether feature, release, hotfix, or promotion actions are allowed
- compute valid promotion targets

This is the heart of the policy engine.

### `currentStateService.ts`

Responsibilities:

- build one reusable snapshot of repository state
- power both the sidebar and `Show Current State`
- keep branch, policy, provider, and action resolution in one shared place

This prevents drift between the visual UI and the command-based diagnostics.

## `src/git`

### `gitService.ts`

This is the single Git abstraction layer.

Responsibilities:

- run Git commands from the workspace root
- detect whether the folder is a Git repo
- detect the current branch
- check working tree cleanliness
- create and switch branches
- delete branches
- merge branches
- fetch remotes
- compare ahead/behind counts
- read remote URLs

Important design choice:

- Git calls are centralized so commands do not shell out directly in multiple places

## `src/storage`

### `branchMetadataStore.ts`

Responsibilities:

- store workflow branch metadata in `workspaceState`
- retrieve metadata later during finish actions
- delete metadata when a flow is complete

Stored metadata includes:

- branch name
- workflow kind
- base branch
- creation timestamp

Important limitation:

- this metadata is local to the VS Code workspace and is not committed to Git

## `src/providers`

This layer isolates GitHub and GitLab behavior.

### `provider.ts`

Defines:

- the provider interface
- request input/output shapes
- remote URL normalization helper

### `providerDetector.ts`

Responsibilities:

- choose GitHub or GitLab explicitly from policy
- auto-detect from the remote URL when policy uses `auto`

### `githubProvider.ts`

Current v1 behavior:

- builds a prefilled GitHub compare / pull-request URL

### `gitlabProvider.ts`

Current v1 behavior:

- builds a prefilled GitLab merge-request URL

Important note:

- BranchFlow does not yet authenticate or call provider APIs directly

## `src/types`

This folder defines shared contracts.

### `policy.ts`

Defines:

- provider types
- finish modes
- branch types
- workflow section types
- the full `BranchFlowPolicy` interface

### `action.ts`

Defines:

- every supported BranchFlow action
- user-facing command titles

### `metadata.ts`

Defines:

- workflow branch kinds
- the metadata model stored for created branches

## `src/commands`

This folder contains user-facing workflows.

### `shared.ts`

This file exists so individual command files stay focused.

Responsibilities:

- validate repo and policy context
- enforce allowed actions
- ensure a clean working tree when needed
- resolve execution mode
- create provider requests
- start workflow branches generically
- finish workflow branches generically
- standardize error handling

This is the command orchestration backbone.

### `showCurrentState.ts`

Responsibilities:

- render the current-state snapshot to the `BranchFlow` output channel
- show user feedback for warnings and errors

### `initializeProject.ts`

Responsibilities:

- prompt the user for starter policy values
- create a valid `.branchflow.json`
- write it to disk
- open the created file in the editor

### `reloadPolicy.ts`

Responsibilities:

- re-read and validate the policy
- surface validation issues without reloading VS Code

### `startFeature.ts`, `startRelease.ts`, `startHotfix.ts`

Responsibilities:

- call the shared workflow-start helper with the correct workflow kind
- provide the right naming prompt

### `finishFeature.ts`, `finishRelease.ts`, `finishHotfix.ts`

Responsibilities:

- call the shared workflow-finish helper with the correct workflow kind

### `promoteBranch.ts`

Responsibilities:

- validate promotion availability
- fetch the remote
- compute valid target branches
- prompt for a target when needed
- compare branches
- execute direct promotion or provider-based request flow

## `src/ui`

This folder contains the VS Code-facing presentation logic.

### `prompts.ts`

Responsibilities:

- centralize user input prompts
- normalize branch names
- prompt for modes, provider type, branch lists, prefixes, and promotion options

### `stateFormatter.ts`

Responsibilities:

- turn a state snapshot into the human-readable text used by `Show Current State`

### `sidebarProvider.ts`

Responsibilities:

- render the BranchFlow Activity Bar dashboard
- show branch, policy, provider, and action state visually
- execute commands from webview buttons
- refresh on workspace and command changes

Important implementation choices:

- dynamic content is escaped before it is rendered into the webview
- the sidebar uses VS Code theme variables so it feels native
- the dashboard is intentionally card-based so the extension feels like a product surface, not a raw dump of state

## Activity Bar and Manifest Wiring

The UI is connected in `package.json`.

Main manifest responsibilities:

- register commands
- register the Activity Bar container
- register the BranchFlow dashboard view
- register activation events

The Activity Bar icon lives in `media/branchflow-activity.svg`.

## How to Add a New Workflow Command

If you want to add a new command later:

1. add the action type to `src/types/action.ts`
2. add the command implementation under `src/commands`
3. register it in `src/extension.ts`
4. contribute it in `package.json`
5. decide whether it belongs in the sidebar action grid
6. update the README and this guide

If the command depends on workflow rules:

- prefer extending `actionResolver.ts`
- keep Git operations inside `gitService.ts`
- keep user prompts inside `ui/prompts.ts`

## Commenting Style

BranchFlow does not aim for literal line-by-line comments.

Instead, the codebase should prefer:

- clear file names
- small focused functions
- descriptive types
- JSDoc for exported classes and tricky helpers
- short inline comments only where a choice is not obvious

That keeps the project more maintainable than commenting every single line.

## Good Future Refactors

Useful next cleanup opportunities:

- split the sidebar HTML renderer into smaller template helpers
- add a dedicated `types/state.ts` model to remove UI-layer type coupling
- add automated tests around `actionResolver.ts`
- add mockable abstractions around Git and provider services
