export interface PromotionRequestInput {
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description: string;
}

export interface PromotionRequestResult {
  url?: string;
  id?: string;
}

export interface GitProvider {
  createPromotionRequest(
    input: PromotionRequestInput
  ): Promise<PromotionRequestResult>;
}

export function remoteUrlToWebUrl(remoteUrl: string): string {
  const trimmed = remoteUrl.trim().replace(/\.git$/, '');

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  const sshMatch = trimmed.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/]([^]+)$/);

  if (sshMatch) {
    const [, host, projectPath] = sshMatch;
    return `https://${host}/${projectPath.replace(/^\/+/, '')}`;
  }

  throw new Error(`Unsupported remote URL format: ${remoteUrl}`);
}
