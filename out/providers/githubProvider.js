"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubProvider = void 0;
const provider_1 = require("./provider");
class GitHubProvider {
    constructor(remoteUrl) {
        this.remoteUrl = remoteUrl;
    }
    async createPromotionRequest(input) {
        const compareUrl = new URL(`${(0, provider_1.remoteUrlToWebUrl)(this.remoteUrl)}/compare/${encodeURIComponent(input.targetBranch)}...${encodeURIComponent(input.sourceBranch)}`);
        compareUrl.searchParams.set('expand', '1');
        compareUrl.searchParams.set('title', input.title);
        compareUrl.searchParams.set('body', input.description);
        return { url: compareUrl.toString() };
    }
}
exports.GitHubProvider = GitHubProvider;
//# sourceMappingURL=githubProvider.js.map