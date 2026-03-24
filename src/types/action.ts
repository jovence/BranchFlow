export type BranchFlowAction =
  | 'initializeProject'
  | 'reloadPolicy'
  | 'showCurrentState'
  | 'startFeature'
  | 'finishFeature'
  | 'startRelease'
  | 'finishRelease'
  | 'startHotfix'
  | 'finishHotfix'
  | 'promoteBranch';

export const BRANCH_FLOW_ACTION_TITLES: Record<BranchFlowAction, string> = {
  initializeProject: 'Initialize Project',
  reloadPolicy: 'Reload Policy',
  showCurrentState: 'Show Current State',
  startFeature: 'Start Feature',
  finishFeature: 'Finish Feature',
  startRelease: 'Start Release',
  finishRelease: 'Finish Release',
  startHotfix: 'Start Hotfix',
  finishHotfix: 'Finish Hotfix',
  promoteBranch: 'Promote Branch'
};
