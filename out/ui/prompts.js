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
exports.normalizeBranchNameSegment = normalizeBranchNameSegment;
exports.promptForFeatureName = promptForFeatureName;
exports.promptForReleaseName = promptForReleaseName;
exports.promptForHotfixName = promptForHotfixName;
exports.promptForModeChoice = promptForModeChoice;
exports.pickPromotionTarget = pickPromotionTarget;
exports.promptForProviderType = promptForProviderType;
exports.promptForRemoteName = promptForRemoteName;
exports.promptForBranchList = promptForBranchList;
exports.promptForPrefix = promptForPrefix;
exports.promptForAllowSkip = promptForAllowSkip;
exports.confirmOverwritePolicy = confirmOverwritePolicy;
const vscode = __importStar(require("vscode"));
function normalizeBranchNameSegment(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9._/-]+/g, '-')
        .replace(/\/{2,}/g, '/')
        .replace(/-+/g, '-')
        .replace(/^[-/.]+|[-/.]+$/g, '');
}
async function promptForFeatureName() {
    return promptForBranchName('feature', 'search-refactor');
}
async function promptForReleaseName() {
    return promptForBranchName('release', '1.8.0');
}
async function promptForHotfixName() {
    return promptForBranchName('hotfix', 'payment-timeout');
}
async function promptForModeChoice(placeHolder = 'Choose how BranchFlow should continue', includeAsk = false, defaultMode = 'merge-request') {
    const modes = includeAsk
        ? [defaultMode, ...['direct', 'merge-request', 'ask'].filter((mode) => mode !== defaultMode)]
        : [defaultMode, ...['direct', 'merge-request'].filter((mode) => mode !== defaultMode)];
    const selected = await vscode.window.showQuickPick(modes.map((mode) => ({
        label: formatModeLabel(mode),
        description: mode === 'direct'
            ? 'Merge locally'
            : mode === 'merge-request'
                ? 'Open a PR/MR in the provider'
                : 'Ask each time',
        value: mode
    })), { placeHolder });
    return selected?.value;
}
async function pickPromotionTarget(sourceBranch, targets) {
    if (targets.length === 0) {
        return undefined;
    }
    if (targets.length === 1) {
        return targets[0];
    }
    const selected = await vscode.window.showQuickPick(targets.map((target) => ({
        label: `${sourceBranch} -> ${target}`,
        value: target
    })), { placeHolder: 'Choose a promotion target branch' });
    return selected?.value;
}
async function promptForProviderType() {
    const selected = await vscode.window.showQuickPick([
        { label: 'GitLab', value: 'gitlab', description: 'Create merge requests in GitLab' },
        { label: 'GitHub', value: 'github', description: 'Create pull requests in GitHub' },
        { label: 'Auto', value: 'auto', description: 'Detect from the remote URL' }
    ], { placeHolder: 'Choose the repository provider for this project' });
    return selected?.value;
}
async function promptForRemoteName(defaultValue = 'origin') {
    return vscode.window.showInputBox({
        prompt: 'Remote name used for provider operations',
        placeHolder: defaultValue,
        value: defaultValue,
        validateInput: (value) => value.trim().length === 0 ? 'Remote name cannot be empty.' : undefined
    });
}
async function promptForBranchList(prompt, defaultValue) {
    const rawValue = await vscode.window.showInputBox({
        prompt,
        placeHolder: defaultValue,
        value: defaultValue,
        validateInput: (value) => value
            .split(',')
            .map((item) => item.trim())
            .some((item) => item.length === 0)
            ? 'Enter a comma-separated list without empty items.'
            : undefined
    });
    if (rawValue === undefined) {
        return undefined;
    }
    return rawValue
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
async function promptForPrefix(branchKind, defaultValue) {
    return vscode.window.showInputBox({
        prompt: `Branch prefix for ${branchKind} branches`,
        placeHolder: defaultValue,
        value: defaultValue,
        validateInput: (value) => value.trim().length === 0 ? 'Branch prefix cannot be empty.' : undefined
    });
}
async function promptForAllowSkip(defaultValue = false) {
    const selected = await vscode.window.showQuickPick([
        {
            label: defaultValue ? 'Yes' : 'No',
            value: defaultValue,
            description: defaultValue
                ? 'Allow skipping intermediate promotion branches'
                : 'Only allow adjacent promotion branches'
        },
        {
            label: defaultValue ? 'No' : 'Yes',
            value: !defaultValue,
            description: defaultValue
                ? 'Only allow adjacent promotion branches'
                : 'Allow skipping intermediate promotion branches'
        }
    ], { placeHolder: 'Allow branch promotions to skip intermediate branches?' });
    return selected?.value;
}
async function confirmOverwritePolicy() {
    const overwrite = await vscode.window.showWarningMessage('.branchflow.json already exists. Do you want to overwrite it?', { modal: true }, 'Overwrite');
    return overwrite === 'Overwrite';
}
function formatModeLabel(mode) {
    if (mode === 'merge-request') {
        return 'Merge Request / Pull Request';
    }
    return mode.charAt(0).toUpperCase() + mode.slice(1);
}
async function promptForBranchName(branchKind, exampleValue) {
    const rawValue = await vscode.window.showInputBox({
        prompt: `Enter a ${branchKind} name`,
        placeHolder: exampleValue,
        validateInput: (value) => {
            const normalized = normalizeBranchNameSegment(value);
            return normalized.length === 0
                ? `Enter a valid ${branchKind} name.`
                : undefined;
        }
    });
    if (rawValue === undefined) {
        return undefined;
    }
    return normalizeBranchNameSegment(rawValue);
}
//# sourceMappingURL=prompts.js.map