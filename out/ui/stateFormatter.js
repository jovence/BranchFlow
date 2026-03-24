"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateFormatter = void 0;
const action_1 = require("../types/action");
class StateFormatter {
    static format(summary) {
        const lines = ['BranchFlow Current State', ''];
        if (summary.workspacePath) {
            lines.push(`Workspace: ${summary.workspacePath}`);
        }
        lines.push(`Git repository: ${summary.gitRepository ? 'yes' : 'no'}`);
        if (summary.currentBranch) {
            lines.push(`Current branch: ${summary.currentBranch}`);
        }
        if (summary.branchType) {
            lines.push(`Branch type: ${summary.branchType}`);
        }
        if (summary.isProtected !== undefined) {
            lines.push(`Protected branch: ${summary.isProtected ? 'yes' : 'no'}`);
        }
        if (summary.workingTreeClean !== undefined) {
            lines.push(`Working tree: ${summary.workingTreeClean ? 'clean' : 'has uncommitted changes'}`);
        }
        if (summary.provider) {
            lines.push(`Provider: ${summary.provider}`);
        }
        if (summary.remoteName) {
            lines.push(`Remote: ${summary.remoteName}`);
        }
        if (summary.policyPath) {
            lines.push(`Policy file: ${summary.policyPath}`);
        }
        lines.push(`Policy status: ${summary.policyStatus}`);
        lines.push('');
        lines.push('Available actions:');
        if (summary.availableActions.length === 0) {
            lines.push('- None');
        }
        else {
            for (const action of summary.availableActions) {
                lines.push(`- ${this.getActionLabel(action)}`);
            }
        }
        if (summary.validationErrors && summary.validationErrors.length > 0) {
            lines.push('');
            lines.push('Policy validation errors:');
            for (const validationError of summary.validationErrors) {
                lines.push(`- ${validationError}`);
            }
        }
        return lines.join('\n');
    }
    static getActionLabel(action) {
        return action_1.BRANCH_FLOW_ACTION_TITLES[action];
    }
}
exports.StateFormatter = StateFormatter;
//# sourceMappingURL=stateFormatter.js.map