import { BranchFlowPolicy, ProviderType } from '../types/policy';
import { GitHubProvider } from './githubProvider';
import { GitLabProvider } from './gitlabProvider';
import { GitProvider } from './provider';

export type DetectedProviderType = Exclude<ProviderType, 'auto'>;

export class ProviderDetector {
  public static detectProvider(
    policy: BranchFlowPolicy,
    remoteUrl?: string
  ): DetectedProviderType {
    if (policy.provider.type === 'github' || policy.provider.type === 'gitlab') {
      return policy.provider.type;
    }

    if (!remoteUrl) {
      throw new Error('Provider auto-detection requires a remote URL.');
    }

    const normalizedRemote = remoteUrl.toLowerCase();

    if (normalizedRemote.includes('github')) {
      return 'github';
    }

    if (normalizedRemote.includes('gitlab')) {
      return 'gitlab';
    }

    throw new Error(`Could not auto-detect provider from remote URL: ${remoteUrl}`);
  }

  public static createProvider(policy: BranchFlowPolicy, remoteUrl: string): GitProvider {
    const providerType = this.detectProvider(policy, remoteUrl);

    if (providerType === 'github') {
      return new GitHubProvider(remoteUrl);
    }

    return new GitLabProvider(remoteUrl);
  }
}
