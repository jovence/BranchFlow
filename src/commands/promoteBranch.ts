import * as vscode from 'vscode';
import { ActionResolver } from '../core/actionResolver';
import { GitService } from '../git/gitService';
import { pickPromotionTarget } from '../ui/prompts';
import {
  createPromotionRequest,
  ensureActionAllowed,
  ensureCleanWorkingTree,
  getValidatedWorkflowState,
  resolveExecutionMode,
  showCommandError,
  showPromotionRequestResult
} from './shared';

export async function promoteBranch(): Promise<void> {
  try {
    const { policy, currentBranch, branchType } = await getValidatedWorkflowState();

    ensureActionAllowed('promoteBranch', currentBranch, branchType, policy);
    await GitService.fetch(policy.provider.remoteName);

    const promotionTargets = ActionResolver.getPromotionTargets(currentBranch, policy);
    const targetBranch = await pickPromotionTarget(currentBranch, promotionTargets);

    if (!targetBranch) {
      return;
    }

    if (!ActionResolver.isPromotionPairAllowed(currentBranch, targetBranch, policy.promotion)) {
      throw new Error(`Promotion from "${currentBranch}" to "${targetBranch}" is not allowed.`);
    }

    const selectedMode = await resolveExecutionMode(
      policy.promotion.mode,
      `Choose how to promote ${currentBranch} to ${targetBranch}`
    );

    if (!selectedMode) {
      return;
    }

    const comparison = await GitService.getAheadBehind(targetBranch, currentBranch);

    if (comparison.ahead === 0) {
      await vscode.window.showInformationMessage(
        `No new commits are available to promote from "${currentBranch}" to "${targetBranch}".`
      );
      return;
    }

    if (selectedMode === 'direct') {
      await ensureCleanWorkingTree();
      await GitService.checkoutBranch(targetBranch);
      await GitService.mergeIntoCurrent(currentBranch);
      await vscode.window.showInformationMessage(
        `Promoted "${currentBranch}" into "${targetBranch}".`
      );
      return;
    }

    const result = await createPromotionRequest(policy, {
      sourceBranch: currentBranch,
      targetBranch,
      title: `Promote ${currentBranch} -> ${targetBranch}`,
      description: `Promote ${currentBranch} into ${targetBranch}.`
    });

    await showPromotionRequestResult(
      `Promotion request ready for "${currentBranch}" -> "${targetBranch}".`,
      result
    );
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not promote the branch');
  }
}
