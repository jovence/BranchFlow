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
exports.initializeProject = initializeProject;
const vscode = __importStar(require("vscode"));
const policyLoader_1 = require("../core/policyLoader");
const policyValidator_1 = require("../core/policyValidator");
const prompts_1 = require("../ui/prompts");
const shared_1 = require("./shared");
async function initializeProject() {
    try {
        (0, shared_1.requireWorkspaceFolder)();
        await (0, shared_1.ensureGitRepository)();
        const policyPath = policyLoader_1.PolicyLoader.getPolicyPath();
        if (!policyPath) {
            throw new Error('Could not determine the .branchflow.json path.');
        }
        if (policyLoader_1.PolicyLoader.policyExists()) {
            const shouldOverwrite = await (0, prompts_1.confirmOverwritePolicy)();
            if (!shouldOverwrite) {
                return;
            }
        }
        const providerType = await (0, prompts_1.promptForProviderType)();
        if (!providerType) {
            return;
        }
        const remoteName = await (0, prompts_1.promptForRemoteName)('origin');
        if (!remoteName) {
            return;
        }
        const protectedBranches = await (0, prompts_1.promptForBranchList)('Protected branches (comma-separated)', 'main, prod, beta, staging');
        if (!protectedBranches) {
            return;
        }
        const workingBranches = await (0, prompts_1.promptForBranchList)('Working branches (comma-separated)', 'develop, dev, integration');
        if (!workingBranches) {
            return;
        }
        const featurePrefix = await (0, prompts_1.promptForPrefix)('feature', 'feature/');
        if (!featurePrefix) {
            return;
        }
        const releasePrefix = await (0, prompts_1.promptForPrefix)('release', 'release/');
        if (!releasePrefix) {
            return;
        }
        const hotfixPrefix = await (0, prompts_1.promptForPrefix)('hotfix', 'hotfix/');
        if (!hotfixPrefix) {
            return;
        }
        const featureMode = await (0, prompts_1.promptForModeChoice)('Choose the default feature finish mode', true, 'merge-request');
        if (!featureMode) {
            return;
        }
        const releaseMode = await (0, prompts_1.promptForModeChoice)('Choose the default release finish mode', true, 'merge-request');
        if (!releaseMode) {
            return;
        }
        const hotfixMode = await (0, prompts_1.promptForModeChoice)('Choose the default hotfix finish mode', true, 'merge-request');
        if (!hotfixMode) {
            return;
        }
        const promotionFlow = await (0, prompts_1.promptForBranchList)('Promotion flow (comma-separated)', 'develop, beta, prod');
        if (!promotionFlow) {
            return;
        }
        const promotionMode = await (0, prompts_1.promptForModeChoice)('Choose the default promotion mode', true, 'merge-request');
        if (!promotionMode) {
            return;
        }
        const allowSkip = await (0, prompts_1.promptForAllowSkip)(false);
        if (allowSkip === undefined) {
            return;
        }
        const policy = {
            version: 1,
            provider: {
                type: providerType,
                remoteName: remoteName.trim()
            },
            branches: {
                protected: protectedBranches,
                working: workingBranches
            },
            prefixes: {
                feature: featurePrefix,
                release: releasePrefix,
                hotfix: hotfixPrefix
            },
            feature: {
                enabled: true,
                allowedSourceBranchTypes: ['working'],
                allowedSourceBranches: [],
                finish: {
                    mode: featureMode,
                    deleteBranchAfterFinish: true,
                    switchBackToBase: true
                }
            },
            release: {
                enabled: true,
                allowedSourceBranchTypes: ['working'],
                allowedSourceBranches: [],
                finish: {
                    mode: releaseMode,
                    deleteBranchAfterFinish: true,
                    switchBackToBase: true
                }
            },
            hotfix: {
                enabled: true,
                allowedSourceBranchTypes: [],
                allowedSourceBranches: protectedBranches.slice(0, Math.min(protectedBranches.length, 2)),
                finish: {
                    mode: hotfixMode,
                    deleteBranchAfterFinish: true,
                    switchBackToBase: true
                }
            },
            promotion: {
                enabled: true,
                flow: promotionFlow,
                mode: promotionMode,
                allowSkip
            },
            ui: {
                showDebugInfo: false
            }
        };
        const validationErrors = policyValidator_1.PolicyValidator.validate(policy);
        if (validationErrors.length > 0) {
            throw new Error(`Generated policy is invalid: ${validationErrors.join(' ')}`);
        }
        await vscode.workspace.fs.writeFile(vscode.Uri.file(policyPath), Buffer.from(`${JSON.stringify(policy, null, 2)}\n`, 'utf8'));
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(policyPath));
        await vscode.window.showTextDocument(document);
        await vscode.window.showInformationMessage('BranchFlow initialized .branchflow.json.');
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not initialize the project');
    }
}
//# sourceMappingURL=initializeProject.js.map