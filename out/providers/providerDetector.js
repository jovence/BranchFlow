"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderDetector = void 0;
const githubProvider_1 = require("./githubProvider");
const gitlabProvider_1 = require("./gitlabProvider");
class ProviderDetector {
    static detectProvider(policy, remoteUrl) {
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
    static createProvider(policy, remoteUrl) {
        const providerType = this.detectProvider(policy, remoteUrl);
        if (providerType === 'github') {
            return new githubProvider_1.GitHubProvider(remoteUrl);
        }
        return new gitlabProvider_1.GitLabProvider(remoteUrl);
    }
}
exports.ProviderDetector = ProviderDetector;
//# sourceMappingURL=providerDetector.js.map