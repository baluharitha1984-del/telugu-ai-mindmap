import React, { useRef, useState, useEffect } from "react";
import { MindMapNode, NodePositions } from "../types";
import { getEducationalExplanation } from "../lib/explanationGenerator";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Sparkles, 
  Check, 
  X,
  FileImage,
  FileDown,
  Layers,
  BookOpen,
  Maximize2,
  Minimize2,
  FolderOpen,
  ArrowLeft,
  Award
} from "lucide-react";

interface MindMapCanvasProps {
  rootNode: MindMapNode;
  positions: NodePositions;
  onUpdatePositions: (positions: NodePositions) => void;
  onUpdateNodeText: (nodeId: string, newText: string) => void;
  onAddSubNode: (parentNodeId: string, nodeText?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  collapsedNodes: Set<string>;
  onToggleCollapse: (nodeId: string) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  theme: "light" | "dark";
  searchQuery?: string;
  onAutoArrange: () => void;
  onSaveMindMap: () => void;
  triggerPngExportRef?: React.MutableRefObject<(() => void) | null>;
  triggerPdfExportRef?: React.MutableRefObject<(() => void) | null>;
  isFullViewMode: boolean;
  onToggleFullViewMode: () => void;
  onOpenGallery?: () => void;
  originalText?: string;
  onOpenQuiz?: () => void;
}

const PALETTES = [
  { // 0: Blue
    stroke: "#3B82F6",
    level1: {
      dark: "bg-blue-950/90 text-blue-100 border-blue-500 shadow-md",
      light: "bg-blue-50/95 text-blue-900 border-blue-600 shadow-sm",
      tag: "bg-blue-600/25 text-blue-700 dark:text-blue-300"
    },
    level2: {
      dark: "bg-blue-950/70 text-blue-100 border-blue-500/50 shadow-xs",
      light: "bg-blue-50/50 text-blue-900 border-blue-400 shadow-xxs",
      tag: "bg-blue-500/15 text-blue-700 dark:text-blue-300"
    },
    level3: {
      dark: "bg-blue-950/40 text-blue-200 border-blue-800/30",
      light: "bg-blue-50/20 text-blue-850 border-blue-200",
      tag: "bg-blue-200/60 text-blue-750"
    }
  },
  { // 1: Emerald/Green
    stroke: "#10B981",
    level1: {
      dark: "bg-emerald-950/90 text-emerald-100 border-emerald-500 shadow-md",
      light: "bg-emerald-50/95 text-emerald-900 border-emerald-600 shadow-sm",
      tag: "bg-emerald-600/25 text-emerald-700 dark:text-emerald-300"
    },
    level2: {
      dark: "bg-emerald-950/70 text-emerald-100 border-emerald-500/50 shadow-xs",
      light: "bg-emerald-50/50 text-emerald-900 border-emerald-400 shadow-xxs",
      tag: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    },
    level3: {
      dark: "bg-emerald-950/40 text-emerald-200 border-emerald-800/30",
      light: "bg-emerald-50/20 text-emerald-850 border-emerald-200",
      tag: "bg-emerald-200/60 text-emerald-750"
    }
  },
  { // 2: Orange
    stroke: "#F97316",
    level1: {
      dark: "bg-orange-950/90 text-orange-100 border-orange-500 shadow-md",
      light: "bg-orange-50/95 text-orange-900 border-orange-600 shadow-sm",
      tag: "bg-orange-600/25 text-orange-700 dark:text-orange-300"
    },
    level2: {
      dark: "bg-orange-950/70 text-orange-100 border-orange-500/50 shadow-xs",
      light: "bg-orange-50/50 text-orange-900 border-orange-400 shadow-xxs",
      tag: "bg-orange-500/15 text-orange-700 dark:text-orange-300"
    },
    level3: {
      dark: "bg-orange-950/40 text-orange-200 border-orange-800/30",
      light: "bg-orange-50/20 text-orange-850 border-orange-200",
      tag: "bg-orange-200/60 text-orange-750"
    }
  },
  { // 3: Purple
    stroke: "#8B5CF6",
    level1: {
      dark: "bg-purple-950/90 text-purple-100 border-purple-500 shadow-md",
      light: "bg-purple-50/95 text-purple-900 border-purple-600 shadow-sm",
      tag: "bg-purple-600/25 text-purple-700 dark:text-purple-300"
    },
    level2: {
      dark: "bg-purple-950/70 text-purple-100 border-purple-500/50 shadow-xs",
      light: "bg-purple-50/50 text-purple-900 border-purple-400 shadow-xxs",
      tag: "bg-purple-500/15 text-purple-705 dark:text-purple-300"
    },
    level3: {
      dark: "bg-purple-950/40 text-purple-200 border-purple-800/30",
      light: "bg-purple-50/20 text-purple-850 border-purple-200",
      tag: "bg-purple-200/60 text-purple-750"
    }
  },
  { // 4: Rose
    stroke: "#F43F5E",
    level1: {
      dark: "bg-rose-950/90 text-rose-100 border-rose-500 shadow-md",
      light: "bg-rose-50/95 text-rose-900 border-rose-600 shadow-sm",
      tag: "bg-rose-600/25 text-rose-700 dark:text-rose-300"
    },
    level2: {
      dark: "bg-rose-950/70 text-rose-100 border-rose-500/50 shadow-xs",
      light: "bg-rose-50/50 text-rose-900 border-rose-400 shadow-xxs",
      tag: "bg-rose-500/15 text-rose-700 dark:text-rose-300"
    },
    level3: {
      dark: "bg-rose-950/40 text-rose-200 border-rose-800/30",
      light: "bg-rose-50/20 text-rose-850 border-rose-200",
      tag: "bg-rose-200/60 text-rose-750"
    }
  },
  { // 5: Teal
    stroke: "#14B8A6",
    level1: {
      dark: "bg-teal-950/90 text-teal-100 border-teal-500 shadow-md",
      light: "bg-teal-50/95 text-teal-900 border-teal-600 shadow-sm",
      tag: "bg-teal-600/25 text-teal-700 dark:text-teal-300"
    },
    level2: {
      dark: "bg-teal-950/70 text-teal-100 border-teal-500/50 shadow-xs",
      light: "bg-teal-50/50 text-teal-900 border-teal-400 shadow-xxs",
      tag: "bg-teal-500/15 text-teal-700 dark:text-teal-300"
    },
    level3: {
      dark: "bg-teal-950/40 text-teal-200 border-teal-800/30",
      light: "bg-teal-50/20 text-teal-850 border-teal-200",
      tag: "bg-teal-200/60 text-teal-750"
    }
  },
  { // 6: Amber
    stroke: "#D97706",
    level1: {
      dark: "bg-amber-950/90 text-amber-100 border-amber-500 shadow-md",
      light: "bg-amber-50/95 text-amber-900 border-amber-600 shadow-sm",
      tag: "bg-amber-600/25 text-amber-700 dark:text-amber-300"
    },
    level2: {
      dark: "bg-amber-950/70 text-amber-100 border-amber-500/50 shadow-xs",
      light: "bg-amber-50/50 text-amber-900 border-amber-400 shadow-xxs",
      tag: "bg-amber-500/15 text-amber-700 dark:text-amber-300"
    },
    level3: {
      dark: "bg-amber-950/40 text-amber-200 border-amber-800/30",
      light: "bg-amber-50/20 text-amber-850 border-amber-200",
      tag: "bg-amber-200/60 text-amber-750"
    }
  },
  { // 7: Cyan
    stroke: "#06B6D4",
    level1: {
      dark: "bg-cyan-950/90 text-cyan-100 border-cyan-500 shadow-md",
      light: "bg-cyan-50/95 text-cyan-900 border-cyan-600 shadow-sm",
      tag: "bg-cyan-600/25 text-cyan-700 dark:text-cyan-300"
    },
    level2: {
      dark: "bg-cyan-950/70 text-cyan-100 border-cyan-500/50 shadow-xs",
      light: "bg-cyan-50/50 text-cyan-900 border-cyan-400 shadow-xxs",
      tag: "bg-cyan-500/15 text-cyan-705 dark:text-cyan-300"
    },
    level3: {
      dark: "bg-cyan-950/40 text-cyan-200 border-cyan-800/30",
      light: "bg-cyan-50/20 text-cyan-850 border-cyan-200",
      tag: "bg-cyan-200/60 text-cyan-750"
    }
  }
];

export default function MindMapCanvas({
  rootNode,
  positions,
  onUpdatePositions,
  onUpdateNodeText,
  onAddSubNode,
  onDeleteNode,
  collapsedNodes,
  onToggleCollapse,
  selectedNodeId,
  onSelectNode,
  theme,
  searchQuery = "",
  onAutoArrange,
  onSaveMindMap,
  triggerPngExportRef,
  triggerPdfExportRef,
  isFullViewMode,
  onToggleFullViewMode,
  onOpenGallery,
  originalText,
  onOpenQuiz
}: MindMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan & Zoom states
  const [pan, setPan] = useState({ x: 100, y: 250 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Node Drag and Tap validation states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartCoord, setDragStartCoord] = useState({ x: 0, y: 0 });
  const [hasMovedNode, setHasMovedNode] = useState(false);

  // Inline Editing states
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Advanced subnode addition states
  const [newSubtext, setNewSubtext] = useState("");

  // Dimensions of container
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Sync container size
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      setDimensions({
        width: containerRef.current?.clientWidth || 800,
        height: containerRef.current?.clientHeight || 600
      });
    };
    updateSize();
    
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Centering on mount or node reload
  useEffect(() => {
    // Left-to-right look matches root on the left center of screens
    setPan({ x: 80, y: dimensions.height / 2 });
  }, [dimensions.width, dimensions.height, rootNode.id]);

  // Handle auto focus on inline edit input
  useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNodeId]);

  // Smooth mouse wheel zooming on the canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
      
      setZoom((prev) => {
        const nextZoom = Math.min(Math.max(prev * zoomFactor, 0.25), 3);
        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Mouse pan handlers (panning occurs on canvas drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking a button or an input, don't drag background
    if ((e.target as HTMLElement).closest("button") || 
        (e.target as HTMLElement).closest("input") || 
        (e.target as HTMLElement).closest(".mindmap-node")) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (draggingNodeId) {
      // Dragging node coordinate updates
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;
      
      const pxDelta = Math.hypot(e.clientX - dragStartCoord.x, e.clientY - dragStartCoord.y);
      if (pxDelta > 6) {
        setHasMovedNode(true);
      }

      onUpdatePositions({
        ...positions,
        [draggingNodeId]: {
          x: mouseCanvasX - dragOffset.x,
          y: mouseCanvasY - dragOffset.y
        }
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId && !hasMovedNode) {
      // Clean, precise static TAP on node: toggle panel
      handleNodeClick(draggingNodeId);
    }
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeClick = (nodeId: string) => {
    if (selectedNodeId === nodeId) {
      onSelectNode(null);
    } else {
      onSelectNode(nodeId);
    }
  };

  // Mobile Touch pan and drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // If tapping buttons, controls, or inputs, let them handle it singly
    if (target.closest("button") || target.closest("input") || target.closest(".mindmap-node-controls")) {
      return;
    }

    const nodeEl = target.closest(".mindmap-node");
    if (nodeEl) {
      e.stopPropagation();
      const nodeId = nodeEl.id.replace("node-elem-", "");
      setDraggingNodeId(nodeId);
      setHasMovedNode(false);
      
      const touch = e.touches[0];
      setDragStartCoord({ x: touch.clientX, y: touch.clientY });
      
      const currentPos = positions[nodeId] || { x: 0, y: 0 };
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseCanvasX = (touch.clientX - rect.left - pan.x) / zoom;
      const mouseCanvasY = (touch.clientY - rect.top - pan.y) / zoom;
      
      setDragOffset({
        x: mouseCanvasX - currentPos.x,
        y: mouseCanvasY - currentPos.y
      });
    } else {
      setIsPanning(true);
      const touch = e.touches[0];
      setStartPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - startPan.x,
        y: touch.clientY - startPan.y
      });
    } else if (draggingNodeId) {
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseCanvasX = (touch.clientX - rect.left - pan.x) / zoom;
      const mouseCanvasY = (touch.clientY - rect.top - pan.y) / zoom;
      
      const pxDelta = Math.hypot(touch.clientX - dragStartCoord.x, touch.clientY - dragStartCoord.y);
      if (pxDelta > 6) {
        setHasMovedNode(true);
      }

      onUpdatePositions({
        ...positions,
        [draggingNodeId]: {
          x: mouseCanvasX - dragOffset.x,
          y: mouseCanvasY - dragOffset.y
        }
      });
    }
  };

  const handleTouchEnd = () => {
    if (draggingNodeId && !hasMovedNode) {
      handleNodeClick(draggingNodeId);
    }
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node drag start
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    setDraggingNodeId(nodeId);
    setHasMovedNode(false);
    setDragStartCoord({ x: e.clientX, y: e.clientY });
    
    // Calculate difference between mouse and node coordinate in Canvas space
    const currentPos = positions[nodeId] || { x: 0, y: 0 };
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;
    
    setDragOffset({
      x: mouseCanvasX - currentPos.x,
      y: mouseCanvasY - currentPos.y
    });
  };

  // Zoom helpers
  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.25), 3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 80, y: dimensions.height / 2 });
  };

  // Start inline editing
  const startEditing = (nodeId: string, currentText: string) => {
    setEditingNodeId(nodeId);
    setEditText(currentText);
  };

  // Save inline edit
  const saveNodeEdit = (nodeId: string) => {
    if (editText.trim()) {
      onUpdateNodeText(nodeId, editText.trim());
    }
    setEditingNodeId(null);
  };

  // Add sub-concept node quickly
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNodeId) {
      onAddSubNode(selectedNodeId, newSubtext.trim() || "కొత్త పాయింట్ (New Point)");
      setNewSubtext("");
    }
  };

  // Find node details like level/parent recursively
  const getNodeDetails = (
    node: MindMapNode,
    targetId: string,
    parentId: string | null = null,
    level = 0
  ): { level: number; parentId: string | null; node: MindMapNode } | null => {
    if (node.id === targetId) {
      return { level, parentId, node };
    }
    if (node.children) {
      for (const child of node.children) {
        const found = getNodeDetails(child, targetId, node.id, level + 1);
        if (found) return found;
      }
    }
    return null;
  };

  // Pre-calculate branch index for each node ID to group them visually with cohesive color themes
  const nodeBranchMap: { [nodeId: string]: number } = {};
  if (rootNode.children) {
    rootNode.children.forEach((child, index) => {
      const mapChildren = (n: MindMapNode) => {
        nodeBranchMap[n.id] = index;
        if (n.children) {
          n.children.forEach(mapChildren);
        }
      };
      mapChildren(child);
    });
  }

  // Build flattened links lists and flat nodes lists
  const nodesList: { node: MindMapNode; level: number; parentId: string | null }[] = [];
  const linksList: { 
    sourceId: string; 
    targetId: string; 
    sourceX: number; 
    sourceY: number; 
    targetX: number; 
    targetY: number; 
    level: number;
    sourceLevel: number;
    branchIdx: number;
  }[] = [];

  const traverseTree = (node: MindMapNode, parentId: string | null = null, level = 0) => {
    nodesList.push({ node, level, parentId });
    
    if (node.children && !collapsedNodes.has(node.id)) {
      node.children.forEach((child) => {
        const sourcePos = positions[node.id] || { x: 0, y: 0 };
        const targetPos = positions[child.id] || { x: 0, y: 0 };
        const branchIdx = nodeBranchMap[child.id] !== undefined ? nodeBranchMap[child.id] : 0;
        
        linksList.push({
          sourceId: node.id,
          targetId: child.id,
          sourceX: sourcePos.x,
          sourceY: sourcePos.y,
          targetX: targetPos.x,
          targetY: targetPos.y,
          level: level + 1,
          sourceLevel: level,
          branchIdx
        });
        
        traverseTree(child, node.id, level + 1);
      });
    }
  };

  traverseTree(rootNode);

  // Node branch size calculations
  const getNodeHalfWidth = (lvl: number) => {
    if (lvl === 0) return 90;
    if (lvl === 1) return 80;
    if (lvl === 2) return 70;
    return 60;
  };

  // Styled organic horizontal curved connecter paths (Cubic Bezier curve from parent end-edge to child start-edge)
  const drawBezierPath = (sx: number, sy: number, tx: number, ty: number, level: number, sourceLevel: number) => {
    const parentWidth = getNodeHalfWidth(sourceLevel);
    const childWidth = getNodeHalfWidth(level);
    
    // Position parents socket to standard right edge, and child to left edge
    const socketSx = sx + parentWidth;
    const socketTx = tx - childWidth;

    const midX = (socketSx + socketTx) / 2;
    
    return `M ${socketSx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${socketTx} ${ty}`;
  };

  // Node branch colors with dynamic branch visual matching
  const getNodeColorClasses = (level: number, highlight: boolean, isSelected: boolean, branchIdx: number) => {
    const activeRing = isSelected ? "ring-4 ring-orange-500 scale-102 shadow-xl" : "";
    const activeHighlight = highlight ? "ring-4 ring-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 font-bold border-yellow-400" : "";
    
    if (level === 0) { // Center Root Topic (Left side anchor position)
      return {
        bg: "bg-indigo-650 text-white border-indigo-700 shadow-xl",
        textStyle: "text-base sm:text-lg font-bold tracking-normal",
        radius: "rounded-2xl",
        border: "border-2.5",
        ring: `${activeRing} ${activeHighlight}`,
        tagStyle: "bg-indigo-700/60 text-indigo-100"
      };
    }

    const palette = PALETTES[branchIdx % PALETTES.length];

    if (level === 1) { // Primary Subtopics
      return {
        bg: theme === "dark" ? palette.level1.dark : palette.level1.light,
        textStyle: "text-sm sm:text-base font-semibold",
        radius: "rounded-xl",
        border: "border-2",
        ring: `${activeRing} ${activeHighlight}`,
        tagStyle: palette.level1.tag
      };
    } else if (level === 2) { // Supporting Concepts
      return {
        bg: theme === "dark" ? palette.level2.dark : palette.level2.light,
        textStyle: "text-xs sm:text-sm font-medium",
        radius: "rounded-lg",
        border: "border-1.5",
        ring: `${activeRing} ${activeHighlight}`,
        tagStyle: palette.level2.tag
      };
    } else { // Sub-points (Leaf nodes)
      return {
        bg: theme === "dark" ? palette.level3.dark : palette.level3.light,
        textStyle: "text-xs font-normal",
        radius: "rounded-md",
        border: "border",
        ring: `${activeRing} ${activeHighlight}`,
        tagStyle: palette.level3.tag
      };
    }
  };

  // Branch lines styling
  const getBranchLineStyles = (level: number, branchIdx: number) => {
    const palette = PALETTES[branchIdx % PALETTES.length];
    if (level === 1) {
      return {
        stroke: palette.stroke,
        strokeWidth: 4,
        opacity: 0.85,
        dash: ""
      };
    } else if (level === 2) {
      return {
        stroke: palette.stroke,
        strokeWidth: 2.5,
        opacity: 0.7,
        dash: ""
      };
    } else {
      return {
        stroke: palette.stroke,
        strokeWidth: 1.5,
        opacity: 0.55,
        dash: "4,4"
      };
    }
  };

  const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const result: string[] = [];
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      const words = para.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const width = ctx.measureText(testLine).width;
        if (width > maxWidth && currentLine) {
          result.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) result.push(currentLine);
    }
    return result;
  };

  // Generate high-resolution export canvas representing left-to-right nodes
  const generateFidelityCanvas = (exportTheme: "light" | "dark" = "light"): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const ids = Object.keys(positions);
      let minX = -400, maxX = 400, minY = -300, maxY = 300;
      if (ids.length > 0) {
        const xs = ids.map(id => positions[id].x);
        const ys = ids.map(id => positions[id].y);
        minX = Math.min(...xs);
        maxX = Math.max(...xs);
        minY = Math.min(...ys);
        maxY = Math.max(...ys);
      }

      const margin = 200;
      const modelWidth = (maxX - minX) + margin * 2;
      const modelHeight = (maxY - minY) + margin * 2;

      const scale = 2.5; 
      const canvas = document.createElement("canvas");
      canvas.width = modelWidth * scale;
      canvas.height = modelHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(canvas);
        return;
      }

      if (!ctx.roundRect) {
        ctx.roundRect = function(this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
          let radius = r;
          if (w < 2 * radius) radius = w / 2;
          if (h < 2 * radius) radius = h / 2;
          this.beginPath();
          this.moveTo(x + radius, y);
          this.arcTo(x + w, y, x + w, y + h, radius);
          this.arcTo(x + w, y + h, x, y + h, radius);
          this.arcTo(x, y + h, x, y, radius);
          this.arcTo(x, y, x + w, y, radius);
          this.closePath();
          return this;
        };
      }

      ctx.scale(scale, scale);

      ctx.fillStyle = exportTheme === "dark" ? "#09090b" : "#ffffff";
      ctx.fillRect(0, 0, modelWidth, modelHeight);

      ctx.fillStyle = exportTheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
      for (let gdX = 15; gdX < modelWidth; gdX += 25) {
        for (let gdY = 15; gdY < modelHeight; gdY += 25) {
          ctx.beginPath();
          ctx.arc(gdX, gdY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const getCanvasPos = (nodeId: string) => {
        const pt = positions[nodeId] || { x: 0, y: 0 };
        return {
          x: pt.x - minX + margin,
          y: pt.y - minY + margin
        };
      };

      // 1. Draw connecting dynamic curves (branches LTR)
      linksList.forEach((link) => {
        const sourcePt = getCanvasPos(link.sourceId);
        const targetPt = getCanvasPos(link.targetId);

        const strokeStyle = getBranchLineStyles(link.level, link.branchIdx);
        ctx.beginPath();
        ctx.strokeStyle = strokeStyle.stroke;
        ctx.lineWidth = strokeStyle.strokeWidth;
        
        const parentW = getNodeHalfWidth(link.sourceLevel);
        const childW = getNodeHalfWidth(link.level);
        
        const sx = sourcePt.x + parentW;
        const sy = sourcePt.y;
        const tx = targetPt.x - childW;
        const ty = targetPt.y;
        
        const midX = (sx + tx) / 2;
        
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(midX, sy, midX, ty, tx, ty);
        ctx.stroke();
      });

      // 2. Draw colorful rounded rectangles containing centers and subconcepts
      nodesList.forEach(({ node, level }) => {
        const pt = getCanvasPos(node.id);
        
        let fontStr = '';
        let fillStyle = '';
        let borderStyle = '';
        let textStyle = '';
        let maxWidth = 150;
        let pX = 14;
        let pY = 10;
        let lHeight = 16;
        let nodeRadius = 8;

        if (level === 0) {
          fontStr = 'bold 15px "Hind Telugu", "Inter", sans-serif';
          fillStyle = '#ea580c'; 
          borderStyle = '#c2410c';
          textStyle = '#ffffff';
          maxWidth = 200;
          pX = 18;
          pY = 12;
          lHeight = 22;
          nodeRadius = 14;
        } else if (level === 1) {
          fontStr = '600 12px "Hind Telugu", "Inter", sans-serif';
          fillStyle = exportTheme === "dark" ? "#0f172a" : "#f0fdfa";
          borderStyle = exportTheme === "dark" ? "#0ea5e9" : "#0d9488";
          textStyle = exportTheme === "dark" ? "#e2e8f0" : "#115e59";
          maxWidth = 160;
          pX = 14;
          pY = 10;
          lHeight = 18;
          nodeRadius = 10;
        } else if (level === 2) {
          fontStr = '500 11px "Hind Telugu", "Inter", sans-serif';
          fillStyle = exportTheme === "dark" ? "#1c1917" : "#fffbeb";
          borderStyle = exportTheme === "dark" ? "#ca8a04" : "#d97706";
          textStyle = exportTheme === "dark" ? "#fef3c7" : "#78350f";
          maxWidth = 140;
          pX = 12;
          pY = 8;
          lHeight = 16;
          nodeRadius = 8;
        } else {
          fontStr = 'normal 10px "Hind Telugu", "Inter", sans-serif';
          fillStyle = exportTheme === "dark" ? "#09090b" : "#ffffff";
          borderStyle = exportTheme === "dark" ? "#3f3f46" : "#d4d4d8";
          textStyle = exportTheme === "dark" ? "#f4f4f5" : "#18181b";
          maxWidth = 120;
          pX = 10;
          pY = 8;
          lHeight = 14;
          nodeRadius = 6;
        }

        ctx.font = fontStr;

        const lines = wrapCanvasText(ctx, node.text, maxWidth);
        let maxW = 0;
        lines.forEach(line => {
          const w = ctx.measureText(line).width;
          if (w > maxW) maxW = w;
        });

        const rectW = maxW + pX * 2;
        const rectH = (lines.length * lHeight) + pY * 2;

        const bx = pt.x - rectW / 2;
        const by = pt.y - rectH / 2;

        ctx.save();
        ctx.shadowColor = exportTheme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(bx, by, rectW, rectH, nodeRadius);
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = borderStyle;
        ctx.lineWidth = level === 0 ? 2.5 : level === 1 ? 1.8 : 1.2;
        ctx.stroke();

        ctx.fillStyle = textStyle;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = fontStr;

        const textStartY = pt.y - ((lines.length - 1) * lHeight) / 2;
        lines.forEach((line, idx) => {
          ctx.fillText(line, pt.x, textStartY + idx * lHeight);
        });
      });

      resolve(canvas);
    });
  };

  const handleExportPNG = async () => {
    try {
      const canvas = await generateFidelityCanvas(theme);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const cleanPrefix = `TeluguMindMaps_${rootNode.text.split("\n")[0].replace(/[^\u0c00-\u0c7f\w]/g, "_")}`;
          link.download = `${cleanPrefix}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (e) {
      console.error("Fidelity PNG export error:", e);
    }
  };

  const handleExportPDF = async () => {
    try {
      const canvas = await generateFidelityCanvas("light");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width / 1.5, canvas.height / 1.5]
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
      
      const cleanPrefix = `TeluguMindMaps_${rootNode.text.split("\n")[0].replace(/[^\u0c00-\u0c7f\w]/g, "_")}`;
      pdf.save(`${cleanPrefix}.pdf`);
    } catch (e) {
      console.error("Fidelity PDF export error:", e);
    }
  };

  useEffect(() => {
    if (triggerPngExportRef) triggerPngExportRef.current = handleExportPNG;
    if (triggerPdfExportRef) triggerPdfExportRef.current = handleExportPDF;
  }, [positions, rootNode, theme]);

  const selectedNodeWithDetails = selectedNodeId ? getNodeDetails(rootNode, selectedNodeId) : null;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
      
      {/* 1. Main Canvas Area */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 h-full relative outline-hidden overflow-hidden select-none cursor-grab ${
          isPanning ? "cursor-grabbing" : ""
        } ${
          theme === "dark" 
            ? "bg-zinc-950 bg-[radial-gradient(ellipse_at_center,rgba(24,24,27,0.8),rgba(9,9,11,1))]" 
            : "bg-zinc-50 bg-[radial-gradient(ellipse_at_center,rgba(244,244,245,0.7),rgba(250,250,250,1))]"
        }`}
      >
        
        {/* Subtle grid pattern for visual calibration */}
        <div className={`absolute inset-0 pointer-events-none opacity-45 dark:opacity-8 flex flex-wrap gap-6 items-center justify-center`}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Help Note on Screen center when empty or first loading */}
        {nodesList.length <= 1 && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 max-w-sm text-center p-6 bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl backdrop-blur-md pointer-events-none animate-bounce">
            <Sparkles className="size-8 text-orange-600 mx-auto mb-3" />
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">అధ్యయన మైండ్ మ్యాప్ సిద్ధంగా ఉంది!</h3>
            <p className="text-[11px] text-zinc-400 mt-1 lines-relaxed leading-relaxed">
              చిట్కాల కోసం నామవాచకం, సూర్యుడు లేదా సౌర వ్యవస్థపై క్లిక్ చేయండి. లేదా డబుల్ క్లిక్ చేయడం ద్వారా కొత్త విద్యా విషయాలు ఎడిట్ చేయండి.
            </p>
          </div>
        )}

        {/* Global Scaled Interaction Layer containing SVG links & HTML nodes */}
        <svg 
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Dynamic SVG links representing curved routes from Left-to-Right */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {linksList.map((link, idx) => {
              const styles = getBranchLineStyles(link.level, link.branchIdx);
              return (
                <path
                  key={`link-${idx}`}
                  id={`link-curve-${link.sourceId}-${link.targetId}`}
                  d={drawBezierPath(link.sourceX, link.sourceY, link.targetX, link.targetY, link.level, link.sourceLevel)}
                  fill="none"
                  stroke={styles.stroke}
                  strokeWidth={styles.strokeWidth}
                  strokeDasharray={styles.dash}
                  style={{ opacity: styles.opacity }}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>
        </svg>

        {/* Floating HTML Nodes Layer for rich interactivity */}
        <div 
          className="w-full h-full absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {nodesList.map(({ node, level, parentId }) => {
            const pos = positions[node.id] || { x: 0, y: 0 };
            const isSelected = selectedNodeId === node.id;
            const hasChildren = node.children && node.children.length > 0;
            const isCollapsed = collapsedNodes.has(node.id);
            
            // Search Match highlighting check
            const isSearchMatch = searchQuery && 
              node.text.toLowerCase().includes(searchQuery.toLowerCase());
            
            const branchIdx = nodeBranchMap[node.id] !== undefined ? nodeBranchMap[node.id] : 0;
            const styles = getNodeColorClasses(level, !!isSearchMatch, isSelected, branchIdx);

            return (
              <div
                key={node.id}
                id={`node-elem-${node.id}`}
                onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  const touch = e.touches[0];
                  setDraggingNodeId(node.id);
                  setHasMovedNode(false);
                  setDragStartCoord({ x: touch.clientX, y: touch.clientY });
                  
                  const currentPos = positions[node.id] || { x: 0, y: 0 };
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  
                  const mouseCanvasX = (touch.clientX - rect.left - pan.x) / zoom;
                  const mouseCanvasY = (touch.clientY - rect.top - pan.y) / zoom;
                  
                  setDragOffset({
                    x: mouseCanvasX - currentPos.x,
                    y: mouseCanvasY - currentPos.y
                  });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing(node.id, node.text);
                }}
                className={`mindmap-node absolute pointer-events-auto transition-transform duration-75 cursor-pointer flex flex-col justify-center select-none shadow-md ${styles.bg} ${styles.border} ${styles.radius} ${styles.ring}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                  minWidth: level === 0 ? "180px" : "150px",
                  maxWidth: level === 0 ? "240px" : "210px",
                  padding: level === 0 ? "16px 22px" : level === 1 ? "12px 18px" : "10px 14px",
                  textAlign: "center"
                }}
              >
                {/* Node Text & Editor */}
                {editingNodeId === node.id ? (
                  <form 
                    onSubmit={(e) => { e.preventDefault(); saveNodeEdit(node.id); }}
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => saveNodeEdit(node.id)}
                      className="text-xs p-1 rounded font-medium border focus:outline-hidden focus:ring-1 bg-white text-zinc-900 border-zinc-400"
                      style={{ width: "120px" }}
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1 cursor-pointer"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNodeId(null)}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded p-1 cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="relative w-full flex flex-col items-center">
                    <span id={`text-${node.id}`} className={`leading-snug whitespace-pre-wrap block ${styles.textStyle}`}>
                      {node.text}
                    </span>
                    
                    {/* Level Identifier Tag for debug or easy visual layout structure */}
                    {level > 0 && (
                      <span className={`text-[8.5px] px-1.5 py-0.2 mt-1 rounded font-mono block w-fit ${styles.tagStyle}`}>
                        L{level}
                      </span>
                    )}

                    {/* Separate PLUS (+) and MINUS (-) controls capsule */}
                    {hasChildren && (
                      <div 
                        className="absolute -right-14 top-1/2 -translate-y-1/2 flex items-center gap-1 p-1 rounded-full border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md z-20 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        {/* PLUS button to expand */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (isCollapsed) {
                              onToggleCollapse(node.id);
                            }
                          }}
                          className={`flex items-center justify-center size-5.5 rounded-full transition-all cursor-pointer ${
                            isCollapsed 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-110 active:scale-90" 
                              : "bg-zinc-100 dark:bg-zinc-805 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                          }`}
                          title="శాఖను విస్తరించు (+)"
                          disabled={!isCollapsed}
                        >
                          <Plus className="size-3 stroke-[3]" />
                        </button>

                        {/* MINUS button to collapse */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!isCollapsed) {
                              onToggleCollapse(node.id);
                            }
                          }}
                          className={`flex items-center justify-center size-5.5 rounded-full transition-all cursor-pointer ${
                            !isCollapsed 
                              ? "bg-orange-600 hover:bg-orange-700 text-white hover:scale-110 active:scale-90" 
                              : "bg-zinc-100 dark:bg-zinc-805 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                          }`}
                          title="శాఖను కుదించు (-)"
                          disabled={isCollapsed}
                        >
                          <span className="text-white text-base font-extrabold select-none leading-none -translate-y-[1.5px]">-</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Micro Floating Control Toolbar inside Canvas */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 p-1 rounded-2xl shadow-lg border backdrop-blur-md bg-white/90 border-zinc-200 dark:bg-zinc-900/95 dark:border-zinc-800">
        <button
          onClick={() => handleZoom(1.15)}
          className="p-2 rounded-xl text-zinc-500 hover:text-orange-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-amber-500 dark:hover:bg-zinc-800 cursor-pointer transition-all"
          title="Zoom In"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          className="p-2 rounded-xl text-zinc-500 hover:text-orange-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-amber-500 dark:hover:bg-zinc-800 cursor-pointer transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-xl text-zinc-500 hover:text-orange-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-amber-500 dark:hover:bg-zinc-800 cursor-pointer transition-all"
          title="Center Focus"
        >
          <Maximize className="size-4" />
        </button>
        <button
          onClick={onAutoArrange}
          className="p-2 rounded-xl text-zinc-500 hover:text-emerald-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-teal-400 dark:hover:bg-zinc-800 cursor-pointer transition-all"
          title="Auto Arrange"
        >
          <RefreshCw className="size-4" />
        </button>
        
        <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

        {/* Condensed single action Save/Download menu button to prevent top clutter */}
        <button
          onClick={onSaveMindMap}
          className="px-3 py-1.5 rounded-xl bg-orange-650 hover:bg-orange-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          title="Save & Download Options"
        >
          <FileDown className="size-3.5" />
          <span>డౌన్‌లోడ్</span>
        </button>

        {onOpenGallery && (
          <>
            <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
            <button
              onClick={onOpenGallery}
              className="p-1.5 px-2.5 rounded-xl text-zinc-500 hover:text-orange-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-amber-500 dark:hover:bg-zinc-800 cursor-pointer transition-all flex items-center gap-1.5"
              title="నా మైండ్ మ్యాప్‌లు (Saved Mind Maps)"
            >
              <FolderOpen className="size-4 text-orange-600" />
              <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-350">మైండ్ మ్యాప్‌లు</span>
            </button>
          </>
        )}

        {onOpenQuiz && (
          <>
            <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
            <button
              onClick={onOpenQuiz}
              className="p-1.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-[10px] cursor-pointer transition-all flex items-center gap-1.5 shadow-md scale-100 hover:scale-102 active:scale-98 animate-pulse shrink-0"
              title="క్విజ్ రాయండి (Practice App Quiz)"
            >
              <Award className="size-3.5 text-white" />
              <span>క్విజ్ రాయండి (Practice Quiz)</span>
            </button>
          </>
        )}

        <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-805 mx-0.5" />

        {/* Fullscreen Mode toggle button */}
        <button
          onClick={onToggleFullViewMode}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isFullViewMode 
              ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" 
              : "text-zinc-500 hover:text-orange-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-amber-500 dark:hover:bg-zinc-800"
          }`}
          title={isFullViewMode ? "ప్యానల్ రీస్టోర్ చేయి (Show Panels)" : "పూర్తి స్క్రీన్ (Full Screen Mode)"}
        >
          {isFullViewMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>

      {/* 3. Immersive Full-Screen Study Lesson Content Viewer (Attractive Presentation Slide Mode) */}
      {selectedNodeWithDetails && (() => {
        const branchIdx = nodeBranchMap[selectedNodeWithDetails.node.id] !== undefined 
          ? nodeBranchMap[selectedNodeWithDetails.node.id] 
          : 0;
        const palette = PALETTES[branchIdx % PALETTES.length];
        const edu = getEducationalExplanation(
          selectedNodeWithDetails.node.text, 
          selectedNodeWithDetails.level,
          originalText,
          selectedNodeWithDetails.node.children?.map(c => c.text)
        );
        
        // Navigation state calculations
        const currentSlideIdx = selectedNodeId ? nodesList.findIndex(n => n.node.id === selectedNodeId) : -1;
        const hasPrevSlide = currentSlideIdx > 0;
        const hasNextSlide = currentSlideIdx !== -1 && currentSlideIdx < nodesList.length - 1;
        const prevSlideNodeId = hasPrevSlide ? nodesList[currentSlideIdx - 1].node.id : null;
        const nextSlideNodeId = hasNextSlide ? nodesList[currentSlideIdx + 1].node.id : null;
        const totalSlides = nodesList.length;

        return (
          <div 
            className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
              theme === "dark" 
                ? "bg-zinc-950 text-zinc-100" 
                : "bg-zinc-50 text-zinc-900"
            }`}
          >
            {/* Top Navigation Bar with Progress Meter */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900/40 px-4 sm:px-12 shadow-xs shrink-0 select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectNode(null)}
                  className="px-3 py-2 border rounded-xl flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                  title="వెనుకకు (Back to Mind Map)"
                >
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline">వెనుకకు (Back to Map)</span>
                </button>

                {onOpenQuiz && (
                  <button
                    onClick={onOpenQuiz}
                    className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md scale-100 hover:scale-102 active:scale-98"
                    title="ఈ శీర్షికపై పరీక్ష"
                  >
                    <Award className="size-4" />
                    <span>క్విజ్ రాయండి (Quiz Mode)</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400">
                    <BookOpen className="size-4 animate-bounce" />
                  </span>
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-orange-600 dark:text-orange-400 font-mono">
                    స్లైడ్ ప్రదర్శన (Topic Slide {currentSlideIdx + 1} of {totalSlides})
                  </span>
                </div>
                
                {/* Micro Progress Bar indicator */}
                <div className="w-32 sm:w-48 h-1.5 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((currentSlideIdx + 1) / totalSlides) * 100}%`,
                      backgroundColor: palette.stroke
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => onSelectNode(null)}
                className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-zinc-750 dark:hover:text-zinc-250 cursor-pointer transition-colors"
                title="క్లోజ్"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Immersive Slide Core Arena */}
            <div className={`flex-1 overflow-y-auto py-6 sm:py-10 scrollbar relative ${
              theme === "dark" 
                ? "bg-radial from-zinc-900/60 to-zinc-950" 
                : "bg-radial from-white to-zinc-100/50"
            }`}>
              {/* Star-like subtle grid for aesthetic tech feeling */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
                
                {/* Modern Presentation Card Layout */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  
                  {/* Glowing header banner matching the branch color theme */}
                  <div 
                    className="h-2 w-full"
                    style={{ backgroundColor: palette.stroke }}
                  />

                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Category Pill & Subject Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-mono font-black tracking-widest px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {edu.category}
                      </span>
                      <span 
                        className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${palette.stroke}15`, 
                          color: palette.stroke, 
                          border: `1px solid ${palette.stroke}25` 
                        }}
                      >
                        శాఖ {branchIdx + 1}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                        {edu.title}
                      </h2>
                      {edu.englishTitle && (
                        <span className="text-xs sm:text-sm text-zinc-400 font-semibold block font-mono">
                          {edu.englishTitle}
                        </span>
                      )}
                    </div>

                    {/* Split columns presentation block */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                      
                      {/* Left Column: Explanation and Highlight elements */}
                      <div className="lg:col-span-7 space-y-6">
                        
                        {/* Immersive Explanation Text Box */}
                        <div 
                          className="p-5 sm:p-6 rounded-2xl border text-justify relative overflow-hidden"
                          style={{ 
                            borderColor: `${palette.stroke}30`,
                            background: theme === "dark" 
                              ? `linear-gradient(135deg, ${palette.stroke}0A, transparent)` 
                              : `linear-gradient(135deg, ${palette.stroke}05, transparent)`
                          }}
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                            style={{ backgroundColor: palette.stroke }}
                          />
                          <p className="text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium">
                            {edu.explanation}
                          </p>
                        </div>

                        {/* Curriculum key highlights */}
                        {edu.keyPoints && edu.keyPoints.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              ముఖ్యమైన అంశాలు (Curriculum Highlights)
                            </h4>
                            <div className="space-y-3">
                              {edu.keyPoints.map((pt, idx) => (
                                <div 
                                  key={idx}
                                  className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors flex gap-3 text-left"
                                >
                                  <span 
                                    className="size-6 rounded-full text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs"
                                    style={{ backgroundColor: palette.stroke }}
                                  >
                                    {idx + 1}
                                  </span>
                                  <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {pt}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Right Column: Examples, Study Tip, Summary */}
                      <div className="lg:col-span-5 space-y-5">
                        
                        {/* Summary / సారాంశం Block */}
                        <div className="p-5 rounded-2xl border border-indigo-500/10 dark:border-indigo-400/10 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-2 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block pb-1 border-b border-indigo-500/10 w-fit">
                            పాఠ్య సారాంశం (Summary of Topic)
                          </span>
                          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-350 leading-relaxed font-semibold">
                            ఈ పాఠం లో మనం "{edu.title}" గురించి క్షుణ్ణంగా చదువుకున్నాం. దీనికి సంబంధించిన ముఖ్య విభాగములను మననం చేసుకోవడం పరీక్షలలో చక్కటి ఫలితాలు సాధించడానికి సహాయపడుతుంది.
                          </p>
                        </div>

                        {/* Examples Box block */}
                        {edu.examples && edu.examples.length > 0 && (
                          <div className="p-5 rounded-2xl border border-teal-500/10 bg-teal-500/5 dark:bg-teal-500/10 space-y-2.5 text-left">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block pb-1 border-b border-teal-500/10 w-fit">
                              ఉదాహరణలు (Aesthetic Examples)
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300 leading-relaxed">
                              {edu.examples.join(", ")}
                            </p>
                          </div>
                        )}

                        {/* Interactive Study tip of curriculum */}
                        {edu.studyTip && (
                          <div className="p-5 rounded-2xl border border-amber-500/15 bg-amber-500/5 dark:bg-amber-500/10 flex gap-3 text-left">
                            <Sparkles className="size-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 block mb-0.5">
                                అధ్యయన చిట్కా (Pedagogy Study Hack)
                              </span>
                              <p className="text-xs text-zinc-600 dark:text-zinc-350 font-medium leading-relaxed">
                                {edu.studyTip}
                              </p>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* Collapsible Advanced Edit controls block positioned elegant under presentation card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-left shadow-2xs">
                  <details className="group">
                    <summary className="flex items-center justify-between text-xs font-bold text-zinc-450 dark:text-zinc-400 cursor-pointer list-none select-none">
                      <span className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors">
                        <Layers className="size-3.5 text-zinc-400" />
                        &nbsp;శాఖ నియంత్రణ పరికరాలు (Advanced Branch Editor)
                      </span>
                      <ChevronDown className="size-3.5 transition-transform group-open:rotate-180 text-zinc-400" />
                    </summary>

                    <div className="pt-4 space-y-4 animate-in fade-in duration-200">
                      {/* Edit branch input */}
                      <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2 font-mono">
                          రాత మార్చు (Edit Title / Node Text)
                        </span>
                        <button
                          onClick={() => startEditing(selectedNodeWithDetails.node.id, selectedNodeWithDetails.node.text)}
                          type="button"
                          className="px-4 py-2.5 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-zinc-700 dark:text-zinc-300 w-full"
                        >
                          <Edit3 className="size-3.5 text-indigo-500" />
                          అక్షరాలు మార్చు (Rename Heading)
                        </button>
                      </div>

                      {/* Add children subnode Form */}
                      <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 space-y-3">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block font-mono">
                          కొత్త ఉప కాన్సెప్ట్ (Add Subtopic Branch)
                        </span>
                        <form onSubmit={handleAddSubmit} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ఉదా: కొత్త భావన"
                            value={newSubtext}
                            onChange={(e) => setNewSubtext(e.target.value)}
                            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-750 dark:bg-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden"
                          />
                          <button
                            type="submit"
                            className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                          >
                            జోడించు
                          </button>
                        </form>
                      </div>

                      {/* Delete branch button */}
                      {selectedNodeWithDetails.node.id !== rootNode.id && (
                        <button
                          onClick={() => {
                            if (confirm(`"${selectedNodeWithDetails.node.text}" అనే शाखाను తొలగించాలా?`)) {
                              onDeleteNode(selectedNodeWithDetails.node.id);
                              onSelectNode(null);
                            }
                          }}
                          className="w-full py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-rose-600/15"
                        >
                          <Trash2 className="size-3.5" />
                          ఈ शाखाను తొలగించండి (Delete Branch)
                        </button>
                      )}
                    </div>
                  </details>
                </div>

              </div>
            </div>

            {/* Smart Navigation & Pagination Dock at footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg flex items-center justify-between px-6 sm:px-12">
              <button
                onClick={() => {
                  if (hasPrevSlide && prevSlideNodeId) {
                    onSelectNode(prevSlideNodeId);
                  }
                }}
                disabled={!hasPrevSlide}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all border ${
                  hasPrevSlide 
                    ? "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:border-zinc-700 dark:text-zinc-200" 
                    : "bg-zinc-100 border-zinc-100 text-zinc-300 dark:bg-zinc-90 w-fit cursor-not-allowed opacity-40 dark:text-zinc-650"
                }`}
              >
                <ChevronLeft className="size-4" />
                <span>మునుపటిది (Previous)</span>
              </button>

              {/* Dynamic Slide Counter indicator dots */}
              <div className="hidden sm:flex items-center gap-2">
                {Array.from({ length: Math.min(totalSlides, 8) }).map((_, dIdx) => {
                  const isActive = currentSlideIdx === dIdx || (dIdx === 7 && currentSlideIdx >= 7);
                  return (
                    <div 
                      key={dIdx} 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive 
                          ? "w-5 bg-orange-600" 
                          : "w-2 bg-zinc-205 dark:bg-zinc-750"
                      }`}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (hasNextSlide && nextSlideNodeId) {
                    onSelectNode(nextSlideNodeId);
                  }
                }}
                disabled={!hasNextSlide}
                className={`py-2.5 px-5 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                  hasNextSlide 
                    ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-md shadow-orange-500/10 hover:scale-[1.02] hover:shadow-lg" 
                    : "bg-zinc-100 text-zinc-300 dark:bg-zinc-90 w-fit cursor-not-allowed opacity-40 dark:text-zinc-650"
                }`}
              >
                <span>తరువాతిది (Next Topic)</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
