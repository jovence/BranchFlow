"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHotfix = startHotfix;
const prompts_1 = require("../ui/prompts");
const shared_1 = require("./shared");
async function startHotfix(context) {
    try {
        await (0, shared_1.runStartWorkflowBranch)(context, 'hotfix', 'startHotfix', prompts_1.promptForHotfixName);
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not start the hotfix');
    }
}
//# sourceMappingURL=startHotfix.js.map