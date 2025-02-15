import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BranchLayout, LayoutStorage, TabLayout } from "./types";

export class LayoutManager {
  private storageFile: string;
  private layouts: LayoutStorage;

  constructor(context: vscode.ExtensionContext) {
    this.storageFile = path.join(context.globalStoragePath, "layouts.json");
    this.layouts = this.loadLayouts();
  }

  private loadLayouts(): LayoutStorage {
    try {
      if (fs.existsSync(this.storageFile)) {
        return JSON.parse(fs.readFileSync(this.storageFile, "utf8"));
      }
    } catch (error) {
      console.error("Error loading layouts:", error);
    }
    return { layouts: {} };
  }

  private saveLayouts(): void {
    try {
      fs.mkdirSync(path.dirname(this.storageFile), { recursive: true });
      fs.writeFileSync(this.storageFile, JSON.stringify(this.layouts, null, 2));
    } catch (error) {
      console.error("Error saving layouts:", error);
    }
  }

  async captureCurrentLayout(branch: string): Promise<void> {
    const tabs: TabLayout[] = [];

    // Get all visible editors
    const visibleEditors = vscode.window.visibleTextEditors;

    // Get all tabs from the tab groups
    const tabGroups = vscode.window.tabGroups;

    for (const group of tabGroups.all) {
      for (const tab of group.tabs) {
        const isTextInput = (input: unknown): input is { uri: vscode.Uri } => {
          return (
            typeof input === "object" &&
            input !== null &&
            "uri" in input &&
            input.uri instanceof vscode.Uri
          );
        };
        if (tab.input && isTextInput(tab.input)) {
          const uri = (tab.input as { uri: vscode.Uri }).uri;
          const editor = visibleEditors.find(
            (e) => e.document.uri.toString() === uri.toString()
          );

          tabs.push({
            uri: tab.input.uri.toString(),
            viewColumn: group.viewColumn,
            active: tab.isActive,
            preview: tab.isPreview || false,
            pinned: tab.isPinned || false,
          });
        }
      }
    }

    this.layouts.layouts[branch] = {
      branch,
      tabs,
      timestamp: Date.now(),
    };

    this.saveLayouts();
  }

  async restoreLayout(branch: string): Promise<void> {
    const layout = this.layouts.layouts[branch];
    if (!layout) {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      return;
    }

    // Close all current editors
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    // Sort tabs by viewColumn to maintain the order of splits
    const sortedTabs = [...layout.tabs].sort(
      (a, b) => a.viewColumn - b.viewColumn
    );

    // Open each tab in the correct view column
    for (const tab of sortedTabs) {
      try {
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.parse(tab.uri)
        );
        await vscode.window.showTextDocument(document, {
          viewColumn: tab.viewColumn,
          preview: tab.preview || false,
          preserveFocus: !tab.active,
        });

        // Pin the tab if it was pinned in the saved layout
        if (tab.pinned) {
          await vscode.commands.executeCommand("workbench.action.pinEditor");
        }
      } catch (error) {
        console.error(`Failed to open ${tab.uri}:`, error);
      }
    }
  }
}
