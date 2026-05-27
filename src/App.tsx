import React, { useState, useEffect, useRef } from "react";
import { SAMPLE_MAPS } from "./data/samples";
import { getAutoLayoutPositions } from "./lib/mindmapLayout";
import ControlPanel from "./components/ControlPanel";
import MindMapCanvas from "./components/MindMapCanvas";
import QuizSystem from "./components/QuizSystem";
import { MindMapNode, NodePositions, SavedMap, Theme } from "./types";
import { 
  RenameModal, 
  ShareModal, 
  SaveConfirmationModal,
  getCleanFilenamePrefix,
  DeleteConfirmationModal
} from "./components/Modals";
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  Check, 
  Info, 
  AlertCircle, 
  X,
  FileText,
  Activity,
  Menu,
  Minimize2,
  Sparkles,
  FolderOpen,
  Sun,
  Moon,
  Calendar,
  Share2,
  Edit3,
  Trash2
} from "lucide-react";

// Small visual preview thumbnail component representing the actual tree structure of saved lists
export function MindMapThumbnail({ rootNode }: { rootNode?: MindMapNode }) {
  if (!rootNode) return null;
  const children = rootNode.children || [];
  const childrenCount = children.length;
  
  return (
    <div className="w-full h-16 rounded-xl bg-zinc-100/60 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center overflow-hidden shrink-0 relative mt-2 mb-1">
      <svg className="w-full h-full max-w-[150px]" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Root Node Circle */}
        <circle cx={15} cy={20} r={4} className="fill-orange-600 stroke-orange-500/20" strokeWidth={1} />
        
        {children.slice(0, 4).map((child, idx) => {
          const startX = 15;
          const startY = 20;
          const endX = 55;
          const step = 30 / Math.max(1, childrenCount - 1 || 3);
          const endY = childrenCount <= 1 ? 20 : 5 + idx * step;
          const grandChildren = child.children || [];
          
          return (
            <g key={idx}>
              {/* Branch Connecting Arc Link */}
              <path 
                d={`M ${startX} ${startY} C ${(startX+endX)/2} ${startY}, ${(startX+endX)/2} ${endY}, ${endX} ${endY}`} 
                className="stroke-orange-500/40 dark:stroke-orange-500/30" 
                strokeWidth={1} 
              />
              {/* Intermediate Branch Circle */}
              <circle cx={endX} cy={endY} r={2.5} className="fill-orange-500 stroke-orange-400/20" strokeWidth={0.8} />
              
              {/* Sub-branch links and micro nodes */}
              {grandChildren.slice(0, 2).map((gc, gcIdx) => {
                const gcStartX = endX;
                const gcStartY = endY;
                const gcEndX = 85;
                const gcEndY = endY + (gcIdx === 0 ? -4 : 4);
                return (
                  <g key={gcIdx}>
                    <path 
                      d={`M ${gcStartX} ${gcStartY} Q ${(gcStartX+gcEndX)/2} ${gcStartY}, ${gcEndX} ${gcEndY}`} 
                      className="stroke-amber-400/30 dark:stroke-amber-400/20" 
                      strokeWidth={0.5} 
                    />
                    <circle cx={gcEndX} cy={gcEndY} r={1.2} className="fill-amber-400" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      {/* Absolute Node Count Mini Pill */}
      <span className="absolute bottom-1 right-2 px-1 rounded bg-zinc-200/90 dark:bg-zinc-850/80 text-[8px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
        శాఖలు: {childrenCount}
      </span>
    </div>
  );
}

export default function App() {
  // Theme settings
  const [theme, setTheme] = useState<Theme>(() => {
    const cached = localStorage.getItem("telugu-mindmap-theme");
    return (cached as Theme) || "dark";
  });

  // Master Mind Map Node hierarchy state
  const [rootNode, setRootNode] = useState<MindMapNode>(SAMPLE_MAPS[0].rootNode);

  // Active positions of nodes on coordinates plane
  const [positions, setPositions] = useState<NodePositions>(() => {
    return getAutoLayoutPositions(SAMPLE_MAPS[0].rootNode, new Set());
  });

  // Saved collection history list
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>(() => {
    const cached = localStorage.getItem("telugu-mind-maps");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached mind maps", e);
      }
    }
    return SAMPLE_MAPS;
  });

  const [currentMapId, setCurrentMapId] = useState<string | null>(SAMPLE_MAPS[0].id);

  const [originalText, setOriginalText] = useState<string>(() => {
    return SAMPLE_MAPS[0].originalText || "";
  });

  // Layout collapsed nodes tracker
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Interactive node selector state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Core loading trigger for AI calling
  const [isLoading, setIsLoading] = useState(false);

  // Search keyword filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Control Drawer state (collapsible interface)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Immersive Full Screen view mode (hides sidebar and node inspector to maximize viewport area)
  const [isFullViewMode, setIsFullViewMode] = useState(true);

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Modals visibility configurations
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [mapToDeleteId, setMapToDeleteId] = useState<string | null>(null);
  const [mapToDeleteTitle, setMapToDeleteTitle] = useState("");

  const [mapToRename, setMapToRename] = useState<SavedMap | null>(null);
  const [mapToShare, setMapToShare] = useState<SavedMap | null>(null);

  // Gallery visibility state
  const [isSavedListOpen, setIsSavedListOpen] = useState(false);

  // Quiz visibility state
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Ref container for cross-component triggers (e.g. SaveConfirmation trigger canvas image exports)
  const triggerPngExportRef = useRef<(() => void) | null>(null);
  // Ref container for PDF cross-component export
  const triggerPdfExportRef = useRef<(() => void) | null>(null);

  // Auto-download triggers pipeline after mind map is generated and saved
  const [autoDownloadPending, setAutoDownloadPending] = useState(false);

  useEffect(() => {
    if (autoDownloadPending && triggerPngExportRef.current && triggerPdfExportRef.current) {
      console.log("Automatic high-fidelity exports starting after render stabilization...");
      const timer = setTimeout(() => {
        try {
          if (triggerPngExportRef.current) {
            triggerPngExportRef.current();
          }
          if (triggerPdfExportRef.current) {
            triggerPdfExportRef.current();
          }
        } catch (e) {
          console.error("Auto export pipeline issue", e);
        }
        setAutoDownloadPending(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoDownloadPending, positions, rootNode]);

  // Theme synchronization effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("telugu-mindmap-theme", theme);
  }, [theme]);

  // Sync savedMaps to localstorage whenever it edits
  useEffect(() => {
    localStorage.setItem("telugu-mind-maps", JSON.stringify(savedMaps));
  }, [savedMaps]);

  // Decode Shared URL Parameters directly on mount for real, working link sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("map_data");
    if (data) {
      try {
        const decodedStr = decodeURIComponent(atob(data));
        const parsedNode = JSON.parse(decodedStr);
        if (parsedNode && parsedNode.text) {
          setRootNode(parsedNode);
          setCollapsedNodes(new Set());
          setCurrentMapId(null); // Custom shared maps start unsaved
          
          const freshLayout = getAutoLayoutPositions(parsedNode, new Set());
          setPositions(freshLayout);
          triggerToast("ఇతరులు పంచుకున్న పాఠ్యపటం విజయవంతంగా లోడ్ అయింది! (Shared Map loaded!)", "success");
          
          // Clear query parameter to keep url clean
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (err) {
        console.error("Failed to parse shared map data:", err);
        triggerToast("లింక్ లోడ్ చేయడంలో లోపం సంభవించింది.", "error");
      }
    }
  }, []);

  // Trigger self-expiring toasts
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper IP: auto-arrange nodes discarding all displacement overrides
  const handleAutoArrange = () => {
    const freshPositions = getAutoLayoutPositions(rootNode, collapsedNodes);
    setPositions(freshPositions);
    triggerToast("శాఖలు క్రమపద్ధతిలో అమర్చబడ్డాయి (Branches neatly arranged!)", "success");
  };

  // Recalculate auto-layout for newly added nodes or toggling of branches while keeping others
  const updateLayoutPositions = (newRoot: MindMapNode, currentCollapsed: Set<string>, keepDisplaced = true) => {
    const calculated = getAutoLayoutPositions(newRoot, currentCollapsed);
    if (!keepDisplaced) {
      setPositions(calculated);
      return;
    }

    // Keep existing custom offsets for already placed nodes, only add missing entries
    const mergedPositions = { ...positions };
    Object.keys(calculated).forEach((nodeId) => {
      if (!mergedPositions[nodeId]) {
        mergedPositions[nodeId] = calculated[nodeId];
      }
    });
    setPositions(mergedPositions);
  };

  // Helper to dynamically build a hierarchical mind map from raw Telugu text in case of offline/lack of key
  const parseTeluguToMindMap = (content: string): MindMapNode => {
    const lines = content
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const timestamp = Date.now();
    const rootText = lines[0] || "తెలుగు మైండ్ మ్యాప్ (New Mind Map)";

    const rootNode: MindMapNode = {
      id: `root-${timestamp}`,
      text: rootText,
      children: [],
    };

    if (lines.length <= 1) {
      const sentences = content
        .split(/[।.?!,;]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2);

      if (sentences.length > 1) {
        sentences.forEach((sentence, idx) => {
          rootNode.children!.push({
            id: `node-${timestamp}-sub-${idx}`,
            text: sentence,
            children: [],
          });
        });
      } else {
        rootNode.children!.push({
          id: `node-${timestamp}-sub-1`,
          text: "కీలక అంశం (Core Concept)",
          children: [
            {
              id: `node-${timestamp}-sub-1-child-1`,
              text: rootText,
            },
          ],
        });
      }
      return rootNode;
    }

    let currentSubtopic: MindMapNode | null = null;
    let subCounter = 0;
    let childCounter = 0;

    for (let i = 1; i < lines.length; i++) {
      const origLine = lines[i];
      const isBullet = /^[•\-*#+0-9]/.test(origLine);
      const cleanLine = origLine.replace(/^[•\-*#+\d\s.)(]+/, "").trim();
      if (cleanLine.length === 0) continue;

      if (!isBullet || !currentSubtopic) {
        subCounter++;
        currentSubtopic = {
          id: `node-${timestamp}-sub-${subCounter}`,
          text: cleanLine,
          children: [],
        };
        rootNode.children!.push(currentSubtopic);
      } else {
        childCounter++;
        currentSubtopic.children!.push({
          id: `node-${timestamp}-child-${childCounter}`,
          text: cleanLine,
        });
      }
    }

    if (rootNode.children!.length === 0) {
      rootNode.children!.push({
        id: `node-${timestamp}-sub-1`,
        text: "ముఖ్యమైన భావాలు (Key Concepts)",
        children: lines.slice(1).map((l, idx) => ({
          id: `node-${timestamp}-child-${idx}`,
          text: l,
        })),
      });
    }

    return rootNode;
  };

  const ensureUniqueIds = (node: MindMapNode, prefix: string): MindMapNode => {
    return {
      ...node,
      id: `${prefix}-${node.id || Math.floor(Math.random() * 1000000)}`,
      children: node.children
        ? node.children.map((child, i) => ensureUniqueIds(child, `${prefix}-${i}`))
        : undefined,
    };
  };

  // 1. Generate core Mind Map via server-side Gemini agent route
  const handleGenerateMindMap = async (content: string) => {
    setIsLoading(true);
    setSelectedNodeId(null);
    setSearchQuery("");
    setOriginalText(content);
    
    try {
      const response = await fetch("/api/generate-mind-map", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "ఆటంకం ఏర్పడింది. సర్వర్ ప్రతిస్పందించలేదు.");
      }

      const generatedData = await response.json();
      
      if (!generatedData.id || !generatedData.text) {
        throw new Error("సరైన మైండ్ మ్యాప్ నమూనా లోడ్ కాలేదు.");
      }

      const cleanGeneratedData = ensureUniqueIds(generatedData, `gen-${Date.now()}`);

      setRootNode(cleanGeneratedData);
      setCollapsedNodes(new Set());
      
      // Compute pristine centered positions
      const freshLayout = getAutoLayoutPositions(cleanGeneratedData, new Set());
      setPositions(freshLayout);

      // Auto-save generated map immediately
      const plainTitle = cleanGeneratedData.text.split("\n")[0] || "తెలుగు మైండ్ మ్యాప్";
      const mapId = `saved-${Date.now()}`;
      const freshMapJson: SavedMap = {
        id: mapId,
        title: plainTitle,
        description: `కృత్రిమ మేధతో సృష్టించినది • ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        rootNode: cleanGeneratedData,
        positions: freshLayout,
        originalText: content
      };

      setSavedMaps((prev) => [freshMapJson, ...prev]);
      setCurrentMapId(mapId);
      setAutoDownloadPending(true); // Initiate automatic PDF + PNG download pipeline
      
      triggerToast("మైండ్ మ్యాప్ విజయవంతంగా సృష్టించబడింది! (Mind Map Generated Successfully)", "success");
      setTimeout(() => {
        triggerToast("మైండ్ మ్యాప్ విజయవంతంగా సేవ్ చేయబడింది! (Mind Map Saved Successfully)", "success");
      }, 1000);
    } catch (error: any) {
      console.warn("API mind map generation failed, using optimized local generator:", error);
      
      // Fallback: Generate custom map directly matching typed text instead of recycler data
      const localData = parseTeluguToMindMap(content);
      const cleanGeneratedData = ensureUniqueIds(localData, `local-gen-${Date.now()}`);

      setRootNode(cleanGeneratedData);
      setCollapsedNodes(new Set());
      
      const freshLayout = getAutoLayoutPositions(cleanGeneratedData, new Set());
      setPositions(freshLayout);

      // Save offline-generated map immediately 
      const plainTitle = cleanGeneratedData.text.split("\n")[0] || "తెలుగు మైండ్ మ్యాప్";
      const mapId = `saved-${Date.now()}`;
      const freshMapJson: SavedMap = {
        id: mapId,
        title: plainTitle,
        description: `సృష్టించినది (ఆఫ్‌లైన్ ఎడిటర్) • ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        rootNode: cleanGeneratedData,
        positions: freshLayout,
        originalText: content
      };

      setSavedMaps((prev) => [freshMapJson, ...prev]);
      setCurrentMapId(mapId);
      setAutoDownloadPending(true); // Initiate automatic PDF + PNG download pipeline
      
      triggerToast("మైండ్ మ్యాప్ విజయవంతంగా సృష్టించబడింది! (Mind Map Generated Successfully)", "success");
      setTimeout(() => {
        triggerToast("మైండ్ మ్యాప్ విజయవంతంగా సేవ్ చేయబడింది! (Mind Map Saved Successfully)", "success");
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to verify if positions array flows in a strict horizontal left-to-right (LTR) tree structure
  const isCompatibleLayout = (root: MindMapNode, pos: NodePositions | undefined): boolean => {
    if (!pos || Object.keys(pos).length === 0) return false;
    
    // Root position should be reasonably anchored to the left
    const rootPos = pos[root.id];
    if (!rootPos || rootPos.x < 10 || rootPos.x > 180) return false;
    
    let compatible = true;
    const checkNode = (node: MindMapNode, parentX: number) => {
      if (!compatible) return;
      const currentPos = pos[node.id];
      if (!currentPos) {
        compatible = false;
        return;
      }
      // Children must extend strictly to the right of their parents
      if (currentPos.x <= parentX) {
        compatible = false;
        return;
      }
      if (node.children) {
        node.children.forEach((child) => checkNode(child, currentPos.x));
      }
    };
    
    if (root.children) {
      root.children.forEach((child) => checkNode(child, rootPos.x));
    }
    return compatible;
  };

  // 2. Select Saved / Default Template maps from sidebar
  const handleSelectSavedMap = (id: string) => {
    const map = savedMaps.find((m) => m.id === id);
    if (!map) return;

    setRootNode(map.rootNode);
    setCollapsedNodes(new Set());
    setCurrentMapId(map.id);
    setSelectedNodeId(null);
    setOriginalText(map.originalText || "");

    // If map has specific left-to-right matching coordinates saved, load those, otherwise regenerate layout
    if (map.positions && isCompatibleLayout(map.rootNode, map.positions)) {
      setPositions(map.positions);
    } else {
      console.log("Incompatible layout coordinates detected, regenerating LTR tree...");
      const LtrPositions = getAutoLayoutPositions(map.rootNode, new Set());
      setPositions(LtrPositions);
      
      // Auto-update and backport the saved map with reconstructed coordinates in local collections
      const updatedMaps = savedMaps.map((sm) => {
        if (sm.id === map.id) {
          return { ...sm, positions: LtrPositions };
        }
        return sm;
      });
      setSavedMaps(updatedMaps);
    }
    
    triggerToast(`"${map.title}" విజయవంతంగా లోడ్ అయింది (Map loaded)`, "success");
  };

  // 3. Save Active Map to Collection (Local Persistence & Confirmation prompt)
  const handleSaveCurrentMap = () => {
    if (!rootNode.text) return;
    
    const plainTitle = rootNode.text.split("\n")[0];
    const mapId = currentMapId || `saved-${Date.now()}`;
    
    // Check if updating existing
    const existingIndex = savedMaps.findIndex((m) => m.id === mapId);
    
    const freshMapJson: SavedMap = {
      id: mapId,
      title: plainTitle || "నా కస్టమ్ మైండ్ మ్యాప్",
      description: `వినియోగదారు సవరించిన మైండ్ మ్యాప్. సృష్టించిన తేదీ: ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      rootNode: rootNode,
      positions: positions,
      originalText: originalText
    };

    if (existingIndex !== -1) {
      const updated = [...savedMaps];
      updated[existingIndex] = freshMapJson;
      setSavedMaps(updated);
    } else {
      setSavedMaps([freshMapJson, ...savedMaps]);
    }
    
    setCurrentMapId(mapId);
    
    // Toggle simulated android download confirmation panel
    setIsSaveConfirmationOpen(true);
  };

  // 4. Delete Map from Collection
  const handleDeleteSavedMap = (id: string) => {
    try {
      const filtered = savedMaps.filter((m) => m.id !== id);
      setSavedMaps(filtered);
      
      // Instantly sync with localStorage to prevent stale state issues or reappearance on page refresh
      localStorage.setItem("telugu-mind-maps", JSON.stringify(filtered));
      
      // Remove associated PNG/PDF files if they represent anything in localStorage
      localStorage.removeItem(`telugu-mind-map-png-${id}`);
      localStorage.removeItem(`telugu-mind-map-pdf-${id}`);
      
      if (currentMapId === id) {
        setCurrentMapId(null);
      }
      triggerToast("మైండ్ మ్యాప్ విజయవంతంగా తొలగించబడింది! (Mind Map Deleted Successfully)", "success");
    } catch (err: any) {
      console.error("Failed to delete mind map:", err);
      triggerToast("మైండ్ మ్యాప్‌ను తొలగించడంలో విఫలమైంది (Failed to delete mind map)", "error");
    }
  };

  const handleTriggerDelete = (id: string) => {
    const targetMap = savedMaps.find((m) => m.id === id);
    if (targetMap) {
      setMapToDeleteId(id);
      setMapToDeleteTitle(targetMap.title);
      setIsDeleteOpen(true);
    }
  };

  // 5. Rename Map entry directly
  const handleRenameSavedMap = (id: string, newTitle: string) => {
    const updated = savedMaps.map((map) => {
      if (map.id === id) {
        return {
          ...map,
          title: newTitle,
          rootNode: { ...map.rootNode, text: newTitle } // Sync root node labels instantly
        };
      }
      return map;
    });
    setSavedMaps(updated);

    if (currentMapId === id) {
      setRootNode((prev) => ({ ...prev, text: newTitle }));
    }

    triggerToast(`"${newTitle}" కి పేరు విజయవంతంగా మార్చబడింది!`, "success");
  };

  // 6. Import Map from local JSON storage files click upload
  const handleImportMap = (root: MindMapNode, title: string, customPositions?: NodePositions) => {
    setRootNode(root);
    setCollapsedNodes(new Set());
    setSelectedNodeId(null);

    const calculatedPos = getAutoLayoutPositions(root, new Set());
    const finalPos = customPositions || calculatedPos;
    setPositions(finalPos);

    // Save as a new saved record
    const newSavedId = `imported-${Date.now()}`;
    const freshMap: SavedMap = {
      id: newSavedId,
      title: title || "దిగుమతి చేసిన మైండ్ మ్యాప్",
      description: `దిగుమతి చేసుకున్న మైండ్ మ్యాప్. తేదీ: ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      rootNode: root,
      positions: finalPos
    };

    setSavedMaps((prev) => [freshMap, ...prev]);
    setCurrentMapId(newSavedId);
    triggerToast("JSON మైండ్ మ్యాప్ విజయవంతంగా దిగుమతి చేయబడింది!", "success");
  };

  // Trigger rename prompt drawer
  const handleTriggerRename = (map: SavedMap) => {
    setMapToRename(map);
    setIsRenameOpen(true);
  };

  // Trigger sharing pop sheet
  const handleTriggerShare = (map: SavedMap) => {
    setMapToShare(map);
    setIsShareOpen(true);
  };

  // Toggle full view mode
  const handleToggleFullViewMode = () => {
    setIsFullViewMode((prev) => {
      const nextVal = !prev;
      setIsSidebarCollapsed(nextVal);
      return nextVal;
    });
    triggerToast(
      !isFullViewMode 
        ? "మ్యాప్ పూర్తి స్క్రీన్ వ్యూ ఆన్ లో ఉంది (Full viewport mode)" 
        : "సాధారణ వ్యూ లోడ్ అయింది (Panels displayed)", 
      "info"
    );
  };

  // File Download Helpers
  const handleJsonDownload = () => {
    const plainTitle = rootNode.text.split("\n")[0] || "Custom_Map";
    const filenamePrfx = getCleanFilenamePrefix(plainTitle);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
    const filename = `${filenamePrfx}_${dateStr}.json`;

    const downloadData = {
      id: currentMapId || `saved-${Date.now()}`,
      title: plainTitle,
      createdAt: new Date().toISOString(),
      rootNode: rootNode,
      positions: positions
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePngDownload = () => {
    if (triggerPngExportRef.current) {
      triggerPngExportRef.current();
    } else {
      triggerToast("PNG బొమ్మ తయారవుతోంది. దయచేసి మళ్లీ ప్రయత్నించండి.", "error");
    }
  };

  const handlePdfDownload = () => {
    if (triggerPdfExportRef.current) {
      triggerPdfExportRef.current();
    } else {
      triggerToast("PDF පత్రం తయారవుతోంది. దయచేసి మళ్లీ ప్రయత్నించండి.", "error");
    }
  };

  // Immutably Update node text in recursive tree
  const updateNodeTextInTree = (node: MindMapNode, targetId: string, text: string): MindMapNode => {
    if (node.id === targetId) {
      return { ...node, text };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map((child) => updateNodeTextInTree(child, targetId, text))
      };
    }
    return node;
  };

  const handleUpdateNodeText = (nodeId: string, newText: string) => {
    const updatedTree = updateNodeTextInTree(rootNode, nodeId, newText);
    setRootNode(updatedTree);
    updateLayoutPositions(updatedTree, collapsedNodes);
  };

  // Immutably Add node in recursive tree
  const addNodeInTree = (node: MindMapNode, parentId: string, text: string): MindMapNode => {
    if (node.id === parentId) {
      const newChild: MindMapNode = {
        id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        text,
        children: []
      };
      return {
        ...node,
        children: node.children ? [...node.children, newChild] : [newChild]
      };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map((child) => addNodeInTree(child, parentId, text))
      };
    }
    return node;
  };

  const handleAddSubNode = (parentNodeId: string, nodeText = "కొత్త కాన్సెప్ట్ (New concept)") => {
    const updatedTree = addNodeInTree(rootNode, parentNodeId, nodeText);
    setRootNode(updatedTree);
    updateLayoutPositions(updatedTree, collapsedNodes);
    triggerToast("కొత్త ఉపశాఖ జోడించబడింది! (Sub-node added)", "success");
  };

  // Immutably Delete node in recursive tree
  const deleteNodeInTree = (node: MindMapNode, targetId: string): MindMapNode | null => {
    if (node.id === targetId) {
      return null;
    }
    if (node.children) {
      return {
        ...node,
        children: node.children
          .map((child) => deleteNodeInTree(child, targetId))
          .filter((child): child is MindMapNode => child !== null)
      };
    }
    return node;
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedTree = deleteNodeInTree(rootNode, nodeId);
    if (!updatedTree) {
      triggerToast("మెయిన్ నోడ్‌ను తొలగించలేరు!", "error");
      return;
    }
    setRootNode(updatedTree);
    
    // Clear dead positions coordinate cache
    const cleanedPos = { ...positions };
    delete cleanedPos[nodeId];
    setPositions(cleanedPos);
    
    updateLayoutPositions(updatedTree, collapsedNodes);
    triggerToast("నోడ్ విజయవంతంగా తొలగించబడింది (Node deleted)", "info");
  };

  // Collapse / Expand Toggle
  const handleToggleCollapse = (nodeId: string) => {
    const nextCollapsed = new Set<string>(collapsedNodes);
    if (nextCollapsed.has(nodeId)) {
      nextCollapsed.delete(nodeId);
    } else {
      nextCollapsed.add(nodeId);
    }
    setCollapsedNodes(nextCollapsed);
    // Recalculate auto layouts for all active nodes since tree shape morphed
    updateLayoutPositions(rootNode, nextCollapsed, false);
  };

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
      theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    }`}>
      
      {/* Prime Educational Global Header */}
      {!isFullViewMode && (
        <header className={`px-4 py-3 border-b flex items-center justify-between gap-4 z-20 shrink-0 ${
          theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"
        }`}>
          <div className="flex items-center gap-2">
            {/* Menu expand button on mobile if collapsed */}
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="md:hidden p-2 rounded-xl bg-orange-650/15 hover:bg-orange-650/25 text-orange-600 dark:text-orange-400 cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="size-4" />
            </button>
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-500/20">
              <Sparkles className="size-4 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">తెలుగు AI మైండ్ మ్యాప్</h1>
              <span className="text-[10px] text-zinc-400 font-semibold block">Telugu AI Mind Map Builder</span>
            </div>
          </div>

          {/* Saved Mind Maps Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSavedListOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white hover:text-white shadow-md flex items-center gap-2 cursor-pointer transition-all border border-orange-500/25 relative"
            >
              <FolderOpen className="size-4" />
              <span>నా మైండ్ మ్యాప్‌లు (Saved Mind Maps)</span>
              {savedMaps.length > 0 && (
                <span className="size-4.5 bg-white text-orange-600 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shadow-xs">
                  {savedMaps.length}
                </span>
              )}
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 dark:text-teal-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ఆఫ్‌లైన్ ఎడిటర్ సిద్ధంగా ఉంది
              </span>
            </div>

            <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800" />

            {/* Theme Switcher */}
            <button
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? "Light Theme" : "Dark Theme"}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-indigo-500" />}
            </button>
          </div>
        </header>
      )}
      
      {/* Dynamic Overlay Success/Info Toasts */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce animate-duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 backdrop-blur-md ${
            toast.type === "success" 
              ? "bg-emerald-600/90 border-emerald-500 text-white" 
              : toast.type === "error" 
              ? "bg-red-650/90 border-red-500 text-white" 
              : "bg-indigo-600/90 border-indigo-500 text-white"
          }`}>
            {toast.type === "success" ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Beautiful Saved Mind Maps Interactive Gallery Overlaid Modal */}
      {isSavedListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200 bg-black/60">
          <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-200 ${
            theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-800"
          }`}>
            {/* Gallery Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                  <FolderOpen className="size-5.5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">నా మైండ్ మ్యాప్‌లు (Saved Mind Maps Gallery)</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">మొత్తం సేవ్ చేసిన పాఠాలు మరియు భావనలు • {savedMaps.length} మైండ్ మ్యాప్‌లు</p>
                </div>
              </div>
              <button
                onClick={() => setIsSavedListOpen(false)}
                className="p-2.5 rounded-xl hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-350 transition-all cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Gallery Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar">
              {savedMaps.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <FolderOpen className="size-16 text-zinc-400 dark:text-zinc-700 mb-4 stroke-[1.5]" />
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">సేవ్ చేసిన మైండ్ మ్యాప్‌లు ఏవీ లేవు!</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                    మీరు సృష్టించు (Creator) ట్యాబ్ ఉపయోగించి నక్షత్రాలు, సౌర కుటుంబం లేదా భాషా భాగాలపై ఒక కొత్త మైండ్ మ్యాప్ సృష్టించండి లేదా దిగుమతి చేయండి!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {savedMaps.map((map) => {
                    const isActive = map.id === currentMapId;
                    return (
                      <div
                        key={map.id}
                        onClick={() => {
                          handleSelectSavedMap(map.id);
                          setIsSavedListOpen(false);
                          setIsFullViewMode(true);
                          setIsSidebarCollapsed(true);
                        }}
                        className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative text-left cursor-pointer hover:shadow-md hover:scale-[1.01] duration-200 ${
                          isActive
                            ? "bg-orange-500/10 border-orange-500/40 text-zinc-900 dark:bg-orange-950/20 dark:text-zinc-100"
                            : "bg-zinc-50 hover:bg-zinc-100/80 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-950/30 dark:hover:bg-zinc-950/60 dark:border-zinc-850 dark:hover:border-zinc-800"
                        }`}
                      >
                        {/* Title & Description */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-sm font-bold tracking-tight line-clamp-1 text-zinc-900 dark:text-zinc-50">
                              {map.title}
                            </h4>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-orange-600 text-white shrink-0 shadow-sm shadow-orange-500/20">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 italic leading-relaxed min-h-[32px]">
                            {map.description || "వినియోగదారు సేవ్ చేసిన తెలుగు మైండ్ మ్యాప్."}
                          </p>
                          
                          {/* Visual branching preview thumbnail */}
                          <MindMapThumbnail rootNode={map.rootNode} />
                          
                          <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-zinc-400 font-medium font-mono">
                            <span className="flex items-center gap-1 text-[9px] bg-zinc-100 dark:bg-zinc-850 px-2.5 py-0.5 rounded-lg">
                              <Calendar className="size-3" />
                              {new Date(map.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Buttons footer inside gallery card */}
                        <div className="mt-5 pt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              handleSelectSavedMap(map.id);
                              setIsSavedListOpen(false);
                              // Auto full screen view mode when view/opening from gallery if selected
                              setIsFullViewMode(true);
                              setIsSidebarCollapsed(true);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 cursor-pointer flex items-center gap-1.5 shadow-sm transition-all flex-1 justify-center"
                          >
                            <span>ఇంటరాక్టివ్ వ్యూ (Open)</span>
                          </button>

                          <div className="flex items-center gap-0.5">
                            {/* Share */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerShare(map);
                              }}
                              className="p-2 rounded-xl hover:bg-orange-500/15 text-zinc-400 hover:text-orange-650 dark:hover:text-orange-400 cursor-pointer transition-colors"
                              title="Share map"
                            >
                              <Share2 className="size-4" />
                            </button>

                            {/* Rename */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerRename(map);
                              }}
                              className="p-2 rounded-xl hover:bg-orange-500/15 text-zinc-400 hover:text-orange-650 dark:hover:text-orange-400 cursor-pointer transition-colors"
                              title="Rename map"
                            >
                              <Edit3 className="size-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMapToDeleteId(map.id);
                                setMapToDeleteTitle(map.title);
                                setIsDeleteOpen(true);
                              }}
                              className="p-2 rounded-xl hover:bg-red-500/15 text-zinc-455 hover:text-red-500 cursor-pointer transition-colors"
                              title="Delete map"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gallery Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 text-[10px] text-zinc-400 flex justify-between items-center px-6">
              <span>ఆఫ్‌లైన్ ఎడిషన్ ప్రైవేట్ సింక్ యాక్టివ్</span>
              <span>బిల్డ్ ప్రెсиషన్: v1.1</span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Dashboard wrapper */}
      <div className="flex-1 flex overflow-hidden w-full relative">

        {/* Pull-out menu button when sidebar is collapsed globally (Mobile/Desktop friendly) */}
        {isSidebarCollapsed && (
          <button
            onClick={() => {
              setIsSidebarCollapsed(false);
              setIsFullViewMode(false);
            }}
            className="absolute top-4 left-4 z-20 p-2.5 rounded-xl bg-orange-600 text-white shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center cursor-pointer border border-orange-500"
            title="Show Control Sidebar"
          >
            <Menu className="size-4.5" />
          </button>
        )}

        {/* 1. Collapsible Controls Intake Sidebar */}
        <ControlPanel
          onGenerate={handleGenerateMindMap}
          isLoading={isLoading}
          savedMaps={savedMaps}
          currentMapId={currentMapId}
          onSelectSavedMap={handleSelectSavedMap}
          onSaveCurrentMap={handleSaveCurrentMap}
          onDeleteSavedMap={handleTriggerDelete}
          onTriggerRename={handleTriggerRename}
          onTriggerShare={handleTriggerShare}
          onImportMap={handleImportMap}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            setIsSidebarCollapsed((prev) => !prev);
            setIsFullViewMode(false);
          }}
        />

        {/* 2. Main Content Canvas Arena (Contains search bar, zoom toolbar, inspector pane) */}
        <div className="flex-1 h-full flex flex-col overflow-hidden relative">
          
          {/* Top Search Toolbar */}
          {!isFullViewMode && (
            <div className={`p-3.5 border-b flex items-center justify-between gap-4 scale-100 ${
              theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
            }`}>
              {/* Search Input Container */}
              <div className="relative flex-1 max-w-sm">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="నోడ్ల సమాచారాన్ని వెతకండి... (Search node text)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-zinc-300 bg-white placeholder-zinc-400 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-650 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Immersive Floating Badge when Full View mode is highlighted */}
              {isFullViewMode && (
                <button
                  onClick={handleToggleFullViewMode}
                  className="px-3 py-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] shadow-md flex items-center gap-1 cursor-pointer animate-pulse transition-all shrink-0"
                >
                  <Minimize2 className="size-3 shrink-0" />
                  <span>ప్యానెల్స్ చూపించు (Restore Panels)</span>
                </button>
              )}

              {/* Application Info Badge / Description */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 dark:text-teal-400 flex items-center gap-1">
                  <Activity className="size-3 animate-pulse" />
                  ఆఫ్‌లైన్ ఎడిటర్ సిద్ధంగా ఉంది (Offline Sync Active)
                </span>
              </div>
            </div>
          )}

          {/* Core Interactive Map Canvas element */}
          <div className="flex-1 relative overflow-hidden">
            {isLoading ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 backdrop-blur-md bg-zinc-950/20 dark:bg-zinc-950/40">
                <div className="p-4 rounded-full bg-orange-600 text-white shadow-xl animate-spin relative mb-4">
                  <Activity className="size-8" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white block">తెలుగు పాఠాన్ని విశ్లేషిస్తోంది...</h2>
                <p className="text-xs text-zinc-450 mt-1.5 text-center max-w-xs leading-relaxed">
                  కృత్రిమ మేధస్సు (AI) ప్రధాన శీర్షికలు, ముఖ్యాంశాలు మరియు సంబంధాలను వర్గీకృతంగా విడగొడుతోంది. దయచేసి వేచి ఉండండి.
                </p>
                
                {/* Visual indicator of intelligence task steps */}
                <div className="mt-8 space-y-2.5 w-60 text-[10px] text-zinc-400">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>వాక్యం విభజన పూర్తి</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span>శీర్షికల నిర్మాణం ఏర్పడుతోంది</span>
                  </div>
                </div>
              </div>
            ) : null}

            <MindMapCanvas
              rootNode={rootNode}
              positions={positions}
              onUpdatePositions={setPositions}
              onUpdateNodeText={handleUpdateNodeText}
              onAddSubNode={handleAddSubNode}
              onDeleteNode={handleDeleteNode}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={handleToggleCollapse}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              theme={theme}
              searchQuery={searchQuery}
              onAutoArrange={handleAutoArrange}
              onSaveMindMap={handleSaveCurrentMap}
              triggerPngExportRef={triggerPngExportRef}
              triggerPdfExportRef={triggerPdfExportRef}
              isFullViewMode={isFullViewMode}
              onToggleFullViewMode={handleToggleFullViewMode}
              onOpenGallery={() => setIsSavedListOpen(true)}
              originalText={originalText}
              onOpenQuiz={() => setIsQuizOpen(true)}
            />
          </div>

        </div>

      </div>

      {/* Floating Modals System */}
      <RenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        mapToRename={mapToRename}
        onRename={handleRenameSavedMap}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false);
          setMapToShare(null);
        }}
        rootNode={mapToShare ? mapToShare.rootNode : rootNode}
        mapTitle={mapToShare ? mapToShare.title : (rootNode.text.split("\n")[0] || "")}
      />

      <SaveConfirmationModal
        isOpen={isSaveConfirmationOpen}
        onClose={() => setIsSaveConfirmationOpen(false)}
        title={rootNode.text.split("\n")[0] || "నా కస్టమ్ మైండ్ మ్యాప్"}
        onJsonDownload={handleJsonDownload}
        onPngDownload={handlePngDownload}
        onPdfDownload={handlePdfDownload}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setMapToDeleteId(null);
          setMapToDeleteTitle("");
        }}
        mapTitle={mapToDeleteTitle}
        onConfirm={() => {
          if (mapToDeleteId) {
            handleDeleteSavedMap(mapToDeleteId);
          }
        }}
      />

      {isQuizOpen && (
        <QuizSystem
          onClose={() => setIsQuizOpen(false)}
          originalText={originalText}
          rootNode={rootNode}
          theme={theme}
          selectedNodeId={selectedNodeId}
          mapId={currentMapId}
          mapTitle={rootNode.text}
        />
      )}

    </div>
  );
}
