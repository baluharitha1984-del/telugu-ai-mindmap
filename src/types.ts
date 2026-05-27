export interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
  collapsed?: boolean;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodePositions {
  [nodeId: string]: NodePosition;
}

export interface SavedMap {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  rootNode: MindMapNode;
  positions?: NodePositions;
  originalText?: string;
}

export type Theme = "light" | "dark";
