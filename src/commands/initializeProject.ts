import * as vscode from 'vscode';
import { PolicyLoader } from '../core/policyLoader';
import { PolicyValidator } from '../core/policyValidator';
import { BranchFlowPolicy } from '../types/policy';
import {
  confirmOverwritePolicy,
  promptForAllowSkip,
  promptForBranchList,
  promptForModeChoice,
  promptForPrefix,
  promptForProviderType,
  promptForRemoteName
} from '../ui/prompts';
import { ensureGitRepository, requireWorkspaceFolder, showCommandError } from './shared';

export async function initializeProject(): Promise<void> {
  try {
    requireWorkspaceFolder();
    await ensureGitRepository();

    const policyPath = PolicyLoader.getPolicyPath();

    if (!policyPath) {
      throw new Error('Could not determine the .branchflow.json path.');
    }

    if (PolicyLoader.policyExists()) {
      const shouldOverwrite = await confirmOverwritePolicy();

      if (!shouldOverwrite) {
        return;
      }
    }

    const providerType = await promptForProviderType();

    if (!providerType) {
      return;
    }

    const remoteName = await promptForRemoteName('origin');

    if (!remoteName) {
      return;
    }

    const protectedBranches = await promptForBranchList(
      'Protected branches (comma-separated)',
      'main, prod, beta, staging'
    );

    if (!protectedBranches) {
      return;
    }

    const workingBranches = await promptForBranchList(
      'Working branches (comma-separated)',
      'develop, dev, integration'
    );

    if (!workingBranches) {
      return;
    }

    const featurePrefix = await promptForPrefix('feature', 'feature/');

    if (!featurePrefix) {
      return;
    }

    const releasePrefix = await promptForPrefix('release', 'release/');

    if (!releasePrefix) {
      return;
    }

    const hotfixPrefix = await promptForPrefix('hotfix', 'hotfix/');

    if (!hotfixPrefix) {
      return;
    }

    const featureMode = await promptForModeChoice(
      'Choose the default feature finish mode',
      true,
      'merge-request'
    );

    if (!featureMode) {
      return;
    }

    const releaseMode = await promptForModeChoice(
      'Choose the default release finish mode',
      true,
      'merge-request'
    );

    if (!releaseMode) {
      return;
    }

    const hotfixMode = await promptForModeChoice(
      'Choose the default hotfix finish mode',
      true,
      'merge-request'
    );

    if (!hotfixMode) {
      return;
    }

    const promotionFlow = await promptForBranchList(
      'Promotion flow (comma-separated)',
      'develop, beta, prod'
    );

    if (!promotionFlow) {
      return;
    }

    const promotionMode = await promptForModeChoice(
      'Choose the default promotion mode',
      true,
      'merge-request'
    );

    if (!promotionMode) {
      return;
    }

    const allowSkip = await promptForAllowSkip(false);

    if (allowSkip === undefined) {
      return;
    }

    const policy: BranchFlowPolicy = {
      version: 1,
      provider: {
        type: providerType,
        remoteName: remoteName.trim()
      },
      branches: {
        protected: protectedBranches,
        working: workingBranches
      },
      prefixes: {
        feature: featurePrefix,
        release: releasePrefix,
        hotfix: hotfixPrefix
      },
      feature: {
        enabled: true,
        allowedSourceBranchTypes: ['working'],
        allowedSourceBranches: [],
        finish: {
          mode: featureMode,
          deleteBranchAfterFinish: true,
          switchBackToBase: true
        }
      },
      release: {
        enabled: true,
        allowedSourceBranchTypes: ['working'],
        allowedSourceBranches: [],
        finish: {
          mode: releaseMode,
          deleteBranchAfterFinish: true,
          switchBackToBase: true
        }
      },
      hotfix: {
        enabled: true,
        allowedSourceBranchTypes: [],
        allowedSourceBranches: protectedBranches.slice(0, Math.min(protectedBranches.length, 2)),
        finish: {
          mode: hotfixMode,
          deleteBranchAfterFinish: true,
          switchBackToBase: true
        }
      },
      promotion: {
        enabled: true,
        flow: promotionFlow,
        mode: promotionMode,
        allowSkip
      },
      ui: {
        showDebugInfo: false
      }
    };

    const validationErrors = PolicyValidator.validate(policy);

    if (validationErrors.length > 0) {
      throw new Error(`Generated policy is invalid: ${validationErrors.join(' ')}`);
    }

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(policyPath),
      Buffer.from(`${JSON.stringify(policy, null, 2)}\n`, 'utf8')
    );

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(policyPath));
    await vscode.window.showTextDocument(document);
    await vscode.window.showInformationMessage('BranchFlow initialized .branchflow.json.');
  } catch (error) {
    await showCommandError(error, 'BranchFlow could not initialize the project');
  }
}
