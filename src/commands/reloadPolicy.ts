import * as vscode from 'vscode';
import { PolicyLoader } from '../core/policyLoader';
import { PolicyValidator } from '../core/policyValidator';
import { ensureGitRepository, showCommandError } from './shared';

export async function reloadPolicy(): Promise<void> {
  try {
    await ensureGitRepository();

    const policy = PolicyLoader.loadPolicy();
    const validationErrors = PolicyValidator.validate(policy);

    if (validationErrors.length > 0) {
      await vscode.window.showWarningMessage(
        `BranchFlow policy has validation issues: ${validationErrors.join(' ')}`
      );
      return;
    }

    await vscode.window.showInformationMessage('BranchFlow policy reloaded successfully.');
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not reload the policy');
  }
}
