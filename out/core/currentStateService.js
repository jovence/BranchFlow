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
exports.CurrentStateService = void 0;
const vscode = __importStar(require("vscode"));
const actionResolver_1 = require("./actionResolver");
const branchClassifier_1 = require("./branchClassifier");
const policyLoader_1 = require("./policyLoader");
const policyValidator_1 = require("./policyValidator");
const gitService_1 = require("../git/gitService");
const providerDetector_1 = require("../providers/providerDetector");
/**
 * Builds a single, reusable snapshot of the current repository and policy state.
 * Both the command-palette diagnostics and the sidebar render from this service.
 */
class CurrentStateService {
    static async resolve() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return {
                gitRepository: false,
                policyStatus: 'No workspace folder is open.',
                availableActions: []
            };
        }
        const isGitRepo = await gitService_1.GitService.isGitRepo();
        const summary = {
            workspacePath: workspaceFolder.uri.fsPath,
            gitRepository: isGitRepo,
            policyPath: policyLoader_1.PolicyLoader.getPolicyPath() ?? undefined,
            policyStatus: 'Not loaded',
            availableActions: ['reloadPolicy', 'showCurrentState']
        };
        if (!isGitRepo) {
            summary.policyStatus = 'Open a Git repository to use BranchFlow.';
            summary.availableActions = ['showCurrentState'];
            return summary;
        }
        const currentBranch = await gitService_1.GitService.getCurrentBranch();
        const isWorkingTreeClean = await gitService_1.GitService.isWorkingTreeClean();
        const policyExists = policyLoader_1.PolicyLoader.policyExists();
        let branchType;
        let validationErrors = [];
        let availableActions = ['reloadPolicy', 'showCurrentState'];
        summary.currentBranch = currentBranch;
        summary.workingTreeClean = isWorkingTreeClean;
        if (!policyExists) {
            summary.policyStatus = 'Missing';
            summary.availableActions = ['initializeProject', 'reloadPolicy', 'showCurrentState'];
            return summary;
        }
        try {
            const policy = policyLoader_1.PolicyLoader.loadPolicy();
            branchType = branchClassifier_1.BranchClassifier.classify(currentBranch, policy);
            validationErrors = policyValidator_1.PolicyValidator.validate(policy);
            availableActions =
                validationErrors.length === 0
                    ? actionResolver_1.ActionResolver.getAvailableActions(currentBranch, branchType, policy)
                    : ['reloadPolicy', 'showCurrentState'];
            summary.branchType = branchType;
            summary.isProtected = branchType === 'protected';
            summary.remoteName = policy.provider.remoteName;
            summary.provider = await this.resolveProviderLabel(policy.provider.type, policy.provider.remoteName);
            summary.policyStatus = validationErrors.length === 0 ? 'Valid' : 'Invalid';
            summary.availableActions = availableActions;
            summary.validationErrors = validationErrors.length > 0 ? validationErrors : undefined;
            return summary;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown policy loading error.';
            summary.branchType = branchType;
            summary.isProtected = branchType === 'protected';
            summary.policyStatus = `Invalid (${message})`;
            summary.availableActions = availableActions;
            summary.validationErrors = validationErrors.length > 0 ? validationErrors : undefined;
            return summary;
        }
    }
    static async resolveProviderLabel(providerType, remoteName) {
        try {
            const remoteUrl = await gitService_1.GitService.getRemoteUrl(remoteName);
            return providerDetector_1.ProviderDetector.detectProviderType(providerType, remoteUrl);
        }
        catch {
            return providerType === 'auto' ? 'auto (remote unresolved)' : providerType;
        }
    }
}
exports.CurrentStateService = CurrentStateService;
//# sourceMappingURL=currentStateService.js.map