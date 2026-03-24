import * as vscode from 'vscode';
import { ActionResolver } from '../core/actionResolver';
import { BranchClassifier } from '../core/branchClassifier';
import { PolicyLoader } from '../core/policyLoader';
import { PolicyValidator } from '../core/policyValidator';
import { GitService } from '../git/gitService';
import { ProviderDetector } from '../providers/providerDetector';
import { BranchFlowAction } from '../types/action';
import { BranchType } from '../types/policy';
import { requireWorkspaceFolder } from './shared';
import { BranchFlowStateSummary, StateFormatter } from '../ui/stateFormatter';

const outputChannel = vscode.window.createOutputChannel('BranchFlow');

export async function showCurrentState(): Promise<void> {
  outputChannel.clear();

  try {
    const workspaceFolder = requireWorkspaceFolder();
    const isGitRepo = await GitService.isGitRepo();
    const summary: BranchFlowStateSummary = {
      workspacePath: workspaceFolder.uri.fsPath,
      gitRepository: isGitRepo,
      policyPath: PolicyLoader.getPolicyPath() ?? undefined,
      policyStatus: 'Not loaded',
      availableActions: ['reloadPolicy', 'showCurrentState']
    };

    if (!isGitRepo) {
      summary.policyStatus = 'Unavailable because the workspace is not a Git repository';
      outputChannel.appendLine(StateFormatter.format(summary));
      outputChannel.show(true);
      await vscode.window.showErrorMessage(
        'BranchFlow only works inside a Git repository.'
      );
      return;
    }

    const currentBranch = await GitService.getCurrentBranch();
    const isWorkingTreeClean = await GitService.isWorkingTreeClean();
    const policyExists = PolicyLoader.policyExists();
    let branchType: BranchType | undefined;
    let validationErrors: string[] = [];
    let availableActions: BranchFlowAction[] = ['reloadPolicy', 'showCurrentState'];
    let provider = 'Unavailable';

    summary.currentBranch = currentBranch;
    summary.workingTreeClean = isWorkingTreeClean;

    if (policyExists) {
      try {
        const policy = PolicyLoader.loadPolicy();
        branchType = BranchClassifier.classify(currentBranch, policy);
        validationErrors = PolicyValidator.validate(policy);
        availableActions =
          validationErrors.length === 0
            ? ActionResolver.getAvailableActions(currentBranch, branchType, policy)
            : ['reloadPolicy', 'showCurrentState'];

        try {
          const remoteUrl = await GitService.getRemoteUrl(policy.provider.remoteName);
          provider = ProviderDetector.detectProvider(policy, remoteUrl);
        } catch {
          provider =
            policy.provider.type === 'auto' ? 'auto (remote unresolved)' : policy.provider.type;
        }

        summary.branchType = branchType;
        summary.isProtected = branchType === 'protected';
        summary.remoteName = policy.provider.remoteName;
        summary.provider = provider;
        summary.policyStatus = validationErrors.length === 0 ? 'Valid' : 'Invalid';
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown policy loading error.';
        summary.policyStatus = `Invalid (${message})`;
      }
    } else {
      summary.policyStatus = 'Missing';
      availableActions = ['initializeProject', 'reloadPolicy', 'showCurrentState'];
    }

    summary.branchType = summary.branchType ?? branchType;
    summary.isProtected = summary.isProtected ?? branchType === 'protected';
    summary.availableActions = availableActions;
    summary.validationErrors = validationErrors.length > 0 ? validationErrors : undefined;

    outputChannel.appendLine(StateFormatter.format(summary));
    outputChannel.show(true);

    if (validationErrors.length > 0) {
      await vscode.window.showWarningMessage(
        `BranchFlow: ${currentBranch} (${branchType ?? 'unknown'}) with policy warnings.`
      );
      return;
    }

    await vscode.window.showInformationMessage(
      `BranchFlow: ${currentBranch} (${branchType ?? 'unknown'})`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while reading state.';

    outputChannel.appendLine(`BranchFlow failed: ${message}`);
    outputChannel.show(true);
    await vscode.window.showErrorMessage(`BranchFlow failed: ${message}`);
  }
}
