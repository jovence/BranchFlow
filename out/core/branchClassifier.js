"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchClassifier = void 0;
class BranchClassifier {
    static classify(branchName, policy) {
        if (policy.branches.protected.includes(branchName)) {
            return 'protected';
        }
        if (policy.branches.working.includes(branchName)) {
            return 'working';
        }
        if (branchName.startsWith(policy.prefixes.feature)) {
            return 'feature';
        }
        if (branchName.startsWith(policy.prefixes.release)) {
            return 'release';
        }
        if (branchName.startsWith(policy.prefixes.hotfix)) {
            return 'hotfix';
        }
        return 'unknown';
    }
}
exports.BranchClassifier = BranchClassifier;
//# sourceMappingURL=branchClassifier.js.map