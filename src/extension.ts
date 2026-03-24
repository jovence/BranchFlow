import * as vscode from 'vscode';
import { finishFeature } from './commands/finishFeature';
import { finishHotfix } from './commands/finishHotfix';
import { finishRelease } from './commands/finishRelease';
import { initializeProject } from './commands/initializeProject';
import { promoteBranch } from './commands/promoteBranch';
import { reloadPolicy } from './commands/reloadPolicy';
import { showCurrentState } from './commands/showCurrentState';
import { startFeature } from './commands/startFeature';
import { startHotfix } from './commands/startHotfix';
import { startRelease } from './commands/startRelease';

export function activate(context: vscode.ExtensionContext): void {
  console.log('BranchFlow extension activated');

  context.subscriptions.push(
    vscode.commands.registerCommand('branchflow.initializeProject', () =>
      initializeProject()
    ),
    vscode.commands.registerCommand('branchflow.reloadPolicy', () => reloadPolicy()),
    vscode.commands.registerCommand('branchflow.showCurrentState', () =>
      showCurrentState()
    ),
    vscode.commands.registerCommand('branchflow.startFeature', () =>
      startFeature(context)
    ),
    vscode.commands.registerCommand('branchflow.finishFeature', () =>
      finishFeature(context)
    ),
    vscode.commands.registerCommand('branchflow.startRelease', () =>
      startRelease(context)
    ),
    vscode.commands.registerCommand('branchflow.finishRelease', () =>
      finishRelease(context)
    ),
    vscode.commands.registerCommand('branchflow.startHotfix', () =>
      startHotfix(context)
    ),
    vscode.commands.registerCommand('branchflow.finishHotfix', () =>
      finishHotfix(context)
    ),
    vscode.commands.registerCommand('branchflow.promoteBranch', () =>
      promoteBranch()
    )
  );
}

export function deactivate(): void {}
