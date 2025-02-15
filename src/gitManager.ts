import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class GitManager {
  private currentBranch: string | null = null;

  async getCurrentBranch(): Promise<string | null> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) return null;

      const { stdout } = await execAsync("git branch --show-current", {
        cwd: workspaceFolders[0].uri.fsPath,
      });

      this.currentBranch = stdout.trim();
      return this.currentBranch;
    } catch (error) {
      console.error("Error getting current branch:", error);
      return null;
    }
  }

  async watchBranchChanges(callback: (branch: string) => void): Promise<void> {
    const interval = setInterval(async () => {
      const newBranch = await this.getCurrentBranch();
      if (newBranch && newBranch !== this.currentBranch) {
        this.currentBranch = newBranch;
        callback(newBranch);
      }
    }, 1000);

    // Clean up interval when extension is deactivated
    vscode.Disposable.from({ dispose: () => clearInterval(interval) });
  }
}
