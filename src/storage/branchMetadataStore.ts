import * as vscode from 'vscode';
import { BranchMetadata } from '../types/metadata';

const STORAGE_KEY = 'branchflow.branchMetadata.v1';

export class BranchMetadataStore {
  public static async saveMetadata(
    context: vscode.ExtensionContext,
    metadata: BranchMetadata
  ): Promise<void> {
    const allMetadata = this.getAllMetadata(context);
    allMetadata[metadata.branchName] = metadata;
    await context.workspaceState.update(STORAGE_KEY, allMetadata);
  }

  public static async getMetadata(
    context: vscode.ExtensionContext,
    branchName: string
  ): Promise<BranchMetadata | undefined> {
    const allMetadata = this.getAllMetadata(context);
    return allMetadata[branchName];
  }

  public static async deleteMetadata(
    context: vscode.ExtensionContext,
    branchName: string
  ): Promise<void> {
    const allMetadata = this.getAllMetadata(context);
    delete allMetadata[branchName];
    await context.workspaceState.update(STORAGE_KEY, allMetadata);
  }

  public static async listMetadata(context: vscode.ExtensionContext): Promise<BranchMetadata[]> {
    return Object.values(this.getAllMetadata(context));
  }

  private static getAllMetadata(
    context: vscode.ExtensionContext
  ): Record<string, BranchMetadata> {
    return context.workspaceState.get<Record<string, BranchMetadata>>(STORAGE_KEY, {});
  }
}
