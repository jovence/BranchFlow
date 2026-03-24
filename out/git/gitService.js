"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
class GitService {
    static getWorkspacePath() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder is open.');
        }
        return workspaceFolder.uri.fsPath;
    }
    static runGitCommand(args) {
        const workspacePath = this.getWorkspacePath();
        return new Promise((resolve, reject) => {
            (0, child_process_1.execFile)('git', args, { cwd: workspacePath }, (error, stdout, stderr) => {
                if (error) {
                    const details = [stderr.trim(), stdout.trim(), error.message]
                        .filter((value) => value.length > 0)
                        .join(' ');
                    reject(new Error(details));
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }
    static async isGitRepo() {
        try {
            await this.runGitCommand(['rev-parse', '--is-inside-work-tree']);
            return true;
        }
        catch {
            return false;
        }
    }
    static async getCurrentBranch() {
        const branchName = await this.runGitCommand(['branch', '--show-current']);
        if (branchName.length === 0) {
            throw new Error('Could not determine the current branch.');
        }
        return branchName;
    }
    static async isWorkingTreeClean() {
        const output = await this.runGitCommand(['status', '--porcelain']);
        return output.length === 0;
    }
    static async checkoutNewBranch(branchName) {
        await this.runGitCommand(['checkout', '-b', branchName]);
    }
    static async checkoutBranch(branchName) {
        await this.runGitCommand(['checkout', branchName]);
    }
    static async branchExists(branchName) {
        try {
            await this.runGitCommand(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`]);
            return true;
        }
        catch {
            return false;
        }
    }
    static async deleteBranch(branchName) {
        await this.runGitCommand(['branch', '-D', branchName]);
    }
    static async mergeIntoCurrent(sourceBranch) {
        await this.runGitCommand(['merge', '--no-ff', sourceBranch]);
    }
    static async fetch(remoteName) {
        await this.runGitCommand(['fetch', remoteName]);
    }
    static async getAheadBehind(target, source) {
        const output = await this.runGitCommand([
            'rev-list',
            '--left-right',
            '--count',
            `${target}...${source}`
        ]);
        const [behindRaw, aheadRaw] = output.split(/\s+/);
        const ahead = Number(aheadRaw);
        const behind = Number(behindRaw);
        if (Number.isNaN(ahead) || Number.isNaN(behind)) {
            throw new Error('Unable to compare branches for promotion.');
        }
        return { ahead, behind };
    }
    static async getRemoteUrl(remoteName) {
        return this.runGitCommand(['remote', 'get-url', remoteName]);
    }
}
exports.GitService = GitService;
//# sourceMappingURL=gitService.js.map