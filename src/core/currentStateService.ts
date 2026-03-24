import * as vscode from 'vscode';
import { BranchFlowAction } from '../types/action';
import { ActionResolver } from './actionResolver';
import { BranchClassifier } from './branchClassifier';
import { PolicyLoader } from './policyLoader';
import { PolicyValidator } from './policyValidator';
import { GitService } from '../git/gitService';
import { ProviderDetector } from '../providers/providerDetector';
import { BranchType } from '../types/policy';
import { BranchFlowStateSummary } from '../ui/stateFormatter';

/**
 * Builds a single, reusable snapshot of the current repository and policy state.
 * Both the command-palette diagnostics and the sidebar render from this service.
 */
export class CurrentStateService {
  public static async resolve(): Promise<BranchFlowStateSummary> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
      return {
        gitRepository: false,
        policyStatus: 'No workspace folder is open.',
        availableActions: []
      };
    }

    const isGitRepo = await GitService.isGitRepo();
    const summary: BranchFlowStateSummary = {
      workspacePath: workspaceFolder.uri.fsPath,
      gitRepository: isGitRepo,
      policyPath: PolicyLoader.getPolicyPath() ?? undefined,
      policyStatus: 'Not loaded',
      availableActions: ['reloadPolicy', 'showCurrentState']
    };

    if (!isGitRepo) {
      summary.policyStatus = 'Open a Git repository to use BranchFlow.';
      summary.availableActions = ['showCurrentState'];
      return summary;
    }

    const currentBranch = await GitService.getCurrentBranch();
    const isWorkingTreeClean = await GitService.isWorkingTreeClean();
    const policyExists = PolicyLoader.policyExists();
    let branchType: BranchType | undefined;
    let validationErrors: string[] = [];
    let availableActions: BranchFlowAction[] = ['reloadPolicy', 'showCurrentState'];

    summary.currentBranch = currentBranch;
    summary.workingTreeClean = isWorkingTreeClean;

    if (!policyExists) {
      summary.policyStatus = 'Missing';
      summary.availableActions = ['initializeProject', 'reloadPolicy', 'showCurrentState'];
      return summary;
    }

    try {
      const policy = PolicyLoader.loadPolicy();
      branchType = BranchClassifier.classify(currentBranch, policy);
      validationErrors = PolicyValidator.validate(policy);
      availableActions =
        validationErrors.length === 0
          ? ActionResolver.getAvailableActions(currentBranch, branchType, policy)
          : ['reloadPolicy', 'showCurrentState'];

      summary.branchType = branchType;
      summary.isProtected = branchType === 'protected';
      summary.remoteName = policy.provider.remoteName;
      summary.provider = await this.resolveProviderLabel(policy.provider.type, policy.provider.remoteName);
      summary.policyStatus = validationErrors.length === 0 ? 'Valid' : 'Invalid';
      summary.availableActions = availableActions;
      summary.validationErrors = validationErrors.length > 0 ? validationErrors : undefined;
      return summary;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown policy loading error.';

      summary.branchType = branchType;
      summary.isProtected = branchType === 'protected';
      summary.policyStatus = `Invalid (${message})`;
      summary.availableActions = availableActions;
      summary.validationErrors = validationErrors.length > 0 ? validationErrors : undefined;
      return summary;
    }
  }

  private static async resolveProviderLabel(
    providerType: 'gitlab' | 'github' | 'auto',
    remoteName: string
  ): Promise<string> {
    try {
      const remoteUrl = await GitService.getRemoteUrl(remoteName);
      return ProviderDetector.detectProviderType(providerType, remoteUrl);
    } catch {
      return providerType === 'auto' ? 'auto (remote unresolved)' : providerType;
    }
  }
}
