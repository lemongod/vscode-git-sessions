import * as vscode from "vscode";
import { GitManager } from "./gitManager";
import { LayoutManager } from "./layoutManager";

export function activate(context: vscode.ExtensionContext) {
  const gitManager = new GitManager();
  const layoutManager = new LayoutManager(context);

  // Watch for branch changes
  gitManager.watchBranchChanges(async (branch) => {
    await layoutManager.restoreLayout(branch);
  });

  // Register command to save current layout
  let saveCommand = vscode.commands.registerCommand(
    "gitLayout.saveLayout",
    async () => {
      const branch = await gitManager.getCurrentBranch();
      if (branch) {
        await layoutManager.captureCurrentLayout(branch);
        vscode.window.showInformationMessage(
          `Saved layout for branch: ${branch}`
        );
      }
    }
  );

  // Register command to restore layout
  let restoreCommand = vscode.commands.registerCommand(
    "gitLayout.restoreLayout",
    async () => {
      const branch = await gitManager.getCurrentBranch();
      if (branch) {
        await layoutManager.restoreLayout(branch);
        vscode.window.showInformationMessage(
          `Restored layout for branch: ${branch}`
        );
      }
    }
  );

  context.subscriptions.push(saveCommand, restoreCommand);
}

export function deactivate() {}
