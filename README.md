# BranchFlow

Policy-driven Git workflow for Visual Studio Code.

BranchFlow is a VS Code extension that reads a project-level policy file named `.branchflow.json` from the root of a Git repository and uses that policy to decide which workflow actions are allowed in that repository at that moment.

It is not a hardcoded Gitflow clone.

It is a workflow assistant that adapts to the rules of each project.

## Table of Contents

- [What BranchFlow Is](#what-branchflow-is)
- [Why BranchFlow Exists](#why-branchflow-exists)
- [Current Status](#current-status)
- [Core Concepts](#core-concepts)
- [What BranchFlow Does](#what-branchflow-does)
- [How BranchFlow Works](#how-branchflow-works)
- [Supported Commands](#supported-commands)
- [Quick Start](#quick-start)
- [Policy File Reference](#policy-file-reference)
- [Policy Example](#policy-example)
- [Branch Classification Rules](#branch-classification-rules)
- [Action Resolution Rules](#action-resolution-rules)
- [Workflow Walkthroughs](#workflow-walkthroughs)
- [Execution Modes](#execution-modes)
- [Branch Metadata](#branch-metadata)
- [Provider Integration](#provider-integration)
- [Architecture](#architecture)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)
- [Current Limitations](#current-limitations)
- [Roadmap Ideas](#roadmap-ideas)

## What BranchFlow Is

BranchFlow is a project-level Git workflow extension for VS Code.

Instead of assuming every repository follows the same branching model, BranchFlow lets each repository define its own workflow policy. The extension then reads that policy and answers one practical question:

> Given this repository, this current branch, and this workflow policy, what can the user safely do right now?

BranchFlow currently focuses on:

- project initialization
- policy reloading and validation
- current-state inspection
- feature branch start and finish
- release branch start and finish
- hotfix branch start and finish
- branch promotion across environment flows

## Why BranchFlow Exists

Teams rarely share one exact workflow.

Some teams use:

- `develop -> beta -> prod`
- `dev -> staging -> main`
- `integration -> preprod -> production`

Some teams allow direct local merges.

Some teams require pull requests or merge requests for everything.

Some teams allow hotfixes only from production branches.

Some teams allow features only from working branches.

Most workflow tools are opinionated around one fixed model. BranchFlow exists so the repository, not the tool, defines the rules.

## Current Status

BranchFlow is currently a command-palette-first extension with a strong v1 foundation.

What is already implemented:

- `.branchflow.json` loading and validation
- branch classification
- action resolution
- Git command integration
- feature, release, and hotfix start and finish flows
- promotion flow
- GitHub and GitLab URL-based PR/MR assistance
- starter policy generation

What is not implemented yet:

- a sidebar or tree view
- direct provider API integration
- automatic branch push before PR/MR creation
- release tagging and release notes
- advanced back-merge or hotfix propagation workflows

## Core Concepts

### 1. Policy File

Every repository can define a workflow in:

```text
.branchflow.json
```

This file is the source of truth for BranchFlow behavior.

### 2. Branch Types

BranchFlow classifies branches into one of these types:

- `protected`
- `working`
- `feature`
- `release`
- `hotfix`
- `unknown`

### 3. Workflow Actions

BranchFlow currently understands these actions:

- `initializeProject`
- `reloadPolicy`
- `showCurrentState`
- `startFeature`
- `finishFeature`
- `startRelease`
- `finishRelease`
- `startHotfix`
- `finishHotfix`
- `promoteBranch`

### 4. Execution Modes

Some actions can run in one of three modes:

- `direct`
- `merge-request`
- `ask`

Meaning:

- `direct`: perform the merge locally with Git
- `merge-request`: prepare a GitHub PR or GitLab MR URL
- `ask`: prompt the user each time

### 5. Base Branch Memory

When BranchFlow creates a workflow branch, it remembers:

- the branch name
- the branch kind
- the base branch it came from
- when it was created

That memory is used later when finishing the branch.

## What BranchFlow Does

When a user opens a repository in VS Code and runs BranchFlow commands, the extension:

1. checks whether a workspace folder is open
2. checks whether the folder is a Git repository
3. locates `.branchflow.json`
4. loads and validates the policy
5. detects the current branch
6. classifies that branch
7. computes the currently available actions
8. executes the requested workflow command safely or refuses it with a clear error

In practice, this means the extension helps the user understand:

- where they are
- what their repository policy says
- what actions are currently allowed
- how to perform those actions consistently

## How BranchFlow Works

At runtime, the flow looks like this:

1. VS Code activates the extension when a BranchFlow command is executed.
2. The command checks repository context and policy health.
3. The current branch is classified using exact-name and prefix rules.
4. BranchFlow resolves what is allowed from that branch.
5. The command either:
   - creates a new branch
   - finishes the current workflow branch
   - promotes one branch into another
   - reloads or displays state
6. All errors are surfaced to the user as readable VS Code messages.

This keeps logic centralized and avoids having workflow rules scattered across multiple commands.

## Supported Commands

BranchFlow currently exposes the following VS Code commands:

| Command Palette Name | Purpose |
| --- | --- |
| `BranchFlow: Initialize Project` | Create a starter `.branchflow.json` in the repository root |
| `BranchFlow: Reload Policy` | Re-read and validate the repository workflow policy |
| `BranchFlow: Show Current State` | Show branch state, policy status, provider info, and available actions |
| `BranchFlow: Start Feature` | Create a new feature branch from an allowed source branch |
| `BranchFlow: Finish Feature` | Finish the current feature branch back into its remembered base branch |
| `BranchFlow: Start Release` | Create a new release branch from an allowed source branch |
| `BranchFlow: Finish Release` | Finish the current release branch back into its remembered base branch |
| `BranchFlow: Start Hotfix` | Create a new hotfix branch from an allowed source branch |
| `BranchFlow: Finish Hotfix` | Finish the current hotfix branch back into its remembered base branch |
| `BranchFlow: Promote Branch` | Promote the current branch into the next allowed branch in the configured promotion flow |

### `Show Current State`

This is the main diagnostic command.

It displays:

- workspace path
- whether the workspace is a Git repository
- current branch
- branch type
- whether the branch is protected
- working tree status
- provider
- remote name
- policy path
- policy status
- available actions
- policy validation errors, if any

This is the best first command to run when onboarding a repository or debugging policy behavior.

### `Initialize Project`

This command creates a starter `.branchflow.json`.

It prompts for:

- provider type
- remote name
- protected branches
- working branches
- feature prefix
- release prefix
- hotfix prefix
- feature finish mode
- release finish mode
- hotfix finish mode
- promotion flow
- whether promotions can skip intermediate branches

Notes:

- if `.branchflow.json` already exists, BranchFlow asks before overwriting it
- the generated starter policy is validated before it is written
- the created policy file is opened immediately in the editor
- the starter hotfix sources are generated from the first two protected branches

### `Reload Policy`

This command re-reads `.branchflow.json` and validates it again.

If the policy is valid, BranchFlow reports success.

If the policy is invalid, BranchFlow shows validation issues so the user can fix them without restarting VS Code.

### `Start Feature`, `Start Release`, `Start Hotfix`

These commands follow the same pattern:

1. validate repository and policy
2. resolve whether the action is allowed from the current branch
3. require a clean working tree
4. prompt for a branch name
5. normalize the entered name
6. prepend the configured prefix
7. ensure the branch does not already exist
8. create and checkout the new branch
9. store metadata about the new branch

Branch name normalization currently:

- trims whitespace
- lowercases the input
- converts spaces to hyphens
- removes unsupported characters
- collapses repeated separators

### `Finish Feature`, `Finish Release`, `Finish Hotfix`

These commands also share a common pattern:

1. validate repository and policy
2. confirm the current branch type matches the command
3. require a clean working tree
4. read stored metadata for the current workflow branch
5. resolve the remembered base branch
6. read the finish mode from policy
7. if mode is `ask`, prompt for `direct` or `merge-request`
8. either merge locally or prepare a provider PR/MR URL
9. optionally switch back to base branch
10. optionally delete the local workflow branch

Important:

- BranchFlow does not guess the base branch on finish
- finish commands depend on stored branch metadata
- if metadata is missing, finish commands fail with a clear error

### `Promote Branch`

This command promotes the current branch into another branch defined by the promotion flow.

It does the following:

1. validate repository and policy
2. ensure the current branch is eligible for promotion
3. fetch the configured remote
4. compute valid promotion targets from `promotion.flow`
5. if needed, prompt the user to choose a target
6. resolve execution mode
7. compare source and target branches
8. if no new commits exist, exit cleanly
9. either merge locally or prepare a provider PR/MR URL

If `allowSkip` is `false`, only adjacent promotion steps are allowed.

If `allowSkip` is `true`, promotion can target any later branch in the configured flow.

## Quick Start

### For Users

1. Open a Git repository in VS Code.
2. Run `BranchFlow: Initialize Project` if the repository does not yet have a `.branchflow.json`.
3. Review and adjust the generated policy.
4. Run `BranchFlow: Show Current State` to confirm BranchFlow understands the repository.
5. Start using feature, release, hotfix, and promotion commands based on your workflow.

### For Repositories That Already Have a Policy

1. Open the repository in VS Code.
2. Ensure `.branchflow.json` exists in the repository root.
3. Run `BranchFlow: Show Current State`.
4. Confirm the reported branch type and available actions match your expectations.

## Policy File Reference

The policy file lives at:

```text
.branchflow.json
```

### Top-Level Shape

| Key | Type | Required | Purpose |
| --- | --- | --- | --- |
| `version` | number | yes | Policy version |
| `provider` | object | yes | Git provider configuration |
| `branches` | object | yes | Named branch groups |
| `prefixes` | object | yes | Prefixes used to classify workflow branches |
| `feature` | object | yes | Feature workflow rules |
| `release` | object | yes | Release workflow rules |
| `hotfix` | object | yes | Hotfix workflow rules |
| `promotion` | object | yes | Environment promotion rules |
| `ui` | object | yes | UI options |

### `provider`

| Key | Type | Purpose |
| --- | --- | --- |
| `type` | `gitlab` \| `github` \| `auto` | Provider strategy |
| `remoteName` | string | Remote used for fetch and provider URL detection |

### `branches`

| Key | Type | Purpose |
| --- | --- | --- |
| `protected` | string[] | Exact branch names treated as protected |
| `working` | string[] | Exact branch names treated as working branches |

### `prefixes`

| Key | Type | Purpose |
| --- | --- | --- |
| `feature` | string | Prefix used for feature branches |
| `release` | string | Prefix used for release branches |
| `hotfix` | string | Prefix used for hotfix branches |

### Workflow Sections: `feature`, `release`, `hotfix`

Each workflow section has the same structure:

| Key | Type | Purpose |
| --- | --- | --- |
| `enabled` | boolean | Turns the workflow on or off |
| `allowedSourceBranchTypes` | `BranchType[]` | Allowed source branch types |
| `allowedSourceBranches` | string[] | Allowed source branches by exact name |
| `finish.mode` | `direct` \| `merge-request` \| `ask` | Finish behavior |
| `finish.deleteBranchAfterFinish` | boolean | Whether to delete the local workflow branch after finish |
| `finish.switchBackToBase` | boolean | Whether to switch back to the remembered base branch |

### `promotion`

| Key | Type | Purpose |
| --- | --- | --- |
| `enabled` | boolean | Turns promotion on or off |
| `flow` | string[] | Ordered list of branches in promotion order |
| `mode` | `direct` \| `merge-request` \| `ask` | Promotion execution mode |
| `allowSkip` | boolean | Whether promotion can skip intermediate branches |

### `ui`

| Key | Type | Purpose |
| --- | --- | --- |
| `showDebugInfo` | boolean | Reserved UI debug flag |

## Policy Example

```json
{
  "version": 1,
  "provider": {
    "type": "gitlab",
    "remoteName": "origin"
  },
  "branches": {
    "protected": ["main", "prod", "beta", "staging"],
    "working": ["develop", "dev", "integration"]
  },
  "prefixes": {
    "feature": "feature/",
    "release": "release/",
    "hotfix": "hotfix/"
  },
  "feature": {
    "enabled": true,
    "allowedSourceBranchTypes": ["working"],
    "allowedSourceBranches": [],
    "finish": {
      "mode": "merge-request",
      "deleteBranchAfterFinish": true,
      "switchBackToBase": true
    }
  },
  "release": {
    "enabled": true,
    "allowedSourceBranchTypes": ["working"],
    "allowedSourceBranches": [],
    "finish": {
      "mode": "merge-request",
      "deleteBranchAfterFinish": true,
      "switchBackToBase": true
    }
  },
  "hotfix": {
    "enabled": true,
    "allowedSourceBranchTypes": [],
    "allowedSourceBranches": ["main", "prod"],
    "finish": {
      "mode": "merge-request",
      "deleteBranchAfterFinish": true,
      "switchBackToBase": true
    }
  },
  "promotion": {
    "enabled": true,
    "flow": ["develop", "beta", "prod"],
    "mode": "merge-request",
    "allowSkip": false
  },
  "ui": {
    "showDebugInfo": false
  }
}
```

## Branch Classification Rules

BranchFlow classifies the current branch in this exact order:

1. if the branch name is in `branches.protected`, classify as `protected`
2. else if the branch name is in `branches.working`, classify as `working`
3. else if the branch starts with `prefixes.feature`, classify as `feature`
4. else if the branch starts with `prefixes.release`, classify as `release`
5. else if the branch starts with `prefixes.hotfix`, classify as `hotfix`
6. else classify as `unknown`

The order matters because exact named branches should win over prefix-based detection.

## Action Resolution Rules

BranchFlow resolves actions dynamically from:

- current branch name
- current branch type
- the repository policy

### Feature Start

Allowed when:

- `feature.enabled` is `true`
- and either:
  - the current branch name is in `feature.allowedSourceBranches`
  - or the current branch type is in `feature.allowedSourceBranchTypes`

### Release Start

Allowed using the same logic as feature start, but based on the `release` section.

### Hotfix Start

Allowed using the same logic as feature start, but based on the `hotfix` section.

### Finish Commands

Allowed when:

- the current branch type matches the command
- the corresponding workflow is enabled

### Promotion

Allowed when:

- `promotion.enabled` is `true`
- and the current branch exists in `promotion.flow`

Target selection then depends on `allowSkip`.

## Workflow Walkthroughs

### Feature Workflow

Example:

1. Current branch is `develop`
2. Policy allows features from `working`
3. User runs `BranchFlow: Start Feature`
4. User enters `search-refactor`
5. BranchFlow creates `feature/search-refactor`
6. BranchFlow remembers `develop` as the base branch

Later:

1. User is on `feature/search-refactor`
2. User runs `BranchFlow: Finish Feature`
3. BranchFlow loads metadata for `feature/search-refactor`
4. BranchFlow resolves base branch `develop`
5. BranchFlow either merges directly or prepares a PR/MR URL

### Release Workflow

Example:

1. Current branch is `develop`
2. User runs `BranchFlow: Start Release`
3. User enters `1.8.0`
4. BranchFlow creates `release/1.8.0`
5. BranchFlow stores the base branch as `develop`

Later:

1. User is on `release/1.8.0`
2. User runs `BranchFlow: Finish Release`
3. BranchFlow finishes the release back into its remembered base branch

### Hotfix Workflow

Example:

1. Current branch is `prod`
2. Policy allows hotfixes from `prod`
3. User runs `BranchFlow: Start Hotfix`
4. User enters `login-crash`
5. BranchFlow creates `hotfix/login-crash`
6. BranchFlow stores `prod` as the base branch

Later:

1. User is on `hotfix/login-crash`
2. User runs `BranchFlow: Finish Hotfix`
3. BranchFlow finishes the hotfix back into `prod`

### Promotion Workflow

Example policy:

```json
{
  "promotion": {
    "enabled": true,
    "flow": ["develop", "beta", "prod"],
    "mode": "merge-request",
    "allowSkip": false
  }
}
```

Allowed promotions:

- `develop -> beta`
- `beta -> prod`

Not allowed:

- `develop -> prod`

If `allowSkip` becomes `true`, BranchFlow can allow direct promotion to any later branch in the flow.

## Execution Modes

### `direct`

Direct mode performs the merge locally.

Current implementation details:

- BranchFlow checks out the target branch
- BranchFlow runs a non-fast-forward merge
- optional local branch deletion is applied according to policy

### `merge-request`

In v1, merge-request mode does not call the provider API directly.

Instead, BranchFlow prepares a provider URL:

- GitHub: a prefilled compare / pull request page
- GitLab: a prefilled new merge request page

This is intentional for the current version because it avoids provider auth complexity while still helping the user move into PR/MR-based workflows quickly.

### `ask`

Ask mode prompts the user at runtime and lets them choose between:

- direct merge
- merge request / pull request flow

## Branch Metadata

Branch metadata is how BranchFlow remembers where a workflow branch came from.

Stored fields:

- `branchName`
- `kind`
- `baseBranch`
- `createdAt`

Current storage strategy:

- metadata is stored in VS Code `workspaceState`
- metadata is local to the current VS Code workspace
- metadata is not committed to Git

Why this matters:

- finish commands rely on this stored metadata
- if the user created the branch outside BranchFlow, finish commands may not have enough information
- if the workspace state is cleared, BranchFlow may no longer know the original base branch

## Provider Integration

BranchFlow currently supports:

- GitLab
- GitHub
- `auto` detection

### GitHub

GitHub support currently generates a prefilled compare URL that can be used to create a pull request.

### GitLab

GitLab support currently generates a prefilled new merge request URL.

### Auto Detection

In v1, `auto` detection is URL-based and simple:

- if the remote URL contains `github`, BranchFlow chooses GitHub
- if the remote URL contains `gitlab`, BranchFlow chooses GitLab

If the remote URL does not clearly indicate either provider, detection fails with a readable error.

## Architecture

Current source layout:

```text
src/
  extension.ts
  commands/
    shared.ts
    initializeProject.ts
    reloadPolicy.ts
    showCurrentState.ts
    startFeature.ts
    finishFeature.ts
    startRelease.ts
    finishRelease.ts
    startHotfix.ts
    finishHotfix.ts
    promoteBranch.ts
  core/
    policyLoader.ts
    policyValidator.ts
    branchClassifier.ts
    actionResolver.ts
  git/
    gitService.ts
  providers/
    provider.ts
    gitlabProvider.ts
    githubProvider.ts
    providerDetector.ts
  storage/
    branchMetadataStore.ts
  ui/
    prompts.ts
    stateFormatter.ts
  types/
    policy.ts
    action.ts
    metadata.ts
```

### Module Responsibilities

#### `types`

Defines the contracts used across the extension:

- policy types
- action names
- branch metadata types

#### `core`

Contains policy-driven business logic:

- loading policy files
- validating policy
- classifying branch types
- resolving allowed actions

#### `git`

Encapsulates Git operations so commands do not shell out directly all over the codebase.

Current Git operations include:

- repository detection
- current branch lookup
- working tree cleanliness checks
- branch create / checkout / delete
- merge
- fetch
- remote URL lookup
- ahead / behind comparison

#### `storage`

Stores workflow branch metadata so finish commands know the remembered base branch.

#### `providers`

Abstracts GitHub and GitLab behavior behind a shared interface.

#### `ui`

Contains reusable prompts and state formatting logic used by commands.

#### `commands`

Implements user-facing VS Code commands.

## Local Development

### Requirements

- Node.js
- npm
- Git
- VS Code 1.85 or newer

### Setup

```bash
npm install
npm run compile
```

### Run in VS Code

1. Open the project in VS Code
2. Press `F5`
3. This launches an Extension Development Host
4. Open a Git repository in that window
5. Run BranchFlow commands from the Command Palette

### Build Scripts

```bash
npm run compile
npm run watch
```

## Troubleshooting

### "Command ... not found"

Usually means one of these:

- the extension was not compiled yet
- the Extension Development Host was not restarted after a change
- the command exists in source but was not registered in the extension manifest

Current command registration is handled in both:

- `package.json`
- `src/extension.ts`

### "No .branchflow.json file found in the repository root"

The repository does not yet have a policy file. Run `BranchFlow: Initialize Project` or create the file manually.

### "Policy validation failed"

Use `BranchFlow: Reload Policy` or `BranchFlow: Show Current State` to surface all current validation issues.

### Finish command says metadata is missing

This usually means:

- the branch was created outside BranchFlow
- or the workspace metadata was cleared

Because v1 stores metadata locally in `workspaceState`, BranchFlow cannot always reconstruct the original base branch if the branch was not started with the extension.

### Provider detection failed

If `provider.type` is `auto`, BranchFlow tries to detect GitHub or GitLab from the remote URL.

If that is unreliable for your repository, set the provider explicitly in `.branchflow.json`.

## Current Limitations

The project is usable today, but there are important v1 constraints to understand.

### No Automatic Push Before PR/MR Creation

BranchFlow currently prepares GitHub and GitLab URLs, but it does not push local branches before opening those flows.

That means users may need to push the source branch manually before the provider page can create a valid PR/MR.

### Merge-Request Mode Is URL-Based, Not API-Based

BranchFlow does not currently:

- authenticate with GitHub or GitLab
- create PRs or MRs through official APIs
- track the lifecycle of remote requests

It opens a prefilled web flow instead.

### Metadata Is Local to VS Code

Because metadata is stored in `workspaceState`:

- it is not shared with teammates
- it is not stored in Git
- it may not survive every environment or machine move

### No Sidebar Yet

The current UX is command-palette-first. A future sidebar can present current state and available actions more visually.

### Release / Hotfix Advanced Automation Is Not Implemented Yet

BranchFlow does not yet handle advanced scenarios like:

- tagging releases
- generating release notes
- back-merging release branches
- propagating hotfixes automatically across downstream branches

### Recommendation for PR/MR-Centric Teams

If your workflow depends on provider-based review and BranchFlow is opening URLs rather than completing remote operations automatically, consider using conservative policy settings until push and API automation are added.

For example:

- prefer `deleteBranchAfterFinish: false` in PR/MR-heavy flows if you want to keep local source branches around until the remote request is safely created and pushed

## Roadmap Ideas

Possible next steps for BranchFlow:

- sidebar and tree-view UI
- direct GitHub and GitLab API integration
- automatic push before PR/MR creation
- richer provider detection
- release tagging support
- generated release notes
- advanced promotion checks
- persisted branch metadata strategies beyond `workspaceState`
- tests for policy rules, command behavior, and Git interactions

## Summary

BranchFlow is a policy-driven Git workflow extension for VS Code.

It reads `.branchflow.json` from the repository root, classifies the current branch, resolves allowed actions from project policy, and helps users perform workflow operations like starting and finishing feature, release, and hotfix branches, as well as promoting branches through environment flows.

The core idea is simple:

the repository defines the workflow, and BranchFlow follows it.
