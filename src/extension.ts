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
import { BranchFlowSidebarProvider } from './ui/sidebarProvider';

export function activate(context: vscode.ExtensionContext): void {
  console.log('BranchFlow extension activated');
  const sidebarProvider = new BranchFlowSidebarProvider();

  // Every command flows through the same wrapper so the sidebar stays fresh after
  // a branch change, policy edit, or merge operation.
  const registerCommand = (
    commandId: string,
    handler: () => Thenable<unknown> | Promise<unknown> | unknown
  ): vscode.Disposable => {
    return vscode.commands.registerCommand(commandId, async () => {
      try {
        return await handler();
      } finally {
        await sidebarProvider.refresh();
      }
    });
  };

  context.subscriptions.push(
    sidebarProvider,
    vscode.window.registerWebviewViewProvider(
      BranchFlowSidebarProvider.viewType,
      sidebarProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    ),
    registerCommand('branchflow.initializeProject', () => initializeProject()),
    registerCommand('branchflow.reloadPolicy', () => reloadPolicy()),
    registerCommand('branchflow.showCurrentState', () => showCurrentState()),
    registerCommand('branchflow.startFeature', () => startFeature(context)),
    registerCommand('branchflow.finishFeature', () => finishFeature(context)),
    registerCommand('branchflow.startRelease', () => startRelease(context)),
    registerCommand('branchflow.finishRelease', () => finishRelease(context)),
    registerCommand('branchflow.startHotfix', () => startHotfix(context)),
    registerCommand('branchflow.finishHotfix', () => finishHotfix(context)),
    registerCommand('branchflow.promoteBranch', () => promoteBranch()),
    registerCommand('branchflow.refreshSidebar', () => sidebarProvider.refresh())
  );

  void sidebarProvider.refresh();
}

export function deactivate(): void {}
