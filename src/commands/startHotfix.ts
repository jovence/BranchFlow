import * as vscode from 'vscode';
import { promptForHotfixName } from '../ui/prompts';
import { runStartWorkflowBranch, showCommandError } from './shared';

export async function startHotfix(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await runStartWorkflowBranch(
      context,
      'hotfix',
      'startHotfix',
      promptForHotfixName
    );
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not start the hotfix');
  }
}
