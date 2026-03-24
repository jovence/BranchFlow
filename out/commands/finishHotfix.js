"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishHotfix = finishHotfix;
const shared_1 = require("./shared");
async function finishHotfix(context) {
    try {
        await (0, shared_1.runFinishWorkflowBranch)(context, 'hotfix', 'finishHotfix');
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not finish the hotfix');
    }
}
//# sourceMappingURL=finishHotfix.js.map