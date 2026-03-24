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
exports.promoteBranch = promoteBranch;
const vscode = __importStar(require("vscode"));
const actionResolver_1 = require("../core/actionResolver");
const gitService_1 = require("../git/gitService");
const prompts_1 = require("../ui/prompts");
const shared_1 = require("./shared");
async function promoteBranch() {
    try {
        const { policy, currentBranch, branchType } = await (0, shared_1.getValidatedWorkflowState)();
        (0, shared_1.ensureActionAllowed)('promoteBranch', currentBranch, branchType, policy);
        await gitService_1.GitService.fetch(policy.provider.remoteName);
        const promotionTargets = actionResolver_1.ActionResolver.getPromotionTargets(currentBranch, policy);
        const targetBranch = await (0, prompts_1.pickPromotionTarget)(currentBranch, promotionTargets);
        if (!targetBranch) {
            return;
        }
        if (!actionResolver_1.ActionResolver.isPromotionPairAllowed(currentBranch, targetBranch, policy.promotion)) {
            throw new Error(`Promotion from "${currentBranch}" to "${targetBranch}" is not allowed.`);
        }
        const selectedMode = await (0, shared_1.resolveExecutionMode)(policy.promotion.mode, `Choose how to promote ${currentBranch} to ${targetBranch}`);
        if (!selectedMode) {
            return;
        }
        const comparison = await gitService_1.GitService.getAheadBehind(targetBranch, currentBranch);
        if (comparison.ahead === 0) {
            await vscode.window.showInformationMessage(`No new commits are available to promote from "${currentBranch}" to "${targetBranch}".`);
            return;
        }
        if (selectedMode === 'direct') {
            await (0, shared_1.ensureCleanWorkingTree)();
            await gitService_1.GitService.checkoutBranch(targetBranch);
            await gitService_1.GitService.mergeIntoCurrent(currentBranch);
            await vscode.window.showInformationMessage(`Promoted "${currentBranch}" into "${targetBranch}".`);
            return;
        }
        const result = await (0, shared_1.createPromotionRequest)(policy, {
            sourceBranch: currentBranch,
            targetBranch,
            title: `Promote ${currentBranch} -> ${targetBranch}`,
            description: `Promote ${currentBranch} into ${targetBranch}.`
        });
        await (0, shared_1.showPromotionRequestResult)(`Promotion request ready for "${currentBranch}" -> "${targetBranch}".`, result);
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not promote the branch');
    }
}
//# sourceMappingURL=promoteBranch.js.map