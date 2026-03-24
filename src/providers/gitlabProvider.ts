import { GitProvider, PromotionRequestInput, PromotionRequestResult, remoteUrlToWebUrl } from './provider';

export class GitLabProvider implements GitProvider {
  public constructor(private readonly remoteUrl: string) {}

  public async createPromotionRequest(
    input: PromotionRequestInput
  ): Promise<PromotionRequestResult> {
    const mergeRequestUrl = new URL(
      `${remoteUrlToWebUrl(this.remoteUrl)}/-/merge_requests/new`
    );

    mergeRequestUrl.searchParams.set('merge_request[source_branch]', input.sourceBranch);
    mergeRequestUrl.searchParams.set('merge_request[target_branch]', input.targetBranch);
    mergeRequestUrl.searchParams.set('merge_request[title]', input.title);
    mergeRequestUrl.searchParams.set('merge_request[description]', input.description);

    return { url: mergeRequestUrl.toString() };
  }
}
