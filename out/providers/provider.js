"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteUrlToWebUrl = remoteUrlToWebUrl;
function remoteUrlToWebUrl(remoteUrl) {
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
//# sourceMappingURL=provider.js.map