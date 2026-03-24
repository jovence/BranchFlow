"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class PolicyLoader {
    static getPolicyPath() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return null;
        }
        return path.join(workspaceFolder.uri.fsPath, '.branchflow.json');
    }
    static policyExists() {
        const policyPath = this.getPolicyPath();
        if (!policyPath) {
            return false;
        }
        return fs.existsSync(policyPath);
    }
    static loadPolicy() {
        const policyPath = this.getPolicyPath();
        if (!policyPath) {
            throw new Error('No workspace folder is open.');
        }
        if (!fs.existsSync(policyPath)) {
            throw new Error('No .branchflow.json file found in the repository root.');
        }
        const raw = fs.readFileSync(policyPath, 'utf8');
        try {
            return JSON.parse(raw);
        }
        catch (error) {
            throw new Error('Invalid JSON in .branchflow.json.');
        }
    }
}
exports.PolicyLoader = PolicyLoader;
//# sourceMappingURL=policyLoader.js.map