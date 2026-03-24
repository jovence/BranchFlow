import {
  BranchFlowPolicy,
  BranchType,
  FinishMode,
  ProviderType,
  WorkflowRuleConfig
} from '../types/policy';

const VALID_PROVIDER_TYPES: ProviderType[] = ['gitlab', 'github', 'auto'];
const VALID_FINISH_MODES: FinishMode[] = ['direct', 'merge-request', 'ask'];
const VALID_BRANCH_TYPES: BranchType[] = [
  'protected',
  'working',
  'feature',
  'release',
  'hotfix',
  'unknown'
];

export class PolicyValidator {
  public static validate(policy: BranchFlowPolicy): string[] {
    const errors: string[] = [];

    if (!Number.isInteger(policy.version) || policy.version < 1) {
      errors.push('version must be a positive integer.');
    }

    if (!VALID_PROVIDER_TYPES.includes(policy.provider?.type)) {
      errors.push('provider.type must be one of: gitlab, github, auto.');
    }

    if (
      !policy.provider?.remoteName ||
      typeof policy.provider.remoteName !== 'string' ||
      policy.provider.remoteName.trim().length === 0
    ) {
      errors.push('provider.remoteName must be a non-empty string.');
    }

    if (!this.isStringArray(policy.branches?.protected)) {
      errors.push('branches.protected must be an array of branch names.');
    }

    if (!this.isStringArray(policy.branches?.working)) {
      errors.push('branches.working must be an array of branch names.');
    }

    if (!this.isNonEmptyString(policy.prefixes?.feature)) {
      errors.push('prefixes.feature must be a non-empty string.');
    }

    if (!this.isNonEmptyString(policy.prefixes?.release)) {
      errors.push('prefixes.release must be a non-empty string.');
    }

    if (!this.isNonEmptyString(policy.prefixes?.hotfix)) {
      errors.push('prefixes.hotfix must be a non-empty string.');
    }

    this.validateFlowSection('feature', policy.feature, errors);
    this.validateFlowSection('release', policy.release, errors);
    this.validateFlowSection('hotfix', policy.hotfix, errors);

    if (policy.promotion?.enabled) {
      if (!this.isStringArray(policy.promotion.flow) || policy.promotion.flow.length < 2) {
        errors.push('promotion.flow must contain at least 2 branches when promotion is enabled.');
      }

      if (!VALID_FINISH_MODES.includes(policy.promotion.mode)) {
        errors.push('promotion.mode must be one of: direct, merge-request, ask.');
      }

      if (typeof policy.promotion.allowSkip !== 'boolean') {
        errors.push('promotion.allowSkip must be a boolean.');
      }
    }

    if (typeof policy.ui?.showDebugInfo !== 'boolean') {
      errors.push('ui.showDebugInfo must be a boolean.');
    }

    return errors;
  }

  private static validateFlowSection(
    sectionName: string,
    section: WorkflowRuleConfig | undefined,
    errors: string[]
  ): void {
    if (!section || typeof section.enabled !== 'boolean') {
      errors.push(`${sectionName}.enabled must be a boolean.`);
      return;
    }

    if (!Array.isArray(section.allowedSourceBranchTypes)) {
      errors.push(`${sectionName}.allowedSourceBranchTypes must be an array.`);
    } else {
      const invalidBranchTypes = section.allowedSourceBranchTypes.filter(
        (branchType) => !VALID_BRANCH_TYPES.includes(branchType)
      );

      if (invalidBranchTypes.length > 0) {
        errors.push(
          `${sectionName}.allowedSourceBranchTypes contains invalid branch types: ${invalidBranchTypes.join(
            ', '
          )}.`
        );
      }
    }

    if (!this.isStringArray(section.allowedSourceBranches)) {
      errors.push(`${sectionName}.allowedSourceBranches must be an array.`);
    }

    if (!section.finish) {
      errors.push(`${sectionName}.finish is required.`);
      return;
    }

    if (!VALID_FINISH_MODES.includes(section.finish.mode)) {
      errors.push(`${sectionName}.finish.mode must be one of: direct, merge-request, ask.`);
    }

    if (typeof section.finish.deleteBranchAfterFinish !== 'boolean') {
      errors.push(`${sectionName}.finish.deleteBranchAfterFinish must be a boolean.`);
    }

    if (typeof section.finish.switchBackToBase !== 'boolean') {
      errors.push(`${sectionName}.finish.switchBackToBase must be a boolean.`);
    }
  }

  private static isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }

  private static isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
