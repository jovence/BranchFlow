import { BranchFlowPolicy, BranchType } from '../types/policy';

export class BranchClassifier {
  public static classify(branchName: string, policy: BranchFlowPolicy): BranchType {
    if (policy.branches.protected.includes(branchName)) {
      return 'protected';
    }

    if (policy.branches.working.includes(branchName)) {
      return 'working';
    }

    if (branchName.startsWith(policy.prefixes.feature)) {
      return 'feature';
    }

    if (branchName.startsWith(policy.prefixes.release)) {
      return 'release';
    }

    if (branchName.startsWith(policy.prefixes.hotfix)) {
      return 'hotfix';
    }

    return 'unknown';
  }
}