"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchMetadataStore = void 0;
const STORAGE_KEY = 'branchflow.branchMetadata.v1';
class BranchMetadataStore {
    static async saveMetadata(context, metadata) {
        const allMetadata = this.getAllMetadata(context);
        allMetadata[metadata.branchName] = metadata;
        await context.workspaceState.update(STORAGE_KEY, allMetadata);
    }
    static async getMetadata(context, branchName) {
        const allMetadata = this.getAllMetadata(context);
        return allMetadata[branchName];
    }
    static async deleteMetadata(context, branchName) {
        const allMetadata = this.getAllMetadata(context);
        delete allMetadata[branchName];
        await context.workspaceState.update(STORAGE_KEY, allMetadata);
    }
    static async listMetadata(context) {
        return Object.values(this.getAllMetadata(context));
    }
    static getAllMetadata(context) {
        return context.workspaceState.get(STORAGE_KEY, {});
    }
}
exports.BranchMetadataStore = BranchMetadataStore;
//# sourceMappingURL=branchMetadataStore.js.map