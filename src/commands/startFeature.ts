import * as vscode from 'vscode';
import { promptForFeatureName } from '../ui/prompts';
import { runStartWorkflowBranch, showCommandError } from './shared';

export async function startFeature(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await runStartWorkflowBranch(
      context,
      'feature',
      'startFeature',
      promptForFeatureName
    );
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not start the feature');
  }
}
