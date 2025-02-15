export interface TabLayout {
  uri: string;
  viewColumn: number;
  active?: boolean;
  preview?: boolean;
  pinned?: boolean;
}

export interface BranchLayout {
  branch: string;
  tabs: TabLayout[];
  timestamp: number;
}

export interface LayoutStorage {
  layouts: { [branch: string]: BranchLayout };
}
