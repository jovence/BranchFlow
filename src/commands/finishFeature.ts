import * as vscode from 'vscode';
import { runFinishWorkflowBranch, showCommandError } from './shared';

export async function finishFeature(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await runFinishWorkflowBranch(context, 'feature', 'finishFeature');
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not finish the feature');
  }
}
