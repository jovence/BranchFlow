import * as vscode from 'vscode';
import { runFinishWorkflowBranch, showCommandError } from './shared';

export async function finishRelease(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await runFinishWorkflowBranch(context, 'release', 'finishRelease');
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not finish the release');
  }
}
