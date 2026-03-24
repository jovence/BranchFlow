export type ProviderType = 'gitlab' | 'github' | 'auto';
export type FinishMode = 'direct' | 'merge-request' | 'ask';
export type BranchType =
  | 'protected'
  | 'working'
  | 'feature'
  | 'release'
  | 'hotfix'
  | 'unknown';

export interface ProviderConfig {
  type: ProviderType;
  remoteName: string;
}

export interface BranchesConfig {
  protected: string[];
  working: string[];
}

export interface PrefixesConfig {
  feature: string;
  release: string;
  hotfix: string;
}

export interface FinishConfig {
  mode: FinishMode;
  deleteBranchAfterFinish: boolean;
  switchBackToBase: boolean;
}

export interface WorkflowRuleConfig {
  enabled: boolean;
  allowedSourceBranchTypes: BranchType[];
  allowedSourceBranches: string[];
  finish: FinishConfig;
}

export type FeatureConfig = WorkflowRuleConfig;
export type ReleaseConfig = WorkflowRuleConfig;
export type HotfixConfig = WorkflowRuleConfig;

export interface PromotionConfig {
  enabled: boolean;
  flow: string[];
  mode: FinishMode;
  allowSkip: boolean;
}

export interface UiConfig {
  showDebugInfo: boolean;
}

export interface BranchFlowPolicy {
  version: number;
  provider: ProviderConfig;
  branches: BranchesConfig;
  prefixes: PrefixesConfig;
  feature: FeatureConfig;
  release: ReleaseConfig;
  hotfix: HotfixConfig;
  promotion: PromotionConfig;
  ui: UiConfig;
}
