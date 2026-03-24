import { BranchFlowAction } from '../types/action';
import {
  BranchFlowPolicy,
  BranchType,
  PromotionConfig,
  WorkflowRuleConfig
} from '../types/policy';

export class ActionResolver {
  public static getAvailableActions(
    currentBranch: string,
    branchType: BranchType,
    policy: BranchFlowPolicy
  ): BranchFlowAction[] {
    const actions: BranchFlowAction[] = ['reloadPolicy', 'showCurrentState'];

    if (this.canStartFeature(currentBranch, branchType, policy)) {
      actions.push('startFeature');
    }

    if (this.canStartRelease(currentBranch, branchType, policy)) {
      actions.push('startRelease');
    }

    if (this.canStartHotfix(currentBranch, branchType, policy)) {
      actions.push('startHotfix');
    }

    if (branchType === 'feature' && policy.feature.enabled) {
      actions.push('finishFeature');
    }

    if (branchType === 'release' && policy.release.enabled) {
      actions.push('finishRelease');
    }

    if (branchType === 'hotfix' && policy.hotfix.enabled) {
      actions.push('finishHotfix');
    }

    if (this.canPromote(currentBranch, policy)) {
      actions.push('promoteBranch');
    }

    return actions;
  }

  public static canStartFeature(
    currentBranch: string,
    branchType: BranchType,
    policy: BranchFlowPolicy
  ): boolean {
    return this.isSourceAllowed(currentBranch, branchType, policy.feature);
  }

  public static canStartRelease(
    currentBranch: string,
    branchType: BranchType,
    policy: BranchFlowPolicy
  ): boolean {
    return this.isSourceAllowed(currentBranch, branchType, policy.release);
  }

  public static canStartHotfix(
    currentBranch: string,
    branchType: BranchType,
    policy: BranchFlowPolicy
  ): boolean {
    return this.isSourceAllowed(currentBranch, branchType, policy.hotfix);
  }

  public static canPromote(currentBranch: string, policy: BranchFlowPolicy): boolean {
    return policy.promotion.enabled && policy.promotion.flow.includes(currentBranch);
  }

  public static getPromotionTargets(
    currentBranch: string,
    policy: BranchFlowPolicy
  ): string[] {
    if (!this.canPromote(currentBranch, policy)) {
      return [];
    }

    const currentIndex = policy.promotion.flow.indexOf(currentBranch);

    if (currentIndex === -1 || currentIndex === policy.promotion.flow.length - 1) {
      return [];
    }

    if (!policy.promotion.allowSkip) {
      return [policy.promotion.flow[currentIndex + 1]];
    }

    return policy.promotion.flow.slice(currentIndex + 1);
  }

  public static isPromotionPairAllowed(
    sourceBranch: string,
    targetBranch: string,
    promotion: PromotionConfig
  ): boolean {
    if (!promotion.enabled) {
      return false;
    }

    const sourceIndex = promotion.flow.indexOf(sourceBranch);
    const targetIndex = promotion.flow.indexOf(targetBranch);

    if (sourceIndex === -1 || targetIndex === -1 || targetIndex <= sourceIndex) {
      return false;
    }

    if (!promotion.allowSkip) {
      return targetIndex === sourceIndex + 1;
    }

    return true;
  }

  private static isSourceAllowed(
    currentBranch: string,
    branchType: BranchType,
    config: WorkflowRuleConfig
  ): boolean {
    if (!config.enabled) {
      return false;
    }

    return (
      config.allowedSourceBranches.includes(currentBranch) ||
      config.allowedSourceBranchTypes.includes(branchType)
    );
  }
}
