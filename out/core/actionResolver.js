"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionResolver = void 0;
class ActionResolver {
    static getAvailableActions(currentBranch, branchType, policy) {
        const actions = ['reloadPolicy', 'showCurrentState'];
        if (this.canStartFeature(currentBranch, branchType, policy)) {
            actions.push('startFeature');
        }
        if (this.canStartRelease(currentBranch, branchType, policy)) {
            actions.push('startRelease');
        }
        if (this.canStartHotfix(currentBranch, branchType, policy)) {
            actions.push('startHotfix');
        }
        if (branchType === 'feature' && policy.feature.enabled) {
            actions.push('finishFeature');
        }
        if (branchType === 'release' && policy.release.enabled) {
            actions.push('finishRelease');
        }
        if (branchType === 'hotfix' && policy.hotfix.enabled) {
            actions.push('finishHotfix');
        }
        if (this.canPromote(currentBranch, policy)) {
            actions.push('promoteBranch');
        }
        return actions;
    }
    static canStartFeature(currentBranch, branchType, policy) {
        return this.isSourceAllowed(currentBranch, branchType, policy.feature);
    }
    static canStartRelease(currentBranch, branchType, policy) {
        return this.isSourceAllowed(currentBranch, branchType, policy.release);
    }
    static canStartHotfix(currentBranch, branchType, policy) {
        return this.isSourceAllowed(currentBranch, branchType, policy.hotfix);
    }
    static canPromote(currentBranch, policy) {
        return policy.promotion.enabled && policy.promotion.flow.includes(currentBranch);
    }
    static getPromotionTargets(currentBranch, policy) {
        if (!this.canPromote(currentBranch, policy)) {
            return [];
        }
        const currentIndex = policy.promotion.flow.indexOf(currentBranch);
        if (currentIndex === -1 || currentIndex === policy.promotion.flow.length - 1) {
            return [];
        }
        if (!policy.promotion.allowSkip) {
            return [policy.promotion.flow[currentIndex + 1]];
        }
        return policy.promotion.flow.slice(currentIndex + 1);
    }
    static isPromotionPairAllowed(sourceBranch, targetBranch, promotion) {
        if (!promotion.enabled) {
            return false;
        }
        const sourceIndex = promotion.flow.indexOf(sourceBranch);
        const targetIndex = promotion.flow.indexOf(targetBranch);
        if (sourceIndex === -1 || targetIndex === -1 || targetIndex <= sourceIndex) {
            return false;
        }
        if (!promotion.allowSkip) {
            return targetIndex === sourceIndex + 1;
        }
        return true;
    }
    static isSourceAllowed(currentBranch, branchType, config) {
        if (!config.enabled) {
            return false;
        }
        return (config.allowedSourceBranches.includes(currentBranch) ||
            config.allowedSourceBranchTypes.includes(branchType));
    }
}
exports.ActionResolver = ActionResolver;
//# sourceMappingURL=actionResolver.js.map