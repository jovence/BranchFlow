"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRelease = startRelease;
const prompts_1 = require("../ui/prompts");
const shared_1 = require("./shared");
async function startRelease(context) {
    try {
        await (0, shared_1.runStartWorkflowBranch)(context, 'release', 'startRelease', prompts_1.promptForReleaseName);
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not start the release');
    }
}
//# sourceMappingURL=startRelease.js.map