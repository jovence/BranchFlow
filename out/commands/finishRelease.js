"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishRelease = finishRelease;
const shared_1 = require("./shared");
async function finishRelease(context) {
    try {
        await (0, shared_1.runFinishWorkflowBranch)(context, 'release', 'finishRelease');
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not finish the release');
    }
}
//# sourceMappingURL=finishRelease.js.map