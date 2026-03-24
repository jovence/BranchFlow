import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { BranchFlowPolicy } from '../types/policy';

export class PolicyLoader {
  public static getPolicyPath(): string | null {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return null;
    }

    return path.join(workspaceFolder.uri.fsPath, '.branchflow.json');
  }

  public static policyExists(): boolean {
    const policyPath = this.getPolicyPath();
    if (!policyPath) {
      return false;
    }

    return fs.existsSync(policyPath);
  }

  public static loadPolicy(): BranchFlowPolicy {
    const policyPath = this.getPolicyPath();

    if (!policyPath) {
      throw new Error('No workspace folder is open.');
    }

    if (!fs.existsSync(policyPath)) {
      throw new Error('No .branchflow.json file found in the repository root.');
    }

    const raw = fs.readFileSync(policyPath, 'utf8');

    try {
      return JSON.parse(raw) as BranchFlowPolicy;
    } catch (error) {
      throw new Error('Invalid JSON in .branchflow.json.');
    }
  }
}