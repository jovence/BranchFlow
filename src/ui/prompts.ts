import * as vscode from 'vscode';
import { FinishMode, ProviderType } from '../types/policy';

export function normalizeBranchNameSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._/-]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/-+/g, '-')
    .replace(/^[-/.]+|[-/.]+$/g, '');
}

export async function promptForFeatureName(): Promise<string | undefined> {
  return promptForBranchName('feature', 'search-refactor');
}

export async function promptForReleaseName(): Promise<string | undefined> {
  return promptForBranchName('release', '1.8.0');
}

export async function promptForHotfixName(): Promise<string | undefined> {
  return promptForBranchName('hotfix', 'payment-timeout');
}

export async function promptForModeChoice(
  placeHolder = 'Choose how BranchFlow should continue',
  includeAsk = false,
  defaultMode: FinishMode = 'merge-request'
): Promise<FinishMode | undefined> {
  const modes: FinishMode[] = includeAsk
    ? [defaultMode, ...(['direct', 'merge-request', 'ask'] as FinishMode[]).filter((mode) => mode !== defaultMode)]
    : [defaultMode, ...(['direct', 'merge-request'] as FinishMode[]).filter((mode) => mode !== defaultMode)];

  const selected = await vscode.window.showQuickPick(
    modes.map((mode) => ({
      label: formatModeLabel(mode),
      description:
        mode === 'direct'
          ? 'Merge locally'
          : mode === 'merge-request'
            ? 'Open a PR/MR in the provider'
            : 'Ask each time',
      value: mode
    })),
    { placeHolder }
  );

  return selected?.value;
}

export async function pickPromotionTarget(
  sourceBranch: string,
  targets: string[]
): Promise<string | undefined> {
  if (targets.length === 0) {
    return undefined;
  }

  if (targets.length === 1) {
    return targets[0];
  }

  const selected = await vscode.window.showQuickPick(
    targets.map((target) => ({
      label: `${sourceBranch} -> ${target}`,
      value: target
    })),
    { placeHolder: 'Choose a promotion target branch' }
  );

  return selected?.value;
}

export async function promptForProviderType(): Promise<ProviderType | undefined> {
  const selected = await vscode.window.showQuickPick(
    [
      { label: 'GitLab', value: 'gitlab' as const, description: 'Create merge requests in GitLab' },
      { label: 'GitHub', value: 'github' as const, description: 'Create pull requests in GitHub' },
      { label: 'Auto', value: 'auto' as const, description: 'Detect from the remote URL' }
    ],
    { placeHolder: 'Choose the repository provider for this project' }
  );

  return selected?.value;
}

export async function promptForRemoteName(
  defaultValue = 'origin'
): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt: 'Remote name used for provider operations',
    placeHolder: defaultValue,
    value: defaultValue,
    validateInput: (value) =>
      value.trim().length === 0 ? 'Remote name cannot be empty.' : undefined
  });
}

export async function promptForBranchList(
  prompt: string,
  defaultValue: string
): Promise<string[] | undefined> {
  const rawValue = await vscode.window.showInputBox({
    prompt,
    placeHolder: defaultValue,
    value: defaultValue,
    validateInput: (value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .some((item) => item.length === 0)
        ? 'Enter a comma-separated list without empty items.'
        : undefined
  });

  if (rawValue === undefined) {
    return undefined;
  }

  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function promptForPrefix(
  branchKind: string,
  defaultValue: string
): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt: `Branch prefix for ${branchKind} branches`,
    placeHolder: defaultValue,
    value: defaultValue,
    validateInput: (value) =>
      value.trim().length === 0 ? 'Branch prefix cannot be empty.' : undefined
  });
}

export async function promptForAllowSkip(defaultValue = false): Promise<boolean | undefined> {
  const selected = await vscode.window.showQuickPick(
    [
      {
        label: defaultValue ? 'Yes' : 'No',
        value: defaultValue,
        description: defaultValue
          ? 'Allow skipping intermediate promotion branches'
          : 'Only allow adjacent promotion branches'
      },
      {
        label: defaultValue ? 'No' : 'Yes',
        value: !defaultValue,
        description: defaultValue
          ? 'Only allow adjacent promotion branches'
          : 'Allow skipping intermediate promotion branches'
      }
    ],
    { placeHolder: 'Allow branch promotions to skip intermediate branches?' }
  );

  return selected?.value;
}

export async function confirmOverwritePolicy(): Promise<boolean> {
  const overwrite = await vscode.window.showWarningMessage(
    '.branchflow.json already exists. Do you want to overwrite it?',
    { modal: true },
    'Overwrite'
  );

  return overwrite === 'Overwrite';
}

function formatModeLabel(mode: FinishMode): string {
  if (mode === 'merge-request') {
    return 'Merge Request / Pull Request';
  }

  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

async function promptForBranchName(
  branchKind: string,
  exampleValue: string
): Promise<string | undefined> {
  const rawValue = await vscode.window.showInputBox({
    prompt: `Enter a ${branchKind} name`,
    placeHolder: exampleValue,
    validateInput: (value) => {
      const normalized = normalizeBranchNameSegment(value);
      return normalized.length === 0
        ? `Enter a valid ${branchKind} name.`
        : undefined;
    }
  });

  if (rawValue === undefined) {
    return undefined;
  }

  return normalizeBranchNameSegment(rawValue);
}
