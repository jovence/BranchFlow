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
exports.showCurrentState = showCurrentState;
const vscode = __importStar(require("vscode"));
const actionResolver_1 = require("../core/actionResolver");
const branchClassifier_1 = require("../core/branchClassifier");
const policyLoader_1 = require("../core/policyLoader");
const policyValidator_1 = require("../core/policyValidator");
const gitService_1 = require("../git/gitService");
const providerDetector_1 = require("../providers/providerDetector");
const shared_1 = require("./shared");
const stateFormatter_1 = require("../ui/stateFormatter");
const outputChannel = vscode.window.createOutputChannel('BranchFlow');
async function showCurrentState() {
    outputChannel.clear();
    try {
        const workspaceFolder = (0, shared_1.requireWorkspaceFolder)();
        const isGitRepo = await gitService_1.GitService.isGitRepo();
        const summary = {
            workspacePath: workspaceFolder.uri.fsPath,
            gitRepository: isGitRepo,
            policyPath: policyLoader_1.PolicyLoader.getPolicyPath() ?? undefined,
            policyStatus: 'Not loaded',
            availableActions: ['reloadPolicy', 'showCurrentState']
        };
        if (!isGitRepo) {
            summary.policyStatus = 'Unavailable because the workspace is not a Git repository';
            outputChannel.appendLine(stateFormatter_1.StateFormatter.format(summary));
            outputChannel.show(true);
            await vscode.window.showErrorMessage('BranchFlow only works inside a Git repository.');
            return;
        }
        const currentBranch = await gitService_1.GitService.getCurrentBranch();
        const isWorkingTreeClean = await gitService_1.GitService.isWorkingTreeClean();
        const policyExists = policyLoader_1.PolicyLoader.policyExists();
        let branchType;
        let validationErrors = [];
        let availableActions = ['reloadPolicy', 'showCurrentState'];
        let provider = 'Unavailable';
        summary.currentBranch = currentBranch;
        summary.workingTreeClean = isWorkingTreeClean;
        if (policyExists) {
            try {
                const policy = policyLoader_1.PolicyLoader.loadPolicy();
                branchType = branchClassifier_1.BranchClassifier.classify(currentBranch, policy);
                validationErrors = policyValidator_1.PolicyValidator.validate(policy);
                availableActions =
                    validationErrors.length === 0
                        ? actionResolver_1.ActionResolver.getAvailableActions(currentBranch, branchType, policy)
                        : ['reloadPolicy', 'showCurrentState'];
                try {
                    const remoteUrl = await gitService_1.GitService.getRemoteUrl(policy.provider.remoteName);
                    provider = providerDetector_1.ProviderDetector.detectProvider(policy, remoteUrl);
                }
                catch {
                    provider =
                        policy.provider.type === 'auto' ? 'auto (remote unresolved)' : policy.provider.type;
                }
                summary.branchType = branchType;
                summary.isProtected = branchType === 'protected';
                summary.remoteName = policy.provider.remoteName;
                summary.provider = provider;
                summary.policyStatus = validationErrors.length === 0 ? 'Valid' : 'Invalid';
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown policy loading error.';
                summary.policyStatus = `Invalid (${message})`;
            }
        }
        else {
            summary.policyStatus = 'Missing';
            availableActions = ['initializeProject', 'reloadPolicy', 'showCurrentState'];
        }
        summary.branchType = summary.branchType ?? branchType;
        summary.isProtected = summary.isProtected ?? branchType === 'protected';
        summary.availableActions = availableActions;
        summary.validationErrors = validationErrors.length > 0 ? validationErrors : undefined;
        outputChannel.appendLine(stateFormatter_1.StateFormatter.format(summary));
        outputChannel.show(true);
        if (validationErrors.length > 0) {
            await vscode.window.showWarningMessage(`BranchFlow: ${currentBranch} (${branchType ?? 'unknown'}) with policy warnings.`);
            return;
        }
        await vscode.window.showInformationMessage(`BranchFlow: ${currentBranch} (${branchType ?? 'unknown'})`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error while reading state.';
        outputChannel.appendLine(`BranchFlow failed: ${message}`);
        outputChannel.show(true);
        await vscode.window.showErrorMessage(`BranchFlow failed: ${message}`);
    }
}
//# sourceMappingURL=showCurrentState.js.map