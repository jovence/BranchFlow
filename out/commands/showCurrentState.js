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
const currentStateService_1 = require("../core/currentStateService");
const stateFormatter_1 = require("../ui/stateFormatter");
const outputChannel = vscode.window.createOutputChannel('BranchFlow');
async function showCurrentState() {
    outputChannel.clear();
    try {
        const summary = await currentStateService_1.CurrentStateService.resolve();
        outputChannel.appendLine(stateFormatter_1.StateFormatter.format(summary));
        outputChannel.show(true);
        if (!summary.workspacePath) {
            await vscode.window.showErrorMessage('BranchFlow needs an open workspace folder.');
            return;
        }
        if (!summary.gitRepository) {
            await vscode.window.showErrorMessage('BranchFlow only works inside a Git repository.');
            return;
        }
        if (summary.validationErrors && summary.validationErrors.length > 0) {
            await vscode.window.showWarningMessage(`BranchFlow: ${summary.currentBranch ?? 'unknown'} (${summary.branchType ?? 'unknown'}) with policy warnings.`);
            return;
        }
        await vscode.window.showInformationMessage(`BranchFlow: ${summary.currentBranch ?? 'unknown'} (${summary.branchType ?? 'unknown'})`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error while reading state.';
        outputChannel.appendLine(`BranchFlow failed: ${message}`);
        outputChannel.show(true);
        await vscode.window.showErrorMessage(`BranchFlow failed: ${message}`);
    }
}
//# sourceMappingURL=showCurrentState.js.map