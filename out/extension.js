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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const finishFeature_1 = require("./commands/finishFeature");
const finishHotfix_1 = require("./commands/finishHotfix");
const finishRelease_1 = require("./commands/finishRelease");
const initializeProject_1 = require("./commands/initializeProject");
const promoteBranch_1 = require("./commands/promoteBranch");
const reloadPolicy_1 = require("./commands/reloadPolicy");
const showCurrentState_1 = require("./commands/showCurrentState");
const startFeature_1 = require("./commands/startFeature");
const startHotfix_1 = require("./commands/startHotfix");
const startRelease_1 = require("./commands/startRelease");
function activate(context) {
    console.log('BranchFlow extension activated');
    context.subscriptions.push(vscode.commands.registerCommand('branchflow.initializeProject', () => (0, initializeProject_1.initializeProject)()), vscode.commands.registerCommand('branchflow.reloadPolicy', () => (0, reloadPolicy_1.reloadPolicy)()), vscode.commands.registerCommand('branchflow.showCurrentState', () => (0, showCurrentState_1.showCurrentState)()), vscode.commands.registerCommand('branchflow.startFeature', () => (0, startFeature_1.startFeature)(context)), vscode.commands.registerCommand('branchflow.finishFeature', () => (0, finishFeature_1.finishFeature)(context)), vscode.commands.registerCommand('branchflow.startRelease', () => (0, startRelease_1.startRelease)(context)), vscode.commands.registerCommand('branchflow.finishRelease', () => (0, finishRelease_1.finishRelease)(context)), vscode.commands.registerCommand('branchflow.startHotfix', () => (0, startHotfix_1.startHotfix)(context)), vscode.commands.registerCommand('branchflow.finishHotfix', () => (0, finishHotfix_1.finishHotfix)(context)), vscode.commands.registerCommand('branchflow.promoteBranch', () => (0, promoteBranch_1.promoteBranch)()));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map