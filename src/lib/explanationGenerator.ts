interface EducationalContent {
  title: string;
  englishTitle: string;
  explanation: string;
  keyPoints: string[];
  studyTip: string;
  examples?: string[];
  category: string;
}

/**
 * Returns highly-detailed Telugu pedagogical textbook content and lessons for any mind map topic.
 * Utilizes smart extraction logic to pull ONLY original content from the uploaded text when available.
 */
export function getEducationalExplanation(
  text: string,
  level: number,
  originalText?: string,
  nodeChildren?: string[]
): EducationalContent {
  const normalized = text.toLowerCase();

  // Helper to extract clean titles (extract English in parentheses if any, and Telugu title)
  const englishMatch = text.match(/\(([^)]+)\)/);
  const englishTitle = englishMatch ? englishMatch[1].trim() : "";
  let cleanTitle = text.replace(/\([^)]+\)/g, "").trim();
  // Remove trailing details beyond dashes or colons for cleaner presentation titles
  cleanTitle = cleanTitle.split(/[-:–]/)[0].trim();

  // If there's an originalText, perform Smart Semantic Matching from the uploaded lesson
  if (originalText && originalText.trim().length > 10) {
    // 1. Extract search keys for Telugu and English
    const teluguKeys = cleanTitle.match(/[\u0C00-\u0C7F]+/g) || [];
    const englishKeys = (englishTitle.match(/[a-zA-Z]+/g) || []).map(w => w.toLowerCase());

    const cleanTeluguKeys = teluguKeys.filter(w => w.length > 1);

    // Split lesson into paragraphs / logical sections
    const paragraphs = originalText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    const scoredParagraphs: { paragraph: string; score: number }[] = [];

    for (const para of paragraphs) {
      let score = 0;
      const paraLower = para.toLowerCase();

      // Priority 1: Paragraph directly contains the precise title
      if (para.includes(cleanTitle)) {
        score += 50;
      }
      if (englishTitle && paraLower.includes(englishTitle.toLowerCase())) {
        score += 35;
      }

      // Priority 2: Matches list items at paragraph start
      const startOfPara = para.slice(0, 45);
      if (startOfPara.includes(cleanTitle)) {
        score += 35;
      }

      // Count matches for individual Telugu words
      for (const key of cleanTeluguKeys) {
        if (para.includes(key)) {
          score += 15;
          if (startOfPara.includes(key)) {
            score += 15;
          }
        }
      }

      // Count matches for English words
      for (const key of englishKeys) {
        if (key.length > 2 && paraLower.includes(key)) {
          score += 10;
          if (startOfPara.toLowerCase().includes(key)) {
            score += 15;
          }
        }
      }

      // Slight penalty for overly long paragraphs to favor concise matches
      if (para.length > 500 && score > 0) {
        score -= 5;
      }

      if (score > 4) {
        scoredParagraphs.push({ paragraph: para, score });
      }
    }

    // Sort paragraphs by score descending
    scoredParagraphs.sort((a, b) => b.score - a.score);

    // If we have a decent match from the original uploaded text
    if (scoredParagraphs.length > 0 && scoredParagraphs[0].score >= 10) {
      const bestParagraph = scoredParagraphs[0].paragraph;

      // Clean leading list items
      let cleanedPara = bestParagraph.replace(/^[-*•\d.\s)]+/, "").trim();
      cleanedPara = cleanedPara.replace(/^[:\-–\s]+/, "").trim();

      // Split paragraph into sentences to build direct explanation and highlights
      const sentences = cleanedPara
        .split(/(?<=[.!?।])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 3);

      let explanation = "";
      const keyPoints: string[] = [];

      if (sentences.length > 0) {
        // First 1 or 2 sentences can be the core explanation block
        explanation = sentences.slice(0, 2).join(" ");
        
        // Remaining sentences can be the bullet points
        const remainingSentences = sentences.slice(2);
        for (const s of remainingSentences) {
          keyPoints.push(s);
        }
      } else {
        explanation = cleanedPara;
      }

      // If keyPoints are few, try pulling sentences from the second best match
      if (keyPoints.length < 2 && scoredParagraphs.length > 1) {
        const secondBest = scoredParagraphs[1].paragraph
          .replace(/^[-*•\d.\s)]+/, "")
          .trim()
          .replace(/^[:\-–\s]+/, "")
          .trim();
        const secondSentences = secondBest.split(/(?<=[.!?|।])\s+/).map(s => s.trim()).filter(s => s.length > 3);
        for (const s of secondSentences) {
          if (keyPoints.length < 4) {
            keyPoints.push(s);
          }
        }
      }

      // Merge visual sibling/child node texts from the map itself as bullet points for maximum relevance
      if (nodeChildren && nodeChildren.length > 0) {
        nodeChildren.forEach(childText => {
          const cleanedChild = childText.replace(/^[-*•\d.\s)]+/, "").trim();
          if (cleanedChild.length > 2 && !keyPoints.includes(cleanedChild) && keyPoints.length < 5) {
            keyPoints.push(cleanedChild);
          }
        });
      }

      // Filter out points that repeat explanation
      const uniqueKeyPoints = keyPoints.filter(kp => kp !== explanation && !explanation.includes(kp));

      const category = text === cleanTitle ? "పాఠ్యాంశం (Lesson Overview)" : `ఉప శీర్షిక (Subtopic Study Module)`;

      return {
        title: cleanTitle,
        englishTitle: englishTitle,
        category: category,
        explanation: explanation,
        keyPoints: uniqueKeyPoints.length > 0 ? uniqueKeyPoints : ["ఈ అంశానికి సంబంధించిన మరిన్ని వివరాలు పక్కనే ఉన్న మైండ్ మ్యాప్ రేఖాచిత్రంలో పరిశీలించవచ్చు."],
        studyTip: `"${cleanTitle}" కు సంబంధించిన ముఖ్య పదాలను మరియు నిర్వచనాలను మీ సొంత మాటలలో రాసి నోట్స్ సిద్ధం చేసుకోండి.`,
        examples: nodeChildren && nodeChildren.length > 0 ? nodeChildren.slice(0, 3) : undefined
      };
    }
  }

  // --- PREDEFINED BUILTIN SAMPLE FALLBACK MAPS ---
  // (We retain these beautiful predefined texts for standard solar/grammar/freedom lessons
  // to keep the visual design gorgeous when clicking sample topics!)
  
  if (normalized.includes("సౌర") || normalized.includes("solar system") || normalized.includes("కుటుంబం")) {
    return {
      title: "సౌర కుటుంబం",
      englishTitle: "The Solar System",
      category: "ఖగోళ శాస్త్రం (Astronomy)",
      explanation: "సౌర కుటుంబం అనేది సూర్యుడు మరియు దాని చుట్టూ తిరిగే ఎనిమిది గ్రహాలు, వాటి ఉపగ్రహాలు, తోకచుక్కలు మరియు గ్రహశకలాలతో కూడిన ఒక వ్యవస్థ. ఇది అంతరిక్షంలో గురుత్వాకర్షణ శక్తి ద్వారా ఒకదానితో ఒకటి బంధించబడి ఉంటుంది. సౌర వ్యవస్థ సుమారుగా 4.6 బిలియన్ సంవత్సరాల క్రితం ఒక విపరీతమైన పరమాణు మేఘం కూలిపోవడం వల్ల ఏర్పడిందని శాస్త్రవేత్తలు భావిస్తున్నారు.",
      keyPoints: [
        "సౌర కుటుంబానికి సూర్యుడే ప్రధాన ఆధారం మరియు శక్తి వనరు.",
        "మొత్తం 8 గ్రహాలు క్లాక్‌వైస్ కాకుండా స్థిరమైన కక్ష్యలలో తిరుగుతాయి.",
        "అంతర్గత గ్రహాలు రాతి నిర్మాణాలతోను, బాహ్య గ్రహాలు వాయు రూపాలలోను ఉంటాయి."
      ],
      studyTip: "గ్రహాల క్రమాన్ని గుర్తుపెట్టుకోవడానికి సూర్యుడి నుండి వాటి దూరాల ఆధారంగా గీసిన చార్టులను పరిశీలించండి.",
      examples: ["బుధుడు, శుక్రుడు, భూమి, అంగారకుడు, గురుడు, శని, యురేనస్, నెప్ట్యూన్"]
    };
  }

  if (normalized.includes("సూర్యుడు") || normalized.includes("the sun")) {
    return {
      title: "సూర్యుడు",
      englishTitle: "The Sun",
      category: "ఖగోళ శాస్త్రం (Astronomy)",
      explanation: "సూర్యుడు మన సౌర కుటుంబంలో కేంద్ర స్థానంలో ఉన్న ఒక పెద్ద నక్షత్రం. ఇది వేడి వాయువులతో నిండిన ఒక సువిశాల గోళం. దీని బరువు మొత్తం సౌర కుటుంబద్రవ్యరాశిలో 99.8% ఉంటుంది. దీని కేంద్రకం వద్ద నిరంతరం జరిగే కేంద్రక సంలీనం (Nuclear Fusion) ద్వారా అపారమైన వెలుతురు, వేడి ఉత్పత్తి అవుతుంది. ఇదే భూమిపై సమస్త జీవకోటి మనుగడకు ప్రధాన ఆధారం.",
      keyPoints: [
        "సూర్యుని వ్యాసం భూమి కంటే దాదాపు 109 రెట్లు పెద్దది.",
        "సూర్యుని నుంచి కాంతి భూమిని చేరుకోవడానికి 8 నిమిషాల 20 సెకన్లు పడుతుంది.",
        "ఇది ప్రధానంగా హైడ్రోజన్ (73%) మరియు హీలియం (25%) వాయువులతో నిర్మితమైంది."
      ],
      studyTip: "సూర్యకాంతి నుండి లభించే విటమిన్ D మానవ శరీర ఎదుగుదలకు ఎలా ఉపయోగపడుతుందో గమనించండి.",
      examples: ["సౌర శక్తి", "సూర్య నమస్కారాలు", "సాలార్ ఎనర్జీ ప్యానెల్స్"]
    };
  }

  if (normalized.includes("భూమి") || normalized.includes("earth")) {
    return {
      title: "భూమి",
      englishTitle: "The Earth",
      category: "లివింగ్ సిస్టమ్స్ (Living Systems)",
      explanation: "సౌర కుటుంబంలో జీవం ఉన్నట్లు గుర్తించబడిన ఒకే ఒక్క గ్రహం భూమి. ఇది సూర్యుని నుండి దూరం పరంగా మూడవ స్థానంలో ఉంది. ఇక్కడ అనుకూలమైన వాతావరణం, తగినంత నీరు ఉండడం వలన మొక్కలు, జంతువులు, మనుషులు జీవించడానికి సాధ్యమైంది. భూమి తన చుట్టూ తాను తిరగడానికి 24 గంటలు (ఒక రోజు), సూర్యుని చుట్టూ ఒకసారి తిరగడానికి 365 రోజులు (ఒక సంవత్సరం) సమయం పడుతుంది.",
      keyPoints: [
        "ఆవరణ వ్యవస్థలో ఓజోన్ పొర హానికరమైన అతినీలలోహిత కిరణాల నుండి మనల్ని రక్షిస్తుంది.",
        "భూమి ఉపరితలంపై 71% నీరు మరియు 29% భూభాగం ఉన్నాయి.",
        "భూమికి గల ఏకైక సహజ ఉపగ్రహం చంద్రుడు."
      ],
      studyTip: "ఋతువులు మారడానికి భూమి సూర్యుని చుట్టూ తిరిగే పరిభ్రమణం ఎలా కారణమవుతుందో ఊహించండి.",
      examples: ["భూమధ్యరేఖ", "ఉత్తర ధ్రువం", "దక్షిణ ధ్రువం"]
    };
  }

  if (normalized.includes("బుధుడు") || normalized.includes("mercury")) {
    return {
      title: "బుధుడు",
      englishTitle: "Mercury",
      category: "ఖగోళ శాస్త్రం (Astronomy)",
      explanation: "బుధుడు సౌర వ్యవస్థలోనే అత్యంత చిన్న గ్రహం మరియు సూర్యునికి అత్యంత దగ్గరగా ఉన్న ఖగోళ వస్తువు. దీనికి ఎటువంటి వాతావరణం లేదా సహజ ఉపగ్రహాలు లేవు. పగటిపూట ఉష్ణోగ్రతలు విపరీతంగా ఎక్కువగా ఉండి, రాత్రి వేళల్లో అత్యంత చల్లగా మారుతుంది.",
      keyPoints: [
        "సూర్యుని చుట్టూ తిరగడానికి కేవలం 88 రోజులు మాత్రమే పడుతుంది.",
        "సౌర కుటుంబంలో అత్యంత వేగంగా తిరిగే గ్రహం ఇదే.",
        "ఈ గ్రహం ఉపరితలం అంతా భారీ క్రేటర్స్ (గుంటలతో) నిండి ఉంటుంది."
      ],
      studyTip: "బుధుడికి వాతావరణం లేకపోవడం వల్లే అక్కడ పగలు మరియు రాత్రి ఉష్ణోగ్రతలలో విపరీతమైన తేడా ఉంటుందని గుర్తుంచుకోండి."
    };
  }

  if (normalized.includes("శుక్రుడు") || normalized.includes("venus")) {
    return {
      title: "శుక్రుడు",
      englishTitle: "Venus",
      category: "ఖగోళ శాస్త్రం (Astronomy)",
      explanation: "శుక్రుడు సౌర వ్యవస్థలో సూర్యుని నుండి రెండవ స్థానంలో ఉన్న అత్యంత ప్రకాశవంతమైన మరియు వేడి గ్రహం. దీని మందపాటి వాతావరణం కార్బన్ డయాక్సైడ్‌తో నిండి ఉండడం వల్ల హరితగృహ ప్రభావం (Greenhouse Effect) జరిగి వేడిని లోపలే బంధిస్తుంది. దీనిని ఉదయతార లేదా సంధ్యాకాల నక్షత్రం అని కూడా పిలుస్తారు.",
      keyPoints: [
        "ఇతర గ్రహాల కన్నా భిన్నంగా ఇది తూర్పు నుండి పడమరకు (ఆత్మపరిభ్రమణం) తిరుగుతుంది.",
        "ఇది పరిమాణంలో భూమిని పోలి ఉండడం వల్ల 'భూమి యొక్క సోదరి' (Earth's Twin) అంటారు.",
        "దీనిపై విపరీతమైన యాసిడ్ మేఘాలు ఉంటాయి."
      ],
      studyTip: "రాత్రి ఆకాశంలో చంద్రుని తర్వాత అత్యంత ప్రకాశవంతంగా కనిపించే గ్రహం ఇదేనని గుర్తుంచుకోండి."
    };
  }

  if (normalized.includes("అంగారకుడు") || normalized.includes("mars")) {
    return {
      title: "అంగారకుడు",
      englishTitle: "Mars",
      category: "ఖగోళ శాస్త్రం (Astronomy)",
      explanation: "అంగారకుడు లేదా కుజుడుని అరుణ గ్రహం లేదా 'రెడ్ ప్లానెట్' అని పిలుస్తారు. దీని ఉపరితలంపై ఉన్న ఐరన్ ఆక్సైడ్ (తుప్పు) కారణంగా ఇది ఎర్రగా కనిపిస్తుంది. మానవ పరిశోధనలు అధికంగా జరుగుతున్న గ్రహం ఇది. ఐస్ క్యాప్స్ మరియు పాత నదీ ప్రవాహాల ఆనవాళ్లు ఇక్కడ రేపటి మానవ ఉనికికి ఆశలు రేపుతున్నాయి.",
      keyPoints: [
        "దీనికి ఫోబోస్ మరియు డీమోస్ అనే రెండు చిన్న ఉపగ్రహాలు ఉన్నాయి.",
        "సౌర వ్యవస్థలోనే ఎత్తైన పర్వతం 'ఒలింపస్ మాన్స్' ఈ గ్రహంపైనే ఉంది.",
        "భారతదేశానికి చెందిన 'మంగళ్యాన్' ప్రాజెక్ట్ దీనిని విజయవంతంగా పరిశోధించింది."
      ],
      studyTip: "అరుణ గ్రహం పై మానవ కాలనీల ఏర్పాటు కోసం ప్రపంచవ్యాప్తంగా జరుగుతున్న రోబోటిక్ పరిశోధనల గురించి చదవండి."
    };
  }

  if (normalized.includes("గురుడు") || normalized.includes("jupiter")) {
    return {
      title: "గురుడు / బృహస్పతి",
      englishTitle: "Jupiter",
      category: "ఖగోళ శాస్త్రం (Astronomy)",
      explanation: "గురుడు సౌర వ్యవస్థ లోని అన్ని గ్రహాల కన్నా అతి పెద్ద వాయు గ్రహం. దీని ద్రవ్యరాశి ఇతర గ్రహాలన్నింటి సంయుక్త ద్రవ్యరాశి కంటే రెండున్నర రెట్లు ఎక్కువ. దీని ఉపరితలంపై నిరంతరం తిరిగే భారీ తుఫాను ఉంది, దీనిని 'గ్రేట్ రెడ్ స్పాట్' (Great Red Spot) అంటారు.",
      keyPoints: [
        "దీనికి 95 కంటే ఎక్కువ సహజ ఉపగ్రహాలు (చంద్రులు) కలవు, వాటిలో గనిమీడ్ అతిపెద్దది.",
        "తన చుట్టూ తాను కేవలం 10 గంటలలోనే తిరుగుతుంది శరవేగంతో.",
        "ఇది ఒక గ్యాస్ జెయింట్ (వాయు రాక్షసి), అంటే దీనికి గట్టి ఉపరితలం లేదు."
      ],
      studyTip: "గనిమీడ్ అనే ఉపగ్రహం పరిమాణంలో బుధగ్రహం కన్నా కూడా పెద్దదని గమనించండి."
    };
  }

  if (normalized.includes("భాషా భాగాలు") || normalized.includes("parts of speech")) {
    return {
      title: "తెలుగు భాషా భాగాలు",
      englishTitle: "Telugu Parts of Speech",
      category: "తెలుగు వ్యాకరణం (Telugu Grammar)",
      explanation: "తెలుగు వ్యాకరణంలో మాటలను లేదా భాషను వాటి उपयोगం మరియు అర్థాన్ని బట్టి ఐదు విభాగాలుగా వర్గీకరించారు. వీటినే భాషా భాగాలు అంటారు. ఇవి వాక్యాల అర్థవంతమైన అమరికకు, శైలికి ప్రాణం పోస్తాయి. చక్కని వ్యావహారిక భాషలో మాట్లాడాలన్నా, గ్రంథాలు రాయాలన్నా భాషా భాగాల పరిజ్ఞానం ఎంతో అవసరం.",
      keyPoints: [
        "మొత్తం భాషా భాగాలు ఐదు: నామవాచకం, సర్వనామం, క్రియ, విశేషణం, అవ్యయం.",
        "ప్రతి ఒక్క భాగం ఒక వాక్యంలో నిర్దిష్టమైన శీర్షికను కలిగి ఉంటుంది.",
        "విభక్తులను కలపడం ద్వారా వీటికి రూపాలు స్థిరీకరించబడతాయి."
      ],
      studyTip: "రోజువారీ సంభాషణల్లోని వాక్యాలను తీసుకుని, ఆ పదాలు ఏ ఏ భాషా భాగాలకు చెందుతాయో గుర్తించే ప్రాక్టీస్ చేయండి.",
      examples: ["రాముడు (నామవాచకం)", "అతడు (సర్వనామం)", "తింటున్నాడు (క్రియ)", "మంచి (విశేషణం)", "ఆహా! (అవ్యయం)"]
    };
  }

  if (normalized.includes("నామవాచకం") || normalized.includes("noun")) {
    return {
      title: "నామవాచకం",
      englishTitle: "Noun",
      category: "తెలుగు వ్యాకరణం (Telugu Grammar)",
      explanation: "మనుషులు, జంతువులు, పక్షులు, స్థలాలు, నదులు, చెట్లు మరియు వస్తువుల పేర్లను తెలియజేసే పదాలను నామవాచకం అని పిలుస్తారు. దీనిని సంస్కృతంలో 'నామధేయం' అంటారు. ఏదైనా ఒక ప్రత్యేక విషయాన్ని గుర్తించడానికి వాడే పదాలన్నీ ఈ వర్గంలోకే వస్తాయి.",
      keyPoints: [
        "వ్యక్తుల పేర్లు: కృష్ణుడు, వశిష్ట, రాధాకృష్ణ.",
        "స్థలాల పేర్లు: అమరావతి, తిరుపతి, హైదరాబాద్.",
        "గుణాలు/భావాల పేర్లు: సత్యం, ధైర్యం, కరుణ, సంతోషం."
      ],
      studyTip: "ఆబ్జెక్ట్ లేదా వస్తువును చూసిన వెంటనే వచ్చే పేరు నామవాచకం అని సులభంగా గుర్తుపెట్టుకోండి.",
      examples: ["గ్రామం", "గోదావరి", "పుస్తకం", "సింహం", "జ్ఞానం"]
    };
  }

  if (normalized.includes("సర్వనామం") || normalized.includes("pronoun")) {
    return {
      title: "సర్వనామం",
      englishTitle: "Pronoun",
      category: "తెలుగు వ్యాకరణం (Telugu Grammar)",
      explanation: "నామవాచకానికి బదులుగా వాడే పదాలను సర్వనామం అంటారు. ప్రతి వాక్యంలోనూ ఒకే పేరును మాటిమాటికీ ఉపయోగించడం వల్ల భాషా సౌందర్యం దెబ్బతింటుంది. అటువంటి సందర్భంలో పేరుకు బదులు ఉపయోగించే పదాలే సర్వనామాలు.",
      keyPoints: [
        "ప్రథమ పురుష: అతడు, ఆమె, అది, వారు, అవి.",
        "మధ్యమ పురుష: నీవు, మీరు.",
        "ఉత్తమ పురుష: నేను, మేము, మనము."
      ],
      studyTip: "కథలు చదివేటప్పుడు పాత్రల పేర్ల స్థానంలో వాడిన 'అతడు', 'ఆమె' వంటి పదాలను గమనించండి.",
      examples: ["నేను బడికి వెళ్తున్నాను.", "ఆమె చక్కగా పాడుతుంది.", "వారు ఆడుకుంటున్నారు."]
    };
  }

  if (normalized.includes("క్రియ") || normalized.includes("verb")) {
    return {
      title: "క్రియ",
      englishTitle: "Verb",
      category: "తెలుగు వ్యాకరణం (Telugu Grammar)",
      explanation: "చేసే పనులను తెలియజేసే పదాలను క్రియలని అంటారు. వాక్యంలో కర్త ఏ పని చేస్తున్నాడో ఇది వివరిస్తుంది. తెలుగు వాక్యంలో క్రియ చివరగా వస్తుంది (కర్త - కర్మ - క్రియ విధానం). క్రియలు రెండు రకాలు: 1. సమాపక క్రియలు (పని పూర్తయినట్లు తెలిపేవి), 2. అసమాపక క్రియలు (పని ఇంకా పూర్తి కాలేదని తెలిపేవి).",
      keyPoints: [
        "సమాపక క్రియ ఉదాహరణ: తిన్నాడు, వెళ్ళింది, చూశారు.",
        "అసమాపక క్రియ ఉదాహరణ: తిని, వెళ్తూ, రాయడానికి.",
        "క్రియల ద్వారా వాక్యం యొక్క కాలం (భూత, వర్తమాన, భవిష్యత్) తెలుస్తుంది."
      ],
      studyTip: "ఏదైనా కదలిక లేదా కార్యాన్ని సూచించే అరబిక్ లేదా సమాంతర పదాలన్నీ క్రియలని గ్రహించండి.",
      examples: ["రమాదేవి నృత్యం *చేస్తోంది*.", "పిల్లలు మైదానంలో *ఆడుకుంటున్నారు*."]
    };
  }

  if (normalized.includes("విశేషణం") || normalized.includes("adjective")) {
    return {
      title: "విశేషణం",
      englishTitle: "Adjective",
      category: "తెలుగు వ్యాకరణం (Telugu Grammar)",
      explanation: "నామవాచకాల మరియు సర్వనామాల యొక్క గుణాలను, స్వభావాలను, రంగులను, రుచులను లేదా కొలతలను తెలియజేసే పదాలను విశేషణం అంటారు. ఇవి ఒక వస్తువు లేదా వ్యక్తి ఎలా ఉన్నారో వివరిస్తాయి.",
      keyPoints: [
        "గుణ విశేషణం: మంచి బాలుడు, క్రూర జంతువు.",
        "రంగు/రుచి విశేషణం: తెల్లని హంస, తియ్యటి మామిడి పండు.",
        "సంఖ్యా విశేషణం: ముగ్గురు మునులు, పది మంది రాజులు."
      ],
      studyTip: "నామవాచకం 'ఎలా ఉంది?' అని ప్రశ్నిస్తే వచ్చే సమాధానమే విశేషణం అని గుర్తుంచుకోండి.",
      examples: ["*నల్లని* కాకి", "*పుల్లని* రసం", "*ఎత్తైన* కొండ"]
    };
  }

  if (normalized.includes("స్వాతంత్ర్య") || normalized.includes("freedom struggle") || normalized.includes("సమరం")) {
    return {
      title: "భారత స్వాతంత్ర్య సమరం",
      englishTitle: "Indian Freedom Struggle",
      category: "చరిత్ర (History)",
      explanation: "భారతదేశానికి బ్రిటిష్ పాలన నుండి విముక్తి కల్పించడం కోసం దశాబ్దాల పాటు సాగిన వీరోచిత పోరాటమే స్వాతంత్ర్య సమరం. ఇది కేవలం ఒక యుద్ధం కాదు; అహింసాయుత సత్యాగ్రహాలు, అనేక విప్లవాత్మక ఉద్యమాలు మరియు విప్లవ వీరుల ప్రాణత్యాగాల సమాహారం. ఎందరో మహానుభావుల నిరంతర ఆందోళనల ఫలంగా మనకు 1947 ఆగస్టు 15న స్వాతంత్ర్యం లభించింది.",
      keyPoints: [
        "బ్రిటిష్ ఈస్ట్ ఇండియా కంపెనీ వ్యాపార నెపంతో భారత్‌లోకి ప్రవేశించి ఆక్రమించింది.",
        "పోరాటంలో మితవాదులు, అతివాదులు, విప్లవకారులు వివిధ మార్గాలలో పోరాడారు.",
        "మహాత్మా గాంధీ ప్రవేశంతో ఈ పోరాటం ఒక ప్రజా ఉద్యమంగా మారింది."
      ],
      studyTip: "ముఖ్యమైన ఉద్యమాలు మరియు సంవత్సరాలను ఒక కాలానుక్రమ పట్టిక (Timeline) రూపంలో గీసుకుని చదవండి.",
      examples: ["మహాత్మా గాంధీ", "నేతాజీ సుభాష్ చంద్రబోస్", "భగత్ సింగ్", "ఝాన్సీ లక్ష్మీబాయి"]
    };
  }

  if (normalized.includes("గాంధీ") || normalized.includes("gandhi")) {
    return {
      title: "మహాత్మా గాంధీ",
      englishTitle: "Mahatma Gandhi",
      category: "చరిత్ర (History)",
      explanation: "మహాత్మా గాంధీ (మోహన్‌దాస్ కరంచంద్ గాంధీ) భారత స్వాతంత్ర్య సంగ్రామంలో అత్యున్నత నాయకుడు. ఆయన ప్రపంచానికి 'సత్యం' మరియు 'అహింస' అనే పరమ పవిత్ర పోరాట మార్గాలను పరిచయం చేశారు. ఉప్పు సత్యాగ్రహం, సహాయ నిరాకరణ ఉద్యమం మరియు క్విట్ ఇండియా ఉద్యమాలను ముందుండి నడిపించారు. కుల నిర్మూలనకు, అంటరానితనం తొలగింపుకు విరామం లేకుండా కృషి చేశారు.",
      keyPoints: [
        "ఆయనను రవీంద్రనాథ్ ఠాగూర్ 'మహాత్మా' అని సంబోధించారు.",
        "ఆయన జన్మదినమైన అక్టోబర్ 2న అంతర్జాతీయ అహింసా దినోత్సవంగా ఐరాస ప్రకటించింది.",
        "సాధారణ ఖాదీ వస్త్రధారణతో స్వదేశీ వస్తువుల వినియోగానికి ప్రతీకగా నిలిచారు."
      ],
      studyTip: "ఆయన ఆత్మకథ 'సత్యశోధన' (My Experiments with Truth) లోని సత్యనిష్ఠ ఘట్టాలను గ్రంథాలయాలలో చదవండి.",
      examples: ["దండి యాత్ర", "సహాయ నిరాకరణ", "సబర్మతీ ఆశ్రమం"]
    };
  }

  // --- GENERAL DIRECT DYNAMIC FALLBACK (WITHOUT GENERIC FILLERS OR AI EDUCATIONAL JARGON) ---
  const dynamicKeyPoints: string[] = [];
  if (nodeChildren && nodeChildren.length > 0) {
    nodeChildren.forEach(childText => {
      const cleanedChild = childText.replace(/^[-*•\d.\s)]+/, "").trim();
      if (cleanedChild.length > 2 && dynamicKeyPoints.length < 5) {
        dynamicKeyPoints.push(cleanedChild);
      }
    });
  }

  if (dynamicKeyPoints.length === 0) {
    dynamicKeyPoints.push(`"${cleanTitle}" కు అనుబంధంగా ఉన్న ముఖ్యాంశాలను మైండ్ మ్యాప్‌లో మరింత వివరణతో చూడవచ్చు.`);
    dynamicKeyPoints.push(`స్పష్టత కొరకు వాటిని మీ పట్టికలో నోట్స్ రాసి ఉంచుకోండి.`);
  }

  const category = text === cleanTitle ? "పాఠ్యాంశం (Lesson Topic)" : `ఉప విభాగం (Supporting Concept)`;

  return {
    title: cleanTitle,
    englishTitle: englishTitle || `${cleanTitle}`,
    category: category,
    explanation: `"${text}" అనేది ఈ పాఠ్య విశ్లేషణలో ప్రస్తావించబడిన ఒక ప్రధాన శీర్షిక. దీనికి సంబంధించిన కీలక విషయాలు కింద సులభంగా వివరించబడ్డాయి.`,
    keyPoints: dynamicKeyPoints,
    studyTip: `ఈ భావనను క్రమబద్ధంగా మరొకసారి మననం చేసుకుని పరీక్షలకు సిద్ధమవండి.`,
    examples: nodeChildren && nodeChildren.length > 0 ? nodeChildren.slice(0, 3) : undefined
  };
}
