import * as vscode from 'vscode';
import { runFinishWorkflowBranch, showCommandError } from './shared';

export async function finishHotfix(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await runFinishWorkflowBranch(context, 'hotfix', 'finishHotfix');
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not finish the hotfix');
  }
}
