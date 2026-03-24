export type WorkflowBranchKind = 'feature' | 'release' | 'hotfix';

export interface BranchMetadata {
  branchName: string;
  kind: WorkflowBranchKind;
  baseBranch: string;
  createdAt: string;
}
