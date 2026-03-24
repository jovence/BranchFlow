"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishFeature = finishFeature;
const shared_1 = require("./shared");
async function finishFeature(context) {
    try {
        await (0, shared_1.runFinishWorkflowBranch)(context, 'feature', 'finishFeature');
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not finish the feature');
    }
}
//# sourceMappingURL=finishFeature.js.map