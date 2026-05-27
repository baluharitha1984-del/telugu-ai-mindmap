import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  FileDown, 
  FolderOpen, 
  Image as ImageIcon, 
  Share2, 
  Edit3, 
  AlertCircle, 
  Calendar, 
  Share,
  Trash2
} from "lucide-react";
import { SavedMap, MindMapNode } from "../types";

// Helper to escape special characters for filenames
export const getCleanFilenamePrefix = (title: string) => {
  return "TeluguMindMaps_" + title.trim()
    .replace(/[^\u0c00-\u0c7f\w\s-]/g, "") // Keep Telugu script, alphanumeric, spaces, dashes
    .replace(/\s+/g, "_");                 // Replace spaces with underscores
};

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapToRename: SavedMap | null;
  onRename: (id: string, newTitle: string) => void;
}

export function RenameModal({ isOpen, onClose, mapToRename, onRename }: RenameModalProps) {
  const [newTitle, setNewTitle] = useState(mapToRename?.title || "");

  React.useEffect(() => {
    if (mapToRename) {
      setNewTitle(mapToRename.title);
    }
  }, [mapToRename]);

  if (!isOpen || !mapToRename) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRename(mapToRename.id, newTitle.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Edit3 className="size-4 text-indigo-500" />
            <span>పేరు మార్చండి (Rename Mind Map)</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5 animate-pulse">
              కొత్త శీర్షిక (New Map Title)
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              placeholder="ఉదా: కొత్త అధ్యయన పాఠం"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2.5 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 cursor-pointer text-zinc-600 dark:text-zinc-300"
            >
              రద్దు చేయి (Cancel)
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer"
            >
              ధృవీకరించు (Update Name)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: MindMapNode;
  mapTitle: string;
}

export function ShareModal({ isOpen, onClose, rootNode, mapTitle }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  // Real, functioning serializing compression link
  const getShareLink = () => {
    try {
      const jsonStr = JSON.stringify(rootNode);
      // Encode beautifully base64 safe
      const b64 = btoa(encodeURIComponent(jsonStr));
      return `${window.location.origin}${window.location.pathname}?map_data=${b64}`;
    } catch (err) {
      console.error(err);
      return window.location.href;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(JSON.stringify(rootNode, null, 2));
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Share2 className="size-4 text-sky-500 animate-pulse" />
            <span>మైండ్ మ్యాప్ పంచుకోండి (Share Interactive Map)</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
          ఈ మైండ్ మ్యాప్ యొక్క పూర్తి ఇంటరాక్టివ్ కంటెంట్‌ను ఇతరులతో షేర్ చేయవచ్చు. వారు ఈ లింక్ ఉపయోగించి నేరుగా క్రోమ్ లేదా ఫోన్ బ్రౌజర్‌లో ఎడిట్ చేసుకోవచ్చు!
        </p>

        <div className="space-y-4">
          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              షేర్ లింక్ (Interactive Share Link)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={getShareLink()}
                className="flex-1 text-xs p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 focus:outline-hidden"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 text-white bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer transition-colors shrink-0"
              >
                {copiedLink ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4" />}
                <span>{copiedLink ? "కాపీ అయింది!" : "లింక్ కాపీ"}</span>
              </button>
            </div>
          </div>

          {/* JSON Tree Data Box */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-850">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              ముడి డేటా కాపీ (Raw JSON Map Data)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 text-[10px] font-mono p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 truncate">
                {JSON.stringify(rootNode)}
              </div>
              <button
                onClick={handleCopyPrompt}
                className="px-3 py-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 cursor-pointer transition-colors shrink-0"
              >
                {copiedPrompt ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copiedPrompt ? "డేటా కాపీ అయింది" : "డేటా కాపీ చేయి"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-zinc-100 dark:border-zinc-850 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer"
          >
            పూర్తయింది (Done)
          </button>
        </div>
      </div>
    </div>
  );
}

interface SaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onJsonDownload: () => void;
  onPngDownload: () => void;
  onPdfDownload: () => void;
}

export function SaveConfirmationModal({ 
  isOpen, 
  onClose, 
  title, 
  onJsonDownload, 
  onPngDownload,
  onPdfDownload
}: SaveConfirmationModalProps) {
  const [downloadedJson, setDownloadedJson] = useState(false);
  const [downloadedPng, setDownloadedPng] = useState(false);
  const [downloadedPdf, setDownloadedPdf] = useState(false);

  if (!isOpen) return null;

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
  const filenamePrefix = getCleanFilenamePrefix(title);

  const triggerBoth = () => {
    onJsonDownload();
    onPngDownload();
    onPdfDownload();
    setDownloadedJson(true);
    setDownloadedPng(true);
    setDownloadedPdf(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Success Flag banner */}
        <div className="flex items-center gap-3 mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
          <Check className="size-5 shrink-0 bg-emerald-600 text-white rounded-full p-0.5" />
          <div>
            <h4 className="text-xs font-bold leading-non">మైండ్ మ్యాప్ విజయవంతంగా సేవ్ చేయబడింది!</h4>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 font-medium block mt-0.5">
              Mind Map Saved Successfully in local storage & ready for downloads folder.
            </span>
          </div>
        </div>

        {/* Dynamic android folder target visualization */}
        <div className="space-y-3 mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            ఫోన్ ముద్రణా స్థానం (Simulated Folder Target)
          </span>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-650 dark:text-zinc-300">
              <FolderOpen className="size-4.5 text-amber-500 shrink-0" />
              <span>📂 Downloads/TeluguMindMaps/</span>
            </div>

            <div className="space-y-2.5 font-mono text-[10px] pl-6.5 text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 truncate">
                  <FileDown className="size-3.5 text-zinc-400 shrink-0" />
                  <span>{filenamePrefix}_{dateStr}.json</span>
                </span>
                <button
                  onClick={() => { onJsonDownload(); setDownloadedJson(true); }}
                  className="px-2.5 py-1 text-[9px] font-semibold rounded bg-indigo-50 dark:bg-sky-950 text-indigo-650 dark:text-sky-300 hover:opacity-85 cursor-pointer ml-auto transition-all"
                >
                  {downloadedJson ? "మళ్లీ డౌన్‌లోడ్" : "డౌన్‌లోడ్ (JSON)"}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 truncate">
                  <ImageIcon className="size-3.5 text-zinc-400 shrink-0" />
                  <span>{filenamePrefix}_{dateStr}.png</span>
                </span>
                <button
                  onClick={() => { onPngDownload(); setDownloadedPng(true); }}
                  className="px-2.5 py-1 text-[9px] font-semibold rounded bg-indigo-50 dark:bg-sky-950 text-indigo-650 dark:text-sky-300 hover:opacity-85 cursor-pointer ml-auto transition-all"
                >
                  {downloadedPng ? "మళ్లీ డౌన్‌లోడ్" : "డౌన్‌లోడ్ (PNG)"}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 truncate">
                  <FileDown className="size-3.5 text-zinc-400 shrink-0" />
                  <span>{filenamePrefix}_{dateStr}.pdf</span>
                </span>
                <button
                  onClick={() => { onPdfDownload(); setDownloadedPdf(true); }}
                  className="px-2.5 py-1 text-[9px] font-semibold rounded bg-indigo-50 dark:bg-sky-950 text-indigo-650 dark:text-sky-300 hover:opacity-85 cursor-pointer ml-auto transition-all"
                >
                  {downloadedPdf ? "మళ్లీ డౌన్‌లోడ్" : "డౌన్‌లోడ్ (PDF)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850">
          <button
            onClick={triggerBoth}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer flex items-center justify-center gap-1.5 transition-shadow shadow-md hover:shadow-lg"
          >
            <FileDown className="size-4" />
            <span>ఈ ఫైళ్లను డౌన్‌లోడ్ చేయండి! (Download All Files)</span>
          </button>

          <span className="text-[10px] text-zinc-400 text-center sm:text-left block flex-1">
            తరువాత ఈ ఫైళ్లను మళ్లీ లోడ్ చేయవచ్చు.
          </span>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 cursor-pointer text-zinc-700 dark:text-zinc-200"
          >
            మూసివేయి (Close)
          </button>
        </div>

      </div>
    </div>
  );
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapTitle: string;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  mapTitle,
  onConfirm
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 dark:border-red-500/30 bg-white dark:bg-zinc-90 w p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left bg-white dark:bg-zinc-900">
        <div className="flex items-start gap-3 mt-1.5">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 shrink-0">
            <Trash2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              మైండ్ మ్యాప్‌ను తొలగించాలా? (Delete Mind Map?)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this mind map?
            </p>
          </div>
        </div>

        {/* Selected map notice */}
        <div className="my-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-850/60 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">
            ఎంచుకున్న మైండ్ మ్యాప్ (Target Map)
          </span>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
            {mapTitle || "తెలుగు మైండ్ మ్యాప్"}
          </span>
        </div>

        <p className="text-[11px] text-red-650 dark:text-red-400 font-medium leading-relaxed mb-4">
          ⚠️ దీనిని తొలగిస్తే, దీనిలోని తెలుగు కంటెంట్ మరియు స్థానిక డౌన్‌లోడ్ ఫైళ్లు (PNG, PDF) శాశ్వతంగా తొలగిపోతాయి. తిరిగి పొందడం సాధ్యం కాదు.
        </p>

        <div className="flex items-center gap-2.5 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 cursor-pointer text-zinc-650 dark:text-zinc-350"
          >
            రద్దు చేయి (Cancel)
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/10 hover:shadow-lg transition-all"
          >
            <Trash2 className="size-3.5" />
            <span>తొలగించు (Delete)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

