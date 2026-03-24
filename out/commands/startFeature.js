"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFeature = startFeature;
const prompts_1 = require("../ui/prompts");
const shared_1 = require("./shared");
async function startFeature(context) {
    try {
        await (0, shared_1.runStartWorkflowBranch)(context, 'feature', 'startFeature', prompts_1.promptForFeatureName);
    }
    catch (error) {
        await (0, shared_1.showCommandError)(error, 'BranchFlow could not start the feature');
    }
}
//# sourceMappingURL=startFeature.js.map