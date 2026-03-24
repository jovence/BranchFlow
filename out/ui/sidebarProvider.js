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
exports.BranchFlowSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const currentStateService_1 = require("../core/currentStateService");
const action_1 = require("../types/action");
const PRIMARY_ACTIONS = [
    { action: 'initializeProject', caption: 'Create a starter policy for this repo', accent: 'orange' },
    { action: 'startFeature', caption: 'Create a feature branch from an allowed source', accent: 'teal' },
    { action: 'finishFeature', caption: 'Finish the current feature branch safely', accent: 'teal' },
    { action: 'startRelease', caption: 'Cut a release branch from a valid source', accent: 'orange' },
    { action: 'finishRelease', caption: 'Finish the current release branch', accent: 'orange' },
    { action: 'startHotfix', caption: 'Create a hotfix branch from a production branch', accent: 'slate' },
    { action: 'finishHotfix', caption: 'Finish the current hotfix branch', accent: 'slate' },
    { action: 'promoteBranch', caption: 'Promote the current branch forward in the flow', accent: 'teal' }
];
/**
 * Renders the Activity Bar experience for BranchFlow. The webview intentionally
 * presents the workflow state as a small dashboard so the extension feels like a
 * product surface instead of a loose collection of commands.
 */
class BranchFlowSidebarProvider {
    constructor() {
        this.disposables = [];
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(() => this.refresh()), vscode.workspace.onDidSaveTextDocument((document) => {
            if (document.uri.path.endsWith('/.branchflow.json')) {
                this.refresh();
            }
        }), vscode.window.onDidChangeActiveTextEditor(() => this.refresh()), vscode.window.onDidChangeWindowState(() => this.refresh()));
    }
    dispose() {
        while (this.disposables.length > 0) {
            this.disposables.pop()?.dispose();
        }
    }
    async resolveWebviewView(webviewView) {
        this.currentView = webviewView;
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.onDidDispose(() => {
            this.currentView = undefined;
        });
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (!message.command) {
                return;
            }
            await vscode.commands.executeCommand(message.command);
            await this.refresh();
        });
        await this.refresh();
    }
    async refresh() {
        if (!this.currentView) {
            return;
        }
        const state = await currentStateService_1.CurrentStateService.resolve();
        this.currentView.title = 'BranchFlow';
        this.currentView.description = state.currentBranch ?? 'Workflow';
        this.currentView.webview.html = this.render(state);
    }
    render(state) {
        const nonce = getNonce();
        const badges = [
            this.renderBadge(state.policyStatus, this.policyTone(state.policyStatus)),
            this.renderBadge(state.workingTreeClean === undefined
                ? 'Working Tree Unknown'
                : state.workingTreeClean
                    ? 'Working Tree Clean'
                    : 'Working Tree Dirty', state.workingTreeClean === undefined
                ? 'slate'
                : state.workingTreeClean
                    ? 'teal'
                    : 'orange'),
            this.renderBadge(state.branchType ? `Type: ${state.branchType}` : 'Type: Unknown', 'slate')
        ].join('');
        const issueBlock = state.validationErrors && state.validationErrors.length > 0
            ? `
          <section class="card issue-card">
            <div class="section-label">Policy Issues</div>
            <h3>BranchFlow found validation problems</h3>
            <ul class="issue-list">
              ${state.validationErrors
                .map((error) => `<li>${escapeHtml(error)}</li>`)
                .join('')}
            </ul>
          </section>
        `
            : '';
        const readyActions = this.renderActionGrid(state.availableActions);
        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <title>BranchFlow</title>
    <style>
      :root {
        --bf-accent-teal: #14b8a6;
        --bf-accent-orange: #f97316;
        --bf-accent-slate: #38bdf8;
        --bf-card-border: rgba(148, 163, 184, 0.16);
        --bf-card-bg: rgba(15, 23, 42, 0.38);
        --bf-card-bg-strong: rgba(15, 23, 42, 0.58);
        --bf-text: var(--vscode-sideBar-foreground);
        --bf-muted: var(--vscode-descriptionForeground);
        --bf-border: var(--vscode-panel-border);
        --bf-button-bg: rgba(255, 255, 255, 0.04);
        --bf-button-hover: rgba(255, 255, 255, 0.08);
        --bf-shadow: 0 24px 48px rgba(2, 6, 23, 0.32);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--bf-text);
        font-family: "Segoe UI Variable Display", "Aptos", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 36%),
          radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 34%),
          linear-gradient(180deg, rgba(8, 15, 29, 0.92), rgba(15, 23, 42, 0.86)),
          var(--vscode-sideBar-background);
        min-height: 100vh;
      }

      .shell {
        padding: 16px;
        display: grid;
        gap: 14px;
      }

      .hero {
        position: relative;
        overflow: hidden;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(15, 23, 42, 0.84) 48%, rgba(249, 115, 22, 0.18)),
          rgba(15, 23, 42, 0.78);
        box-shadow: var(--bf-shadow);
      }

      .hero::after {
        content: "";
        position: absolute;
        inset: auto -20% -28% 35%;
        height: 160px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(20, 184, 166, 0.18), rgba(249, 115, 22, 0.22));
        filter: blur(18px);
      }

      .hero-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        position: relative;
        z-index: 1;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .mark {
        width: 46px;
        height: 46px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #f8fafc;
        background: linear-gradient(135deg, #14b8a6, #f97316);
        box-shadow: 0 14px 30px rgba(20, 184, 166, 0.24);
      }

      .brand-title {
        margin: 0;
        font-size: 1.12rem;
        font-weight: 700;
      }

      .brand-subtitle {
        margin-top: 3px;
        color: rgba(241, 245, 249, 0.72);
        font-size: 0.82rem;
      }

      .refresh-button {
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.08);
        color: var(--bf-text);
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 0.82rem;
        cursor: pointer;
        transition: background 120ms ease, transform 120ms ease;
      }

      .refresh-button:hover {
        background: rgba(255, 255, 255, 0.14);
        transform: translateY(-1px);
      }

      .hero-branch {
        position: relative;
        z-index: 1;
        margin-top: 18px;
      }

      .eyebrow {
        color: rgba(241, 245, 249, 0.78);
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .branch-name {
        margin: 8px 0 0;
        font-size: 1.6rem;
        line-height: 1.08;
        font-weight: 760;
      }

      .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.76rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.06);
      }

      .badge.teal {
        background: rgba(20, 184, 166, 0.12);
        color: #ccfbf1;
      }

      .badge.orange {
        background: rgba(249, 115, 22, 0.14);
        color: #ffedd5;
      }

      .badge.slate {
        background: rgba(56, 189, 248, 0.12);
        color: #e0f2fe;
      }

      .card {
        padding: 16px;
        border-radius: 22px;
        border: 1px solid var(--bf-card-border);
        background: linear-gradient(180deg, var(--bf-card-bg), var(--bf-card-bg-strong));
        box-shadow: var(--bf-shadow);
        backdrop-filter: blur(18px);
      }

      .section-label {
        color: var(--bf-muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
      }

      .card h3 {
        margin: 8px 0 0;
        font-size: 1rem;
      }

      .detail-grid {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .detail {
        padding: 12px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .detail span {
        display: block;
      }

      .detail .label {
        color: var(--bf-muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .detail .value {
        margin-top: 6px;
        font-size: 0.9rem;
        line-height: 1.35;
        word-break: break-word;
      }

      .action-grid {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .action-button,
      .utility-button {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: var(--bf-button-bg);
        color: var(--bf-text);
        border-radius: 18px;
        padding: 14px;
        text-align: left;
        cursor: pointer;
        transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
      }

      .action-button:hover,
      .utility-button:hover {
        transform: translateY(-1px);
        background: var(--bf-button-hover);
        border-color: rgba(255, 255, 255, 0.14);
      }

      .action-button.teal {
        box-shadow: inset 0 0 0 1px rgba(20, 184, 166, 0.18);
      }

      .action-button.orange {
        box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.18);
      }

      .action-button.slate {
        box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.16);
      }

      .action-button strong,
      .utility-button strong {
        display: block;
        font-size: 0.9rem;
      }

      .action-button span,
      .utility-button span {
        display: block;
        color: var(--bf-muted);
        font-size: 0.78rem;
        line-height: 1.35;
        margin-top: 6px;
      }

      .utility-grid {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .issue-card {
        border-color: rgba(249, 115, 22, 0.24);
      }

      .issue-list {
        margin: 12px 0 0;
        padding-left: 18px;
        color: var(--bf-text);
      }

      .issue-list li + li {
        margin-top: 8px;
      }

      .empty-note {
        margin-top: 14px;
        padding: 14px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px dashed rgba(255, 255, 255, 0.12);
        color: var(--bf-muted);
        line-height: 1.5;
      }

      .footer-note {
        color: var(--bf-muted);
        font-size: 0.78rem;
        line-height: 1.55;
      }

      @media (max-width: 520px) {
        .detail-grid,
        .action-grid,
        .utility-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="hero-top">
          <div class="brand">
            <div class="mark">BF</div>
            <div>
              <h1 class="brand-title">BranchFlow</h1>
              <div class="brand-subtitle">Policy-driven workflow command center</div>
            </div>
          </div>
          <button class="refresh-button" data-command="branchflow.refreshSidebar">Refresh</button>
        </div>
        <div class="hero-branch">
          <div class="eyebrow">Current Focus</div>
          <h2 class="branch-name">${escapeHtml(state.currentBranch ?? 'Open a repository to begin')}</h2>
          <div class="badge-row">${badges}</div>
        </div>
      </section>

      <section class="card">
        <div class="section-label">Snapshot</div>
        <h3>Repository and policy state</h3>
        <div class="detail-grid">
          <div class="detail">
            <span class="label">Workspace</span>
            <span class="value">${escapeHtml(state.workspacePath ?? 'No workspace folder')}</span>
          </div>
          <div class="detail">
            <span class="label">Git Repository</span>
            <span class="value">${state.gitRepository ? 'Yes' : 'No'}</span>
          </div>
          <div class="detail">
            <span class="label">Provider</span>
            <span class="value">${escapeHtml(state.provider ?? 'Not available')}</span>
          </div>
          <div class="detail">
            <span class="label">Remote</span>
            <span class="value">${escapeHtml(state.remoteName ?? 'Not configured')}</span>
          </div>
          <div class="detail">
            <span class="label">Policy</span>
            <span class="value">${escapeHtml(state.policyPath ?? 'Not found')}</span>
          </div>
          <div class="detail">
            <span class="label">Protected</span>
            <span class="value">${state.isProtected ? 'Yes' : 'No'}</span>
          </div>
        </div>
        ${this.renderContextNote(state)}
      </section>

      ${issueBlock}

      <section class="card">
        <div class="section-label">Ready Now</div>
        <h3>Actions available from this branch</h3>
        ${readyActions}
      </section>

      <section class="card">
        <div class="section-label">Toolkit</div>
        <h3>Always useful commands</h3>
        <div class="utility-grid">
          <button class="utility-button" data-command="branchflow.showCurrentState">
            <strong>Show State</strong>
            <span>Open the detailed state report in the output panel.</span>
          </button>
          <button class="utility-button" data-command="branchflow.reloadPolicy">
            <strong>Reload Policy</strong>
            <span>Re-read and validate the repository policy file.</span>
          </button>
          <button class="utility-button" data-command="branchflow.initializeProject">
            <strong>Initialize</strong>
            <span>Create or regenerate a starter policy for the repo.</span>
          </button>
        </div>
      </section>

      <section class="footer-note">
        BranchFlow is now usable from this sidebar, but every action still remains available from the Command Palette when you want a faster keyboard-driven flow.
      </section>
    </main>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.querySelectorAll('[data-command]').forEach((element) => {
        element.addEventListener('click', () => {
          vscode.postMessage({ command: element.getAttribute('data-command') });
        });
      });
    </script>
  </body>
</html>`;
    }
    renderActionGrid(availableActions) {
        if (availableActions.length === 0) {
            return `
        <div class="empty-note">
          BranchFlow does not have any workflow actions available yet. Open a Git repository, add a policy file, or use Initialize Project to get started.
        </div>
      `;
        }
        const actionMarkup = PRIMARY_ACTIONS.filter(({ action }) => availableActions.includes(action))
            .map(({ action, caption, accent }) => {
            return `
          <button class="action-button ${accent}" data-command="branchflow.${action}">
            <strong>${escapeHtml(action_1.BRANCH_FLOW_ACTION_TITLES[action])}</strong>
            <span>${escapeHtml(caption)}</span>
          </button>
        `;
        })
            .join('');
        return `<div class="action-grid">${actionMarkup}</div>`;
    }
    renderBadge(label, tone) {
        return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
    }
    policyTone(policyStatus) {
        if (policyStatus === 'Valid') {
            return 'teal';
        }
        if (policyStatus === 'Missing' || policyStatus.startsWith('Invalid')) {
            return 'orange';
        }
        return 'slate';
    }
    renderContextNote(state) {
        if (!state.workspacePath) {
            return `
        <div class="empty-note">
          Open a workspace folder in VS Code to let BranchFlow inspect the repository and determine what is allowed.
        </div>
      `;
        }
        if (!state.gitRepository) {
            return `
        <div class="empty-note">
          This workspace is not a Git repository yet. Initialize Git first, then reload the sidebar.
        </div>
      `;
        }
        if (state.policyStatus === 'Missing') {
            return `
        <div class="empty-note">
          There is no <code>.branchflow.json</code> file in this repository root yet. Use Initialize to generate a starter policy, then tailor it to your team workflow.
        </div>
      `;
        }
        return '';
    }
}
exports.BranchFlowSidebarProvider = BranchFlowSidebarProvider;
BranchFlowSidebarProvider.viewType = 'branchflow.dashboard';
/**
 * Escapes dynamic text before placing it into the webview HTML. Repository data
 * comes from Git and workspace files, so the webview should never trust it.
 */
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function getNonce() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let value = '';
    for (let index = 0; index < 32; index += 1) {
        value += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return value;
}
//# sourceMappingURL=sidebarProvider.js.map