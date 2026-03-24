import * as vscode from 'vscode';
import { CurrentStateService } from '../core/currentStateService';
import { StateFormatter } from '../ui/stateFormatter';

const outputChannel = vscode.window.createOutputChannel('BranchFlow');

export async function showCurrentState(): Promise<void> {
  outputChannel.clear();

  try {
    const summary = await CurrentStateService.resolve();
    outputChannel.appendLine(StateFormatter.format(summary));
    outputChannel.show(true);

    if (!summary.workspacePath) {
      await vscode.window.showErrorMessage('BranchFlow needs an open workspace folder.');
      return;
    }

    if (!summary.gitRepository) {
      await vscode.window.showErrorMessage('BranchFlow only works inside a Git repository.');
      return;
    }

    if (summary.validationErrors && summary.validationErrors.length > 0) {
      await vscode.window.showWarningMessage(
        `BranchFlow: ${summary.currentBranch ?? 'unknown'} (${summary.branchType ?? 'unknown'}) with policy warnings.`
      );
      return;
    }

    await vscode.window.showInformationMessage(
      `BranchFlow: ${summary.currentBranch ?? 'unknown'} (${summary.branchType ?? 'unknown'})`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error while reading state.';

    outputChannel.appendLine(`BranchFlow failed: ${message}`);
    outputChannel.show(true);
    await vscode.window.showErrorMessage(`BranchFlow failed: ${message}`);
  }
}
