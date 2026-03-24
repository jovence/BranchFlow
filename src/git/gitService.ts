import { execFile } from 'child_process';
import * as vscode from 'vscode';

export class GitService {
  private static getWorkspacePath(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
      throw new Error('No workspace folder is open.');
    }

    return workspaceFolder.uri.fsPath;
  }

  private static runGitCommand(args: string[]): Promise<string> {
    const workspacePath = this.getWorkspacePath();

    return new Promise((resolve, reject) => {
      execFile('git', args, { cwd: workspacePath }, (error, stdout, stderr) => {
        if (error) {
          const details = [stderr.trim(), stdout.trim(), error.message]
            .filter((value) => value.length > 0)
            .join(' ');

          reject(new Error(details));
          return;
        }

        resolve(stdout.trim());
      });
    });
  }

  public static async isGitRepo(): Promise<boolean> {
    try {
      await this.runGitCommand(['rev-parse', '--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  public static async getCurrentBranch(): Promise<string> {
    const branchName = await this.runGitCommand(['branch', '--show-current']);

    if (branchName.length === 0) {
      throw new Error('Could not determine the current branch.');
    }

    return branchName;
  }

  public static async isWorkingTreeClean(): Promise<boolean> {
    const output = await this.runGitCommand(['status', '--porcelain']);
    return output.length === 0;
  }

  public static async checkoutNewBranch(branchName: string): Promise<void> {
    await this.runGitCommand(['checkout', '-b', branchName]);
  }

  public static async checkoutBranch(branchName: string): Promise<void> {
    await this.runGitCommand(['checkout', branchName]);
  }

  public static async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.runGitCommand(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`]);
      return true;
    } catch {
      return false;
    }
  }

  public static async deleteBranch(branchName: string): Promise<void> {
    await this.runGitCommand(['branch', '-D', branchName]);
  }

  public static async mergeIntoCurrent(sourceBranch: string): Promise<void> {
    await this.runGitCommand(['merge', '--no-ff', sourceBranch]);
  }

  public static async fetch(remoteName: string): Promise<void> {
    await this.runGitCommand(['fetch', remoteName]);
  }

  public static async getAheadBehind(
    target: string,
    source: string
  ): Promise<{ ahead: number; behind: number }> {
    const output = await this.runGitCommand([
      'rev-list',
      '--left-right',
      '--count',
      `${target}...${source}`
    ]);
    const [behindRaw, aheadRaw] = output.split(/\s+/);
    const ahead = Number(aheadRaw);
    const behind = Number(behindRaw);

    if (Number.isNaN(ahead) || Number.isNaN(behind)) {
      throw new Error('Unable to compare branches for promotion.');
    }

    return { ahead, behind };
  }

  public static async getRemoteUrl(remoteName: string): Promise<string> {
    return this.runGitCommand(['remote', 'get-url', remoteName]);
  }
}
