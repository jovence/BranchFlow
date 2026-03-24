import * as vscode from 'vscode';
import { BranchMetadataStore } from '../storage/branchMetadataStore';
import { ActionResolver } from '../core/actionResolver';
import { BranchClassifier } from '../core/branchClassifier';
import { PolicyLoader } from '../core/policyLoader';
import { PolicyValidator } from '../core/policyValidator';
import { GitService } from '../git/gitService';
import { ProviderDetector } from '../providers/providerDetector';
import { PromotionRequestInput, PromotionRequestResult } from '../providers/provider';
import { BRANCH_FLOW_ACTION_TITLES, BranchFlowAction } from '../types/action';
import { WorkflowBranchKind } from '../types/metadata';
import { BranchFlowPolicy, BranchType, FinishMode } from '../types/policy';
import { promptForModeChoice } from '../ui/prompts';

export interface ValidatedWorkflowState {
  policy: BranchFlowPolicy;
  currentBranch: string;
  branchType: BranchType;
}

export function requireWorkspaceFolder(): vscode.WorkspaceFolder {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    throw new Error('BranchFlow needs an open workspace folder.');
  }

  return workspaceFolder;
}

export async function ensureGitRepository(): Promise<void> {
  requireWorkspaceFolder();

  if (!(await GitService.isGitRepo())) {
    throw new Error('BranchFlow only works inside a Git repository.');
  }
}

export function loadValidatedPolicy(): BranchFlowPolicy {
  const policy = PolicyLoader.loadPolicy();
  const validationErrors = PolicyValidator.validate(policy);

  if (validationErrors.length > 0) {
    throw new Error(
      `Policy validation failed:\n- ${validationErrors.join('\n- ')}`
    );
  }

  return policy;
}

export async function getValidatedWorkflowState(): Promise<ValidatedWorkflowState> {
  await ensureGitRepository();

  const policy = loadValidatedPolicy();
  const currentBranch = await GitService.getCurrentBranch();
  const branchType = BranchClassifier.classify(currentBranch, policy);

  return { policy, currentBranch, branchType };
}

export function ensureActionAllowed(
  action: BranchFlowAction,
  currentBranch: string,
  branchType: BranchType,
  policy: BranchFlowPolicy
): void {
  const availableActions = ActionResolver.getAvailableActions(
    currentBranch,
    branchType,
    policy
  );

  if (!availableActions.includes(action)) {
    throw new Error(
      `${BRANCH_FLOW_ACTION_TITLES[action]} is not allowed from branch "${currentBranch}" (${branchType}).`
    );
  }
}

export async function ensureCleanWorkingTree(): Promise<void> {
  if (!(await GitService.isWorkingTreeClean())) {
    throw new Error('BranchFlow requires a clean working tree for this action.');
  }
}

export async function resolveExecutionMode(
  mode: FinishMode,
  placeHolder: string
): Promise<'direct' | 'merge-request' | undefined> {
  if (mode === 'direct' || mode === 'merge-request') {
    return mode;
  }

  const selectedMode = await promptForModeChoice(placeHolder);

  if (selectedMode !== 'direct' && selectedMode !== 'merge-request') {
    return undefined;
  }

  return selectedMode;
}

export async function createPromotionRequest(
  policy: BranchFlowPolicy,
  input: PromotionRequestInput
): Promise<PromotionRequestResult> {
  const remoteUrl = await GitService.getRemoteUrl(policy.provider.remoteName);
  const provider = ProviderDetector.createProvider(policy, remoteUrl);
  return provider.createPromotionRequest(input);
}

export async function showPromotionRequestResult(
  message: string,
  result: PromotionRequestResult
): Promise<void> {
  if (!result.url) {
    await vscode.window.showInformationMessage(message);
    return;
  }

  const openChoice = await vscode.window.showInformationMessage(message, 'Open');

  if (openChoice === 'Open') {
    await vscode.env.openExternal(vscode.Uri.parse(result.url));
  }
}

export async function runStartWorkflowBranch(
  context: vscode.ExtensionContext,
  kind: WorkflowBranchKind,
  action: BranchFlowAction,
  promptForName: () => Promise<string | undefined>
): Promise<void> {
  const { policy, currentBranch, branchType } = await getValidatedWorkflowState();

  ensureActionAllowed(action, currentBranch, branchType, policy);
  await ensureCleanWorkingTree();

  const branchSuffix = await promptForName();

  if (!branchSuffix) {
    return;
  }

  const branchName = `${policy.prefixes[kind]}${branchSuffix}`;

  if (await GitService.branchExists(branchName)) {
    throw new Error(`Branch "${branchName}" already exists.`);
  }

  await GitService.checkoutNewBranch(branchName);
  await BranchMetadataStore.saveMetadata(context, {
    branchName,
    kind,
    baseBranch: currentBranch,
    createdAt: new Date().toISOString()
  });

  await vscode.window.showInformationMessage(
    `Created ${kind} branch "${branchName}" from "${currentBranch}".`
  );
}

export async function runFinishWorkflowBranch(
  context: vscode.ExtensionContext,
  kind: WorkflowBranchKind,
  action: BranchFlowAction
): Promise<void> {
  const { policy, currentBranch, branchType } = await getValidatedWorkflowState();

  if (branchType !== kind) {
    throw new Error(
      `${BRANCH_FLOW_ACTION_TITLES[action]} only works while you are on a ${kind} branch.`
    );
  }

  ensureActionAllowed(action, currentBranch, branchType, policy);
  await ensureCleanWorkingTree();

  const metadata = await BranchMetadataStore.getMetadata(context, currentBranch);

  if (!metadata || metadata.kind !== kind) {
    throw new Error(
      `BranchFlow could not find stored metadata for "${currentBranch}". Finish commands require the remembered base branch.`
    );
  }

  const baseBranch = metadata.baseBranch;
  const finishConfig = policy[kind].finish;
  const selectedMode = await resolveExecutionMode(
    finishConfig.mode,
    `Choose how to finish ${currentBranch}`
  );

  if (!selectedMode) {
    return;
  }

  if (selectedMode === 'direct') {
    await GitService.checkoutBranch(baseBranch);
    await GitService.mergeIntoCurrent(currentBranch);

    if (finishConfig.deleteBranchAfterFinish) {
      await GitService.deleteBranch(currentBranch);
    }

    await BranchMetadataStore.deleteMetadata(context, currentBranch);
    await vscode.window.showInformationMessage(
      `Merged "${currentBranch}" into "${baseBranch}".`
    );
    return;
  }

  const result = await createPromotionRequest(policy, {
    sourceBranch: currentBranch,
    targetBranch: baseBranch,
    title: `Finish ${kind}: ${currentBranch} -> ${baseBranch}`,
    description: `Finish ${kind} branch ${currentBranch} into ${baseBranch}.`
  });

  if (finishConfig.switchBackToBase || finishConfig.deleteBranchAfterFinish) {
    await GitService.checkoutBranch(baseBranch);
  }

  if (finishConfig.deleteBranchAfterFinish) {
    await GitService.deleteBranch(currentBranch);
    await BranchMetadataStore.deleteMetadata(context, currentBranch);
  }

  await showPromotionRequestResult(
    `${capitalize(kind)} request ready for "${currentBranch}" -> "${baseBranch}".`,
    result
  );
}

export async function showCommandError(
  error: unknown,
  prefix: string
): Promise<void> {
  const message =
    error instanceof Error ? error.message.replace(/\n+/g, ' ') : 'Unexpected error.';

  await vscode.window.showErrorMessage(`${prefix}: ${message}`);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
