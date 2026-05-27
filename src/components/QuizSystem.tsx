import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowLeft, 
  Award, 
  RefreshCcw, 
  ChevronRight, 
  History, 
  BookOpen, 
  HelpCircle as QuestionIcon, 
  TrendingUp, 
  AlertCircle,
  X,
  Play,
  RotateCcw,
  Check,
  Trophy
} from "lucide-react";
import { MindMapNode } from "../types";

export interface QuizQuestion {
  id: string;
  type: "MCQ" | "TF" | "FITB" | "ONE_WORD";
  questionText: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
}

export interface QuizHistoryEntry {
  id: string;
  mapId: string;
  mapTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  difficulty: "easy" | "medium" | "hard";
  scope: string;
  date: string;
}

interface QuizSystemProps {
  onClose: () => void;
  originalText?: string;
  rootNode: MindMapNode;
  theme: "light" | "dark";
  selectedNodeId: string | null;
  mapId: string | null;
  mapTitle: string;
}

export default function QuizSystem({
  onClose,
  originalText,
  rootNode,
  theme,
  selectedNodeId,
  mapId,
  mapTitle
}: QuizSystemProps) {
  // Config state
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [scope, setScope] = useState<"full" | "subtopic">("full");
  const [questionCount, setQuestionCount] = useState<number>(5);
  
  // Quiz states
  const [quizState, setQuizState] = useState<"config" | "loading" | "active" | "results" | "history">("config");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: string }>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [fitbInput, setFitbInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeHintId, setActiveHintId] = useState<string | null>(null);

  // Local Storage Quiz History state
  const [historyList, setHistoryList] = useState<QuizHistoryEntry[]>([]);

  // Find selected node details
  const getSelectedNodeName = (): string => {
    if (!selectedNodeId) return "";
    const findNodeName = (node: MindMapNode, targetId: string): string | null => {
      if (node.id === targetId) return node.text;
      if (node.children) {
        for (const child of node.children) {
          const found = findNodeName(child, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    return findNodeName(rootNode, selectedNodeId) || "";
  };

  const selectedNodeName = getSelectedNodeName();

  // Load history on mount
  useEffect(() => {
    const cached = localStorage.getItem("telugu-quiz-history");
    if (cached) {
      try {
        setHistoryList(JSON.parse(cached));
      } catch (e) {
        console.error("Error parsing quiz history:", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (newEntry: QuizHistoryEntry) => {
    const updated = [newEntry, ...historyList];
    setHistoryList(updated);
    localStorage.setItem("telugu-quiz-history", JSON.stringify(updated));
  };

  // Helper: flatten nodes to search subtopic content
  const findSubtreeNodes = (node: MindMapNode, targetId: string): MindMapNode | null => {
    if (node.id === targetId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findSubtreeNodes(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const serializeMindMapTree = (node: MindMapNode, level = 0): string => {
    let text = `${"  ".repeat(level)}- ${node.text}\n`;
    if (node.children) {
      for (const child of node.children) {
        text += serializeMindMapTree(child, level + 1);
      }
    }
    return text;
  };

  // Main generator function
  const handleStartQuiz = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setQuizState("loading");

    // Formulate lesson context from either original uploaded text or the tree hierarchy summary
    let studyContext = originalText || "";
    let scopeName = "మొత్తం పాఠ్యాంశం";

    if (scope === "subtopic" && selectedNodeId) {
      const subtree = findSubtreeNodes(rootNode, selectedNodeId);
      if (subtree) {
        studyContext = serializeMindMapTree(subtree);
        scopeName = `ఉపశీర్షిక: ${selectedNodeName}`;
      }
    } else {
      if (!studyContext.trim()) {
        studyContext = serializeMindMapTree(rootNode);
      }
    }

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: studyContext,
          difficulty,
          questionCount,
          scopeTitle: scope === "subtopic" ? selectedNodeName : "Entire Lesson"
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "క్విజ్ ప్రశ్నలను సృష్టించడంలో ఒక సాంకేతిక లోపం సంభవించింది.");
      }

      const quizData = await response.json();
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error("AI నమూనా నుండి ప్రశ్నలు రాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.");
      }

      setQuestions(quizData.questions);
      setCurrentIdx(0);
      setUserAnswers({});
      setIsAnswered(false);
      setFitbInput("");
      setQuizState("active");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "సాంకేతిక కారణాల వల్ల ప్రశ్నల లోడింగ్ విఫలమైంది.");
      setQuizState("config");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    const currentQ = questions[currentIdx];
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: option }));
    setIsAnswered(true);
  };

  const handleSubmitFitb = () => {
    if (isAnswered || !fitbInput.trim()) return;
    const currentQ = questions[currentIdx];
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: fitbInput.trim() }));
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setIsAnswered(false);
      setFitbInput("");
      setActiveHintId(null);
    } else {
      // Completed! Compute score and save to history
      const correctCount = computeCorrectCount();
      const pct = Math.round((correctCount / questions.length) * 100);
      
      const newHistoryEntry: QuizHistoryEntry = {
        id: "quiz-" + Date.now(),
        mapId: mapId || "custom",
        mapTitle: mapTitle || rootNode.text,
        score: correctCount,
        totalQuestions: questions.length,
        percentage: pct,
        difficulty,
        scope: scope === "subtopic" ? `ఉప: ${selectedNodeName}` : "మొత్తం పాఠ్యాంశం",
        date: new Date().toISOString()
      };

      saveHistory(newHistoryEntry);
      setQuizState("results");
    }
  };

  const computeCorrectCount = () => {
    let score = 0;
    questions.forEach(q => {
      const userAns = userAnswers[q.id]?.toLowerCase().trim().replace(/\s+/g, "");
      const correctAns = q.correctAnswer?.toLowerCase().trim().replace(/\s+/g, "");
      
      if (userAns === correctAns) {
        score++;
      } else if (q.type === "FITB" || q.type === "ONE_WORD") {
        // More lenient spelling check for typed Telugu characters/spaces
        if (correctAns && userAns && (userAns.includes(correctAns) || correctAns.includes(userAns))) {
          score++;
        }
      }
    });
    return score;
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 85) return "text-emerald-500 stroke-emerald-500 bg-emerald-500/10";
    if (pct >= 60) return "text-orange-500 stroke-orange-500 bg-orange-500/10";
    return "text-red-500 stroke-red-500 bg-red-500/10";
  };

  const getScoreFeedback = (pct: number) => {
    if (pct >= 90) {
      return {
        title: "అద్భుతమైన ప్రతిభ! 🏆",
        msg: "మహోన్నతం! లెక్చరర్ స్థాయిలో మీ అవగాహన ఉంది. ఇదే పద్ధతిలో మీ అభ్యాసాన్ని కొనసాగించండి!",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
      };
    }
    if (pct >= 70) {
      return {
        title: "చాలా చక్కగా చేశారు! 👍",
        msg: "నోట్స్ పైన మంచి పట్టు ఉంది. మరికొంత శ్రద్ధతో పరీక్షలో శతశాతం మార్కులు ఖచ్చితంగా సాధించవచ్చు.",
        color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
      };
    }
    if (pct >= 50) {
      return {
        title: "మంచి ప్రయత్నం! 🎯",
        msg: "మంచి ఉత్సాహంతో రాశారు. మైండ్ మ్యాప్‌ను మరోసారి జాగ్రత్తగా పరిశీలిస్తే మీ స్కోర్ మరింత పెరుగుతుంది.",
        color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20"
      };
    }
    return {
      title: "మళ్లీ ప్రయత్నించండి! 🔄",
      msg: "నిరాశ చెందకండి! జ్ఞానార్జనకు ఓటమే మొదటి మెట్టు. స్లైడ్స్ చదివి మళ్లీ ఈ క్విజ్‌ను ప్రయత్నించండి.",
      color: "text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
    };
  };

  const handleRetrySameQuiz = () => {
    setCurrentIdx(0);
    setUserAnswers({});
    setIsAnswered(false);
    setFitbInput("");
    setActiveHintId(null);
    setQuizState("active");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-radial from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 animate-in fade-in duration-300">
      
      {/* 1. Header Nav Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900/40 px-6 sm:px-12 shadow-xs shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-xl flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
          title="వెనుకకు"
        >
          <ArrowLeft className="size-4" />
          <span>వెనుకకు (Back to Map)</span>
        </button>

        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-1.5 rounded-lg bg-orange-600 text-white shadow-md animate-pulse">
              <Award className="size-4" />
            </span>
            <span className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-orange-600 dark:text-orange-400">
              AI విద్యా క్విజ్ (Telugu AI Quiz Companion)
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">పాఠం: {mapTitle}</span>
        </div>

        <button
          onClick={onClose}
          className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-zinc-750 dark:hover:text-zinc-250 cursor-pointer transition-colors"
          title="మూసివేయి (Close)"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 2. Interactive Main Space */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:py-10 scrollbar relative flex flex-col items-center justify-center">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="w-full max-w-2xl mx-auto z-10">
          
          {/* A. CONFIGURATION STATE */}
          {quizState === "config" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[24px] p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center space-y-2 mb-6">
                <div className="size-16 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mx-auto flex items-center justify-center shadow-inner">
                  <Sparkles className="size-8 animate-pulse text-orange-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">AI క్విజ్ సెటప్ (AI Quiz Customization)</h2>
                <p className="text-xs text-zinc-400 font-semibold">మీ తెలుగు పాఠం ఆధారంగా నిమిషాల్లో కస్టమ్ క్విజ్‌ను సృష్టించండి.</p>
              </div>

              {errorMessage && (
                <div className="p-4 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 flex gap-2.5 items-start">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">సృష్టి ప్రక్రియ నిలిచిపోయింది:</span>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Input Form Fields */}
              <div className="space-y-6">
                
                {/* 1. Difficulty level */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">కఠినత స్థాయి (Difficulty level)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "easy", label: "సులభం (Easy)", desc: "ప్రాథమిక ప్రశ్నలు", color: "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10" },
                      { key: "medium", label: "మధ్యమం (Medium)", desc: "సాధారణ అవగాహన", color: "border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/10" },
                      { key: "hard", label: "కఠినం (Hard)", desc: "లోతైన విశ్లేషణ", color: "border-red-500 text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/10" }
                    ].map(lvl => (
                      <button
                        key={lvl.key}
                        onClick={() => setDifficulty(lvl.key as any)}
                        style={{ borderWidth: difficulty === lvl.key ? "2px" : "1px" }}
                        className={`p-3 rounded-xl text-left cursor-pointer transition-all ${
                          difficulty === lvl.key 
                            ? `${lvl.color} shadow-md scale-102` 
                            : "border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
                        }`}
                      >
                        <span className="text-xs font-bold block">{lvl.label}</span>
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold block mt-0.5">{lvl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Topic Scope */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block">క్విజ్ పరిధి (Topic scope)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setScope("full")}
                      className={`p-4 rounded-xl text-left border cursor-pointer transition-all flex items-start gap-3 ${
                        scope === "full" 
                          ? "border-orange-500 bg-orange-500/5 text-zinc-900 dark:text-white" 
                          : "border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850"
                      }`}
                    >
                      <BookOpen className="size-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">మొత్తం పాఠ్యాంశం (Entire Lesson)</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">మొత్తం పాఠంలోని అన్ని ముఖ్యమైన విషయాల నుండి ప్రశ్నలు సృష్టించబడతాయి.</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (selectedNodeId) {
                          setScope("subtopic");
                        }
                      }}
                      disabled={!selectedNodeId}
                      className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
                        scope === "subtopic" 
                          ? "border-orange-500 bg-orange-500/5 text-zinc-900 dark:text-white cursor-pointer" 
                          : "border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850 cursor-pointer"
                      }`}
                    >
                      <TrendingUp className="size-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">ఎంచుకున్న ఉప-శీర్షిక (Selected Subtopic Only)</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                          {selectedNodeId 
                            ? `"${selectedNodeName}" మరియు దాని అనుబంధ శాఖలపై ప్రత్యేక క్విజ్.` 
                            : "మైండ్ మ్యాప్‌లో ఒక శాఖను ఎంచుకుంటే ప్రత్యేకంగా క్విజ్ రూపొందించబడుతుంది."}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Question Count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">ప్రశ్నల సంఖ్య (Number of Questions)</label>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{questionCount} ప్రశ్నలు (Questions)</span>
                  </div>
                  <div className="flex gap-4">
                    {[5, 8, 10].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => setQuestionCount(cnt)}
                        className={`flex-1 py-2 text-center rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                          questionCount === cnt 
                            ? "border-orange-500 bg-orange-500/15 text-orange-600 dark:text-orange-400 font-extrabold" 
                            : "border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleStartQuiz}
                  className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-700/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Sparkles className="size-4 animate-bounce shrink-0" />
                  <span>క్విజ్ ప్రారంభించండి (Generate AI Quiz)</span>
                </button>

                {/* History Navigator Button */}
                {historyList.length > 0 && (
                  <button
                    onClick={() => setQuizState("history")}
                    className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl text-zinc-500 dark:text-zinc-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <History className="size-4" />
                    <span>పాత స్కోర్ల చరిత్ర తిలకించండి ({historyList.length})</span>
                  </button>
                )}

              </div>
            </div>
          )}

          {/* B. LOADING SCREEN STATE */}
          {quizState === "loading" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
              <div className="p-4 rounded-full bg-orange-600 text-white shadow-xl animate-spin relative inline-flex items-center justify-center">
                <Sparkles className="size-10 text-white" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white">AI ప్రశ్నపత్రాన్ని రూపొందిస్తోంది...</h3>
                <p className="text-xs text-zinc-450 leading-relaxed max-w-sm mx-auto">
                  మీ తెలుగు పాఠ్యం లోని ముఖ్య భావనలు, నామములు, వివరణలను స్మార్ట్ విశ్లేషణ ద్వారా వెలికి తీసి ఎంక్వైరీ రూల్స్ అనుసరించి తెలుగు వ్యాకరణ ప్రయుక్తంగా క్విజ్ క్వశ్చన్లను సిద్ధం చేస్తోంది.
                </p>
              </div>

              {/* Visual task tracker */}
              <div className="border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl max-w-xs mx-auto space-y-2.5 text-left text-[10px] text-zinc-400 font-bold">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>తెలుగు పాఠ్యాంశ విశ్లేషణ పూర్తి</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>MCQ, తప్పు/ఒప్పు, ఖాళీలు సమూహం సిద్ధం</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>తెలుగు వాక్య నిర్మాణం మరియు సమీక్ష సాగుతోంది</span>
                </div>
              </div>
            </div>
          )}

          {/* C. ACTIVE PLAY STATE */}
          {quizState === "active" && questions.length > 0 && (() => {
            const currentQ = questions[currentIdx];
            const isMcq = currentQ.type === "MCQ";
            const isTf = currentQ.type === "TF";
            const isFitb = currentQ.type === "FITB";
            const isOneWord = currentQ.type === "ONE_WORD";
            
            const answeredValue = userAnswers[currentQ.id];
            const hasUserAnswered = answeredValue !== undefined;
            const isUserCorrect = hasUserAnswered && (
              answeredValue.toLowerCase().trim().replace(/\s+/g, "") === currentQ.correctAnswer.toLowerCase().trim().replace(/\s+/g, "") ||
              ((isFitb || isOneWord) && (
                currentQ.correctAnswer.toLowerCase().trim().replace(/\s+/g, "").includes(answeredValue.toLowerCase().trim().replace(/\s+/g, "")) ||
                answeredValue.toLowerCase().trim().replace(/\s+/g, "").includes(currentQ.correctAnswer.toLowerCase().trim().replace(/\s+/g, ""))
              ))
            );

            // Display types helper
            const getTypeName = (type: string) => {
              switch (type) {
                case "MCQ": return "బహుళైచ్ఛిక ప్రశ్న (MCQ)";
                case "TF": return "నిజం / తప్పు (True/False)";
                case "FITB": return "ఖాళీలను పూరించండి (Fill in the Blank)";
                case "ONE_WORD": return "ఏకపద సమాధానం (One-word Question)";
                default: return "నమూనా ప్రశ్న";
              }
            };

            return (
              <div className="space-y-6">
                
                {/* Micro metrics and active progress tracker */}
                <div className="flex items-center justify-between text-xs px-2 shrink-0 select-none">
                  <span className="font-mono bg-orange-600/15 border border-orange-500/20 text-orange-600 dark:text-orange-400 py-1 px-3 rounded-full font-bold">
                    ప్రశ్న {currentIdx + 1} / {questions.length}
                  </span>
                  
                  {/* Scope / Difficulty badges */}
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[9px] text-zinc-500 dark:text-zinc-400">
                      {getTypeName(currentQ.type)}
                    </span>
                  </div>
                </div>

                {/* Progress bar gauge */}
                <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden shrink-0 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* QUESTION WRAPPER CARD */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-98 duration-250 flex flex-col space-y-6">
                  
                  {/* Large beautifully offset Telugu textual question body */}
                  <div className="text-center space-y-3.5 py-2">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black leading-relaxed tracking-normal text-zinc-900 dark:text-zinc-100 font-sans">
                      {currentQ.questionText}
                    </h1>
                  </div>

                  {/* INTERACTIVE CONTROLS SECTION */}
                  <div className="space-y-4">
                    
                    {/* MCQ format options list (Exactly 4 items) */}
                    {isMcq && currentQ.options && (
                      <div className="grid grid-cols-1 gap-3.5">
                        {currentQ.options.map((option, opIdx) => {
                          const isCurrentSelected = answeredValue === option;
                          const isCorrectMatch = option === currentQ.correctAnswer;
                          
                          let opStyle = "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-150/50 text-zinc-850 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 dark:text-zinc-200";
                          
                          if (hasUserAnswered) {
                            if (isCorrectMatch) {
                              opStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/20";
                            } else if (isCurrentSelected) {
                              opStyle = "border-red-500 bg-red-500/10 text-red-500 font-bold ring-2 ring-red-500/20";
                            } else {
                              opStyle = "border-zinc-200 dark:border-zinc-800 opacity-50";
                            }
                          }

                          return (
                            <button
                              key={opIdx}
                              onClick={() => handleSelectOption(option)}
                              disabled={hasUserAnswered}
                              className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-bold tracking-tight cursor-pointer flex items-center justify-between gap-4 transition-all ${opStyle}`}
                            >
                              <span className="flex-1 leading-relaxed"><span className="text-orange-500 mr-2.5 font-bold">({opIdx + 1})</span>{option}</span>
                              {hasUserAnswered && isCorrectMatch && (
                                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                              )}
                              {hasUserAnswered && isCurrentSelected && !isCorrectMatch && (
                                <XCircle className="size-5 text-red-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* True or False format buttons list */}
                    {isTf && (
                      <div className="grid grid-cols-2 gap-4">
                        {["నిజం", "తప్పు"].map((option, opIdx) => {
                          const isCurrentSelected = answeredValue === option;
                          const isCorrectMatch = option === currentQ.correctAnswer;

                          let opStyle = "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-150/50 text-zinc-850 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-950 dark:text-zinc-200";
                          
                          if (hasUserAnswered) {
                            if (isCorrectMatch) {
                              opStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold ring-2 ring-emerald-500/20";
                            } else if (isCurrentSelected) {
                              opStyle = "border-red-500 bg-red-500/10 text-red-500 font-extrabold ring-2 ring-red-500/20";
                            } else {
                              opStyle = "border-zinc-200 dark:border-zinc-800 opacity-50";
                            }
                          }

                          return (
                            <button
                              key={opIdx}
                              onClick={() => handleSelectOption(option)}
                              disabled={hasUserAnswered}
                              className={`p-6 rounded-2xl border text-center text-sm font-extrabold cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${opStyle}`}
                            >
                              <span className="text-base sm:text-lg">{option}</span>
                              {hasUserAnswered && isCorrectMatch && (
                                <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-1" />
                              )}
                              {hasUserAnswered && isCurrentSelected && !isCorrectMatch && (
                                <XCircle className="size-5 text-red-500 shrink-0 mt-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill in the Blanks / One World direct visual inputs */}
                    {(isFitb || isOneWord) && (
                      <div className="space-y-4">
                        {!hasUserAnswered ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={fitbInput}
                              onChange={(e) => setFitbInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmitFitb();
                                }
                              }}
                              placeholder="మీ జవాబును తెలుగులో రాయండి... (Type your Telugu answer)"
                              className="flex-1 p-4 text-xs sm:text-sm rounded-2xl border border-zinc-300 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus:outline-hidden focus:ring-1 focus:ring-orange-500 font-bold"
                            />
                            <button
                              onClick={handleSubmitFitb}
                              disabled={!fitbInput.trim()}
                              className="px-6 py-4 rounded-2xl bg-orange-600 text-white font-extrabold text-xs tracking-wider shadow-md hover:bg-orange-700 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-650 cursor-pointer border-none"
                            >
                              సమర్పించు
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                              isUserCorrect 
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : "border-red-500 bg-red-500/10 text-red-500"
                            }`}>
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-70">మీ జవాబు (Your answer):</span>
                                <span className="text-sm font-black block mt-0.5">{answeredValue}</span>
                              </div>
                              {isUserCorrect ? (
                                <CheckCircle2 className="size-6 text-emerald-500 shrink-0 animate-bounce" />
                              ) : (
                                <XCircle className="size-6 text-red-500 shrink-0" />
                              )}
                            </div>

                            {!isUserCorrect && (
                              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-70">సరైన జవాబు (Correct answer):</span>
                                <span className="text-sm font-black block mt-0.5">{currentQ.correctAnswer}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* 3. Hint Display and Answer Summary accordion after user inputs */}
                  <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-850 flex flex-col shrink-0">
                    {/* Expandable Hint Module in case of struggle */}
                    {!hasUserAnswered && currentQ.hint && (
                      <div className="w-full text-right">
                        <button
                          onClick={() => setActiveHintId(activeHintId === currentQ.id ? null : currentQ.id)}
                          className="text-[10px] sm:text-xs font-bold text-orange-600 dark:text-orange-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <HelpCircle className="size-3.5" />
                          <span>హింట్ కావాలా? (Need Hint?)</span>
                        </button>
                        {activeHintId === currentQ.id && (
                          <div className="p-3.5 mt-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 text-left font-sans leading-relaxed animate-in fade-in duration-200">
                            💡 {currentQ.hint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next command bar */}
                    {hasUserAnswered && (
                      <div className="flex pt-1 animate-in fade-in duration-200">
                        <button
                          onClick={handleNextQuestion}
                          className="w-full sm:w-auto ml-auto py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs tracking-wider shadow-lg hover:shadow-orange-700/25 flex items-center justify-center gap-2 cursor-pointer transition-all border-none"
                        >
                          <span>{currentIdx < questions.length - 1 ? "తరువాతి ప్రశ్న (Next ->)" : "ఫలితాలు చూపించు (Finish!)"}</span>
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* D. SCORE RESULTS SHOWCASE VIEW */}
          {quizState === "results" && questions.length > 0 && (() => {
            const correctCount = computeCorrectCount();
            const pct = Math.round((correctCount / questions.length) * 100);
            const feedback = getScoreFeedback(pct);

            return (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-98 duration-300 space-y-6 text-center select-none">
                
                {/* Visual Circle Gauge Percentage display */}
                <div className="relative size-36 sm:size-40 mx-auto flex items-center justify-center mb-1">
                  <svg className="absolute inset-0 size-full -rotate-90">
                    <circle cx="50%" cy="50%" r="42%" className="stroke-zinc-150 dark:stroke-zinc-800" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="50%" 
                      cy="50%" 
                      r="42%" 
                      className={`transition-all duration-1000 ${getPercentageColor(pct).split(" ")[1]}`} 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={`${2.51 * 42}vw`}
                      strokeDashoffset={`${(2.51 * 42) * (1 - pct / 100)}vw`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center space-y-0.5 relative z-10">
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">{pct}%</span>
                    <span className="text-[10px] text-zinc-400 font-bold block">టెస్ట్ స్కోర్</span>
                  </div>
                </div>

                {/* Score Header description */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{feedback.title}</h2>
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold leading-relaxed max-w-lg mx-auto ${feedback.color}`}>
                    {feedback.msg}
                  </div>
                </div>

                {/* Micro numerical grid details card */}
                <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                  <div className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 text-center">
                    <span className="text-base sm:text-lg font-mono font-bold text-emerald-500 block">{correctCount}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">సరియైనవి (Correct)</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 text-center">
                    <span className="text-base sm:text-lg font-mono font-bold text-red-500 block">{questions.length - correctCount}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">తప్పైనవి (Wrong)</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 text-center">
                    <span className="text-base sm:text-lg font-mono font-bold text-orange-500 block">{questions.length}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">మొత్తం (Total)</span>
                  </div>
                </div>

                {/* Action button triggers to restart operations */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-md mx-auto">
                  <button
                    onClick={handleRetrySameQuiz}
                    className="flex-1 py-3 px-4 rounded-xl border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-850 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="size-4" />
                    <span>మళ్లీ రాయండి (Retry Quiz)</span>
                  </button>

                  <button
                    onClick={() => setQuizState("config")}
                    className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs cursor-pointer shadow-md select-none border-none transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="size-4" />
                    <span>కొత్త క్విజ్ సృష్టించు</span>
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 dark:bg-zinc-950 text-white font-bold text-xs cursor-pointer transition-all border-none"
                  >
                    వెనుకకు
                  </button>
                </div>

              </div>
            );
          })()}

          {/* E. SCORE BOARD HISTORY LOG STATE */}
          {quizState === "history" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="size-5 text-amber-500 animate-bounce" />
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">క్విజ్ ప్రదర్శన చరిత్ర (History Logs)</h3>
                </div>
                <button
                  onClick={() => setQuizState("config")}
                  className="px-3 py-1 rounded-lg border border-zinc-200 text-zinc-450 dark:border-zinc-800 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold cursor-pointer"
                >
                  వెనుకకు
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar">
                {historyList.map((entry) => (
                  <div 
                    key={entry.id}
                    className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-850 dark:bg-zinc-950/20 text-left relative"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-black block leading-snug text-zinc-900 dark:text-white">{entry.mapTitle}</span>
                        <div className="flex flex-wrap gap-2 items-center text-[9px] text-zinc-400 font-bold uppercase mt-1">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-850">{entry.difficulty}</span>
                          <span>•</span>
                          <span>{entry.scope}</span>
                          <span>•</span>
                          <span>📅 {new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Detailed Score pills */}
                      <div className="text-right shrink-0">
                        <span className={`text-base font-black font-mono block ${entry.percentage >= 80 ? "text-emerald-500" : entry.percentage >= 50 ? "text-orange-500" : "text-red-500"}`}>
                          {entry.score} / {entry.totalQuestions}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 mt-0.5 block">{entry.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-zinc-150 dark:border-zinc-850 mt-4">
                <button
                  onClick={() => {
                    if (confirm("స్కోర్ల చరిత్ర మొత్తాన్ని తొలగించాలా?")) {
                      setHistoryList([]);
                      localStorage.removeItem("telugu-quiz-history");
                    }
                  }}
                  className="px-3 py-2 text-[10px] font-bold bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 rounded-lg cursor-pointer"
                >
                  చరిత్రను తుడిచేయండి (Clear History)
                </button>
                
                <button
                  onClick={() => setQuizState("config")}
                  className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer border-none"
                >
                  <Play className="size-3.5" />
                  <span>కొత్త టెస్ట్ ప్రారంభించు</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
