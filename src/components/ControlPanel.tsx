import React, { useState } from "react";
import { SavedMap, Theme, MindMapNode, NodePositions } from "../types";
import { SAMPLE_TEXTS } from "../data/sampleTexts";
import { getAutoLayoutPositions } from "../lib/mindmapLayout";
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  History, 
  Trash2, 
  Menu, 
  Sun, 
  Moon, 
  AlertCircle,
  FolderOpen,
  Share2,
  Edit2,
  UploadCloud,
  FileText,
  BadgeAlert,
  ArrowUpRight
} from "lucide-react";

interface ControlPanelProps {
  onGenerate: (content: string) => void;
  isLoading: boolean;
  savedMaps: SavedMap[];
  currentMapId: string | null;
  onSelectSavedMap: (id: string) => void;
  onSaveCurrentMap: () => void;
  onDeleteSavedMap: (id: string) => void;
  onTriggerRename: (map: SavedMap) => void;
  onTriggerShare: (map: SavedMap) => void;
  onImportMap: (root: MindMapNode, title: string, positions?: NodePositions) => void;
  theme: Theme;
  onToggleTheme: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type ActiveTab = "create" | "saved" | "import";

// Small visual preview thumbnail component representing the actual tree structure of saved lists in sidebar
export function MindMapThumbnail({ rootNode }: { rootNode?: MindMapNode }) {
  if (!rootNode) return null;
  const children = rootNode.children || [];
  const childrenCount = children.length;
  
  return (
    <div className="w-full h-11 rounded-lg bg-zinc-100/60 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850/50 flex items-center justify-center overflow-hidden shrink-0 relative mt-1.5 mb-0.5">
      <svg className="w-full h-full max-w-[120px]" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx={15} cy={20} r={3} className="fill-orange-600 stroke-orange-500/20" strokeWidth={0.8} />
        {children.slice(0, 4).map((child, idx) => {
          const startX = 15;
          const startY = 20;
          const endX = 55;
          const step = 30 / Math.max(1, childrenCount - 1 || 3);
          const endY = childrenCount <= 1 ? 20 : 5 + idx * step;
          const grandChildren = child.children || [];
          
          return (
            <g key={idx}>
              <path 
                d={`M ${startX} ${startY} C ${(startX+endX)/2} ${startY}, ${(startX+endX)/2} ${endY}, ${endX} ${endY}`} 
                className="stroke-orange-500/40 dark:stroke-orange-500/30" 
                strokeWidth={0.8} 
              />
              <circle cx={endX} cy={endY} r={1.8} className="fill-orange-500 stroke-orange-400/20" strokeWidth={0.5} />
              {grandChildren.slice(0, 1).map((gc, gcIdx) => {
                const gcStartX = endX;
                const gcStartY = endY;
                const gcEndX = 85;
                const gcEndY = endY;
                return (
                  <g key={gcIdx}>
                    <path 
                      d={`M ${gcStartX} ${gcStartY} L ${gcEndX} ${gcEndY}`} 
                      className="stroke-amber-400/30 dark:stroke-amber-400/20" 
                      strokeWidth={0.5} 
                    />
                    <circle cx={gcEndX} cy={gcEndY} r={0.8} className="fill-amber-400" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <span className="absolute bottom-1 right-1.5 px-1 rounded bg-zinc-200/80 dark:bg-zinc-800/80 text-[7px] font-mono font-bold text-zinc-500 dark:text-zinc-400 scale-90">
        శాఖలు: {childrenCount}
      </span>
    </div>
  );
}

export default function ControlPanel({
  onGenerate,
  isLoading,
  savedMaps,
  currentMapId,
  onSelectSavedMap,
  onSaveCurrentMap,
  onDeleteSavedMap,
  onTriggerRename,
  onTriggerShare,
  onImportMap,
  theme,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse
}: ControlPanelProps) {
  const [inputText, setInputText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("create");
  const [dragActive, setDragActive] = useState(false);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedTemplate(key);
    if (key && SAMPLE_TEXTS[key]) {
      setInputText(SAMPLE_TEXTS[key]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onGenerate(inputText.trim());
  };

  // Direct JSON File Parser & Uploader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseAndLoadFile(file);
  };

  const parseAndLoadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const parsed = JSON.parse(resultText);

        let root: MindMapNode | null = null;
        let title = file.name.replace(".json", "").replace(/_/g, " ");
        let positions: NodePositions | undefined;

        if (parsed.rootNode && parsed.rootNode.text) {
          root = parsed.rootNode;
          title = parsed.title || root.text.split("\n")[0];
          positions = parsed.positions;
        } else if (parsed.text) {
          root = parsed;
          title = root.text.split("\n")[0];
        }

        if (!root) {
          throw new Error("Invalid structure");
        }

        onImportMap(root, title, positions);
        setActiveTab("saved");
      } catch (err) {
        alert("ఫైల్ లోడ్ చేయడంలో విఫలమైంది. దయచేసి సరైన తెలుగు మైండ్ మ్యాప్ JSON ఫైల్‌ని ఉపయోగించండి.");
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseAndLoadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`h-full border-r flex flex-col transition-all duration-300 relative shrink-0 z-10 ${
        isCollapsed ? "w-0 border-r-0 overflow-hidden" : "w-full md:w-85 lg:w-96"
      } ${
        theme === "dark" 
          ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
          : "bg-white border-zinc-200 text-zinc-800"
      }`}
    >
      {/* Sidebar Header with Theme toggle & Brand name */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-500/20">
            <Sparkles className="size-4 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Telugu AI Mind Map</h1>
            <span className="text-[10px] text-zinc-400 font-semibold block">తెలుగు విజువల్ లెర్నింగ్</span>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          {theme === "dark" ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-indigo-500" />}
        </button>
      </div>

      {/* Modern High-Fidelity Interactive Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === "create" 
              ? "border-orange-500 text-orange-600 dark:text-orange-400 font-bold bg-white dark:bg-zinc-900" 
              : "border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/50 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/50"
          }`}
        >
          సృష్టించు (Creator)
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer relative ${
            activeTab === "saved" 
              ? "border-orange-500 text-orange-600 dark:text-orange-400 font-bold bg-white dark:bg-zinc-900" 
              : "border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/50 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/50"
          }`}
        >
          పటాలు (Saved Lists)
          {savedMaps.length > 0 && (
            <span className="absolute top-1.5 right-2 size-4.5 bg-orange-600 text-white rounded-full flex items-center justify-center text-[9px] font-mono shadow-xs">
              {savedMaps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === "import" 
              ? "border-orange-500 text-orange-600 dark:text-orange-400 font-bold bg-white dark:bg-zinc-900" 
              : "border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/50 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/50"
          }`}
        >
          దిగుమతి (Import)
        </button>
      </div>

      {/* Tab Panels Body Wrapper */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* PANEL A: Creator Work area */}
        {activeTab === "create" && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <BookOpen className="size-4 text-orange-500" />
                  పాఠ్య వచనం / ముఖ్యాంశాలు (Paste Lesson)
                </label>
              </div>

              {/* Sample study guides selection */}
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400 font-bold block mb-1">త్వరిత నమూనాలు (Lessons templates)</span>
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">-- విద్య పాఠం ఎంచుకోండి (Select Model Lesson) --</option>
                  <option value="solar">సౌర కుటుంబం (Solar System Summary)</option>
                  <option value="grammar">తెలుగు భాషా భాగాలు (Grammar Parts of Speech)</option>
                  <option value="freedom">భారత స్వాతंత్ర్య సమరం (Independence Struggle)</option>
                </select>
              </div>

              {/* Main material entry form */}
              <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(e); }} className="space-y-3">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="తెలుగు పాఠ్యపుస్తక ముఖ్యాంశాలను ఇక్కడ పేస్ట్ చేయండి. (Example: సూర్యుడు ఒక నక్షత్రం. సౌర కుటుంబంలో ఎనిమిది గ్రహాలు ఉన్నాయి...)"
                  className="w-full h-52 text-xs p-3.5 rounded-xl border border-zinc-300 bg-white placeholder-zinc-400 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500 resize-none font-sans leading-relaxed transition-all"
                />
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isLoading && inputText.trim()) {
                      onGenerate(inputText.trim());
                    }
                  }}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs shadow-md border-none flex items-center justify-center gap-2 transition-all cursor-pointer bg-orange-600 text-white hover:bg-orange-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650"
                >
                  <Sparkles className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "విశ్లేషిస్తోంది... (Analyzing...)" : "మైండ్ మ్యాప్ సృష్టించండి (Generate AI Mind Map)"}
                </button>
              </form>
            </div>
            
            <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-orange-500" />
              <div>
                <span className="font-bold block mb-0.5 text-orange-600 dark:text-orange-400">సేవింగ్ మరియు ఎడిటింగ్ సదుపాయం!</span>
                సృష్టించిన తర్వాత మీరు ప్రతి బ్రాంచ్ టెక్స్ట్‌ని డబుల్ క్లిక్ చేసి నేరుగా మార్చవచ్చు, అలాగే ఒకే క్లిక్‌తో మీ డివైజ్‌కు బొమ్మగా లేదా ఫైల్‌గా సేవ్ చేసుకోవచ్చు.
              </div>
            </div>
          </div>
        )}

        {/* PANEL B: Saved mind maps visual cards with edit actions */}
        {activeTab === "saved" && (
          <div className="space-y-3.5 animate-in fade-in duration-250">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <History className="size-4 text-emerald-500" />
                సేవ్ చేసిన మైండ్ మ్యాప్‌లు (Saved collection)
              </h3>
              <button
                onClick={onSaveCurrentMap}
                className="px-2.5 py-1 text-[9px] font-bold rounded-lg border border-orange-500/30 text-orange-600 dark:border-orange-500/20 dark:text-orange-400 bg-orange-500/5 hover:bg-orange-500/15 cursor-pointer transition-colors flex items-center gap-1"
                title="Save updates"
              >
                <Plus className="size-3" />
                ఇప్పుడే సేవ్ చేయి
              </button>
            </div>

            {savedMaps.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <FolderOpen className="size-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">స్థానికంగా ఏ మైండ్ మ్యాప్ సేవ్ కాబడలేదు.</p>
                <span className="text-[9px] text-zinc-400 mt-1 block">మీరు సృష్టించిన దాన్ని పైన "ఇప్పుడే సేవ్" బటన్ నొక్కి డౌన్‌లోడ్ చేయవచ్చు.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {savedMaps.map((map) => {
                  const isActive = map.id === currentMapId;
                  return (
                    <div
                      key={map.id}
                      onClick={() => onSelectSavedMap(map.id)}
                      className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                        isActive 
                          ? "bg-orange-500/10 border-orange-500/30 text-zinc-900 dark:bg-orange-500/5 dark:text-zinc-100" 
                          : "bg-zinc-50 hover:bg-zinc-100 border-zinc-250 dark:bg-zinc-950/20 dark:hover:bg-zinc-950/60 dark:border-zinc-850"
                      }`}
                    >
                      <div className="min-w-0 pr-16">
                        <p className={`text-xs font-bold leading-normal truncate ${isActive ? "text-orange-600 dark:text-orange-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                          {map.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5 italic">{map.description}</p>
                        
                        {/* Visual miniaturized branch layout for quick scan */}
                        <MindMapThumbnail rootNode={map.rootNode} />

                        <span className="text-[9px] text-zinc-400 block mt-1 font-mono">
                          📅 {new Date(map.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>

                      {/* Action buttons list positioned elegantly on active hover or touch */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {/* Share */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriggerShare(map);
                          }}
                          className="p-1 px-1.5 rounded-lg hover:bg-orange-500/10 hover:text-orange-600 text-zinc-400 dark:text-zinc-500 dark:hover:text-orange-400 cursor-pointer"
                          title="Share custom map"
                        >
                          <Share2 className="size-3.5" />
                        </button>

                        {/* Rename */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriggerRename(map);
                          }}
                          className="p-1 px-1.5 rounded-lg hover:bg-orange-500/10 hover:text-orange-600 text-zinc-400 dark:text-zinc-500 dark:hover:text-orange-400 cursor-pointer"
                          title="Rename title"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSavedMap(map.id);
                          }}
                          className="p-1 px-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-650 text-zinc-400 dark:text-zinc-550 dark:hover:text-red-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      {isActive && (
                        <div className="absolute -left-[1px] top-1/4 bottom-1/4 w-[3px] rounded-r bg-orange-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL C: File Import Zone */}
        {activeTab === "import" && (
          <div className="space-y-4 animate-in fade-in duration-250">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              ఫైల్ ద్వారా లోడ్ చేసుకోండి (JSON Map Import)
            </span>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-orange-500 bg-orange-500/5" 
                  : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/20"
              }`}
            >
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="import-json-input"
              />
              <label htmlFor="import-json-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="size-8 text-orange-500 mx-auto animate-bounce duration-1000" />
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  ఫైల్‌ను ఎంచుకోండి లేదా డ్రాగ్ చేయండి
                </div>
                <div className="text-[10px] text-zinc-400">
                  (Only .json mind map files downloaded from this app)
                </div>
              </label>
            </div>

            {/* Simulated target helper */}
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-zinc-400 leading-relaxed font-sans space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <FileText className="size-3.5" />
                ఫైల్ సిస్టమ్ సూచనలు (Android Path Tip):
              </span>
              <p>
                మీరు మీ ఫోన్‌లో డౌన్‌లోడ్ చేసిన మైండ్ మ్యాప్స్ అన్నీ మీ ఆండ్రాయిడ్ మొబైల్ యొక్క <code className="p-0.5 px-1 bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-indigo-300 rounded">Downloads/TeluguMindMaps/</code> ఫోల్డర్ లో సేవ్ చేయబడతాయి. మీరు ఎప్పుడైనా ఆ ఫోల్డర్ నుండి JSON ఫైల్‌ని ఎంచుకొని ఇక్కడ అప్‌లోడ్ చేసి మళ్లీ పూర్తి ఇంటరాక్టివ్‌గా ఎడిట్ చేయవచ్చు!
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Control Drawer Footer notice */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-2 shrink-0">
        <BadgeAlert className="size-3.5 text-amber-500 animate-pulse shrink-0" />
        <span className="truncate">ఆఫ్‌లైన్ ఎడిటర్ సిద్ధంగా ఉంది & బుల్స్ ఐ సింక్ యాక్టివ్</span>
      </div>

      {/* Action sliding handle trigger */}
      <button
        onClick={onToggleCollapse}
        className="hidden md:flex absolute top-4 -right-12 z-25 p-2 bg-zinc-800 dark:bg-zinc-900 border border-zinc-750 text-white rounded-r-xl cursor-pointer items-center justify-center shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-800 transition-all"
        title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
      >
        <Menu className="size-4" />
      </button>

    </div>
  );
}
