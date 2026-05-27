import { MindMapNode, NodePositions } from "../types";

/**
 * Calculates responsive, aesthetic 2D coordinates for a left-to-right horizontal hierarchical tree layout.
 * Root is at the left-most, and children grow rightwards, eliminating overlapping.
 */
export function getAutoLayoutPositions(
  root: MindMapNode,
  collapsedNodes: Set<string>
): NodePositions {
  const positions: NodePositions = {};

  // Anchor the root on the left
  positions[root.id] = { x: 50, y: 0 };

  const X_GAP = 280; // horizontal gap between columns
  const Y_GAP = 95;  // vertical spacing between sibling nodes

  // Helper to measure subtree height recursively to prevent text node overlaps
  function measureSubtreeHeight(node: MindMapNode): number {
    if (collapsedNodes.has(node.id) || !node.children || node.children.length === 0) {
      return Y_GAP;
    }
    let total = 0;
    node.children.forEach((child) => {
      total += measureSubtreeHeight(child);
    });
    // Ensure height is at least the vertical gap
    return Math.max(total, Y_GAP);
  }

  // Recursive layout of children rightwards
  function layoutNode(node: MindMapNode, currentX: number, centerY: number) {
    if (collapsedNodes.has(node.id) || !node.children || node.children.length === 0) {
      return;
    }

    const children = node.children;
    const heights = children.map(measureSubtreeHeight);
    const totalHeight = heights.reduce((a, b) => a + b, 0);

    // Stratify children around the centerY point of the parent
    let currentY = centerY - totalHeight / 2;

    children.forEach((child, idx) => {
      const childHeight = heights[idx];
      const childY = currentY + childHeight / 2;
      const childX = currentX + X_GAP;

      positions[child.id] = { x: childX, y: childY };

      // Recursively calculate sub-branch layout
      layoutNode(child, childX, childY);

      currentY += childHeight;
    });
  }

  // Start laying out from the root!
  layoutNode(root, 50, 0);

  return positions;
}
