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
exports.requireWorkspaceFolder = requireWorkspaceFolder;
exports.ensureGitRepository = ensureGitRepository;
exports.loadValidatedPolicy = loadValidatedPolicy;
exports.getValidatedWorkflowState = getValidatedWorkflowState;
exports.ensureActionAllowed = ensureActionAllowed;
exports.ensureCleanWorkingTree = ensureCleanWorkingTree;
exports.resolveExecutionMode = resolveExecutionMode;
exports.createPromotionRequest = createPromotionRequest;
exports.showPromotionRequestResult = showPromotionRequestResult;
exports.runStartWorkflowBranch = runStartWorkflowBranch;
exports.runFinishWorkflowBranch = runFinishWorkflowBranch;
exports.showCommandError = showCommandError;
const vscode = __importStar(require("vscode"));
const branchMetadataStore_1 = require("../storage/branchMetadataStore");
const actionResolver_1 = require("../core/actionResolver");
const branchClassifier_1 = require("../core/branchClassifier");
const policyLoader_1 = require("../core/policyLoader");
const policyValidator_1 = require("../core/policyValidator");
const gitService_1 = require("../git/gitService");
const providerDetector_1 = require("../providers/providerDetector");
const action_1 = require("../types/action");
const prompts_1 = require("../ui/prompts");
function requireWorkspaceFolder() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        throw new Error('BranchFlow needs an open workspace folder.');
    }
    return workspaceFolder;
}
async function ensureGitRepository() {
    requireWorkspaceFolder();
    if (!(await gitService_1.GitService.isGitRepo())) {
        throw new Error('BranchFlow only works inside a Git repository.');
    }
}
function loadValidatedPolicy() {
    const policy = policyLoader_1.PolicyLoader.loadPolicy();
    const validationErrors = policyValidator_1.PolicyValidator.validate(policy);
    if (validationErrors.length > 0) {
        throw new Error(`Policy validation failed:\n- ${validationErrors.join('\n- ')}`);
    }
    return policy;
}
async function getValidatedWorkflowState() {
    await ensureGitRepository();
    const policy = loadValidatedPolicy();
    const currentBranch = await gitService_1.GitService.getCurrentBranch();
    const branchType = branchClassifier_1.BranchClassifier.classify(currentBranch, policy);
    return { policy, currentBranch, branchType };
}
function ensureActionAllowed(action, currentBranch, branchType, policy) {
    const availableActions = actionResolver_1.ActionResolver.getAvailableActions(currentBranch, branchType, policy);
    if (!availableActions.includes(action)) {
        throw new Error(`${action_1.BRANCH_FLOW_ACTION_TITLES[action]} is not allowed from branch "${currentBranch}" (${branchType}).`);
    }
}
async function ensureCleanWorkingTree() {
    if (!(await gitService_1.GitService.isWorkingTreeClean())) {
        throw new Error('BranchFlow requires a clean working tree for this action.');
    }
}
async function resolveExecutionMode(mode, placeHolder) {
    if (mode === 'direct' || mode === 'merge-request') {
        return mode;
    }
    const selectedMode = await (0, prompts_1.promptForModeChoice)(placeHolder);
    if (selectedMode !== 'direct' && selectedMode !== 'merge-request') {
        return undefined;
    }
    return selectedMode;
}
async function createPromotionRequest(policy, input) {
    const remoteUrl = await gitService_1.GitService.getRemoteUrl(policy.provider.remoteName);
    const provider = providerDetector_1.ProviderDetector.createProvider(policy, remoteUrl);
    return provider.createPromotionRequest(input);
}
async function showPromotionRequestResult(message, result) {
    if (!result.url) {
        await vscode.window.showInformationMessage(message);
        return;
    }
    const openChoice = await vscode.window.showInformationMessage(message, 'Open');
    if (openChoice === 'Open') {
        await vscode.env.openExternal(vscode.Uri.parse(result.url));
    }
}
async function runStartWorkflowBranch(context, kind, action, promptForName) {
    const { policy, currentBranch, branchType } = await getValidatedWorkflowState();
    ensureActionAllowed(action, currentBranch, branchType, policy);
    await ensureCleanWorkingTree();
    const branchSuffix = await promptForName();
    if (!branchSuffix) {
        return;
    }
    const branchName = `${policy.prefixes[kind]}${branchSuffix}`;
    if (await gitService_1.GitService.branchExists(branchName)) {
        throw new Error(`Branch "${branchName}" already exists.`);
    }
    await gitService_1.GitService.checkoutNewBranch(branchName);
    await branchMetadataStore_1.BranchMetadataStore.saveMetadata(context, {
        branchName,
        kind,
        baseBranch: currentBranch,
        createdAt: new Date().toISOString()
    });
    await vscode.window.showInformationMessage(`Created ${kind} branch "${branchName}" from "${currentBranch}".`);
}
async function runFinishWorkflowBranch(context, kind, action) {
    const { policy, currentBranch, branchType } = await getValidatedWorkflowState();
    if (branchType !== kind) {
        throw new Error(`${action_1.BRANCH_FLOW_ACTION_TITLES[action]} only works while you are on a ${kind} branch.`);
    }
    ensureActionAllowed(action, currentBranch, branchType, policy);
    await ensureCleanWorkingTree();
    const metadata = await branchMetadataStore_1.BranchMetadataStore.getMetadata(context, currentBranch);
    if (!metadata || metadata.kind !== kind) {
        throw new Error(`BranchFlow could not find stored metadata for "${currentBranch}". Finish commands require the remembered base branch.`);
    }
    const baseBranch = metadata.baseBranch;
    const finishConfig = policy[kind].finish;
    const selectedMode = await resolveExecutionMode(finishConfig.mode, `Choose how to finish ${currentBranch}`);
    if (!selectedMode) {
        return;
    }
    if (selectedMode === 'direct') {
        await gitService_1.GitService.checkoutBranch(baseBranch);
        await gitService_1.GitService.mergeIntoCurrent(currentBranch);
        if (finishConfig.deleteBranchAfterFinish) {
            await gitService_1.GitService.deleteBranch(currentBranch);
        }
        await branchMetadataStore_1.BranchMetadataStore.deleteMetadata(context, currentBranch);
        await vscode.window.showInformationMessage(`Merged "${currentBranch}" into "${baseBranch}".`);
        return;
    }
    const result = await createPromotionRequest(policy, {
        sourceBranch: currentBranch,
        targetBranch: baseBranch,
        title: `Finish ${kind}: ${currentBranch} -> ${baseBranch}`,
        description: `Finish ${kind} branch ${currentBranch} into ${baseBranch}.`
    });
    if (finishConfig.switchBackToBase || finishConfig.deleteBranchAfterFinish) {
        await gitService_1.GitService.checkoutBranch(baseBranch);
    }
    if (finishConfig.deleteBranchAfterFinish) {
        await gitService_1.GitService.deleteBranch(currentBranch);
        await branchMetadataStore_1.BranchMetadataStore.deleteMetadata(context, currentBranch);
    }
    await showPromotionRequestResult(`${capitalize(kind)} request ready for "${currentBranch}" -> "${baseBranch}".`, result);
}
async function showCommandError(error, prefix) {
    const message = error instanceof Error ? error.message.replace(/\n+/g, ' ') : 'Unexpected error.';
    await vscode.window.showErrorMessage(`${prefix}: ${message}`);
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
//# sourceMappingURL=shared.js.map