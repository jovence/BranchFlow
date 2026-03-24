import * as vscode from 'vscode';
import { promptForReleaseName } from '../ui/prompts';
import { runStartWorkflowBranch, showCommandError } from './shared';

export async function startRelease(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    await runStartWorkflowBranch(
      context,
      'release',
      'startRelease',
      promptForReleaseName
    );
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not start the release');
  }
}
