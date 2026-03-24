"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLabProvider = void 0;
const provider_1 = require("./provider");
class GitLabProvider {
    constructor(remoteUrl) {
        this.remoteUrl = remoteUrl;
    }
    async createPromotionRequest(input) {
        const mergeRequestUrl = new URL(`${(0, provider_1.remoteUrlToWebUrl)(this.remoteUrl)}/-/merge_requests/new`);
        mergeRequestUrl.searchParams.set('merge_request[source_branch]', input.sourceBranch);
        mergeRequestUrl.searchParams.set('merge_request[target_branch]', input.targetBranch);
        mergeRequestUrl.searchParams.set('merge_request[title]', input.title);
        mergeRequestUrl.searchParams.set('merge_request[description]', input.description);
        return { url: mergeRequestUrl.toString() };
    }
}
exports.GitLabProvider = GitLabProvider;
//# sourceMappingURL=gitlabProvider.js.map