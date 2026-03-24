import { GitProvider, PromotionRequestInput, PromotionRequestResult, remoteUrlToWebUrl } from './provider';

export class GitHubProvider implements GitProvider {
  public constructor(private readonly remoteUrl: string) {}

  public async createPromotionRequest(
    input: PromotionRequestInput
  ): Promise<PromotionRequestResult> {
    const compareUrl = new URL(
      `${remoteUrlToWebUrl(this.remoteUrl)}/compare/${encodeURIComponent(
        input.targetBranch
      )}...${encodeURIComponent(input.sourceBranch)}`
    );

    compareUrl.searchParams.set('expand', '1');
    compareUrl.searchParams.set('title', input.title);
    compareUrl.searchParams.set('body', input.description);

    return { url: compareUrl.toString() };
  }
}
