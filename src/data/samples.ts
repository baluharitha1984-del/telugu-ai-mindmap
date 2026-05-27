import { SavedMap } from "../types";
import { SAMPLE_TEXTS } from "./sampleTexts";

export const SAMPLE_MAPS: SavedMap[] = [
  {
    id: "sample-solar-system",
    title: "సౌర కుటుంబం (Solar System)",
    description: "సూర్యుడు, గ్రహాలు మరియు ఇతర ఖగోళ వస్తువుల గురించిన సమగ్ర అవగాహన.",
    originalText: SAMPLE_TEXTS.solar,
    createdAt: "2026-05-27T00:00:00Z",
    rootNode: {
      id: "solar-root",
      text: "సౌర కుటుంబం\n(The Solar System)",
      children: [
        {
          id: "solar-sun",
          text: "సూర్యుడు (The Sun)",
          children: [
            { id: "sun-star", text: "సౌర వ్యవస్థ కేంద్రంలో ఉన్న ఒక నక్షత్రం" },
            { id: "sun-gas", text: "హైడ్రోజన్ మరియు హీలియం వాయువులతో నిండి ఉంది" },
            { id: "sun-energy", text: "భూమిపై జీవానికి ప్రధాన శక్తి వనరు" }
          ]
        },
        {
          id: "solar-inner",
          text: "అంతర్గత గ్రహాలు (Inner Planets)",
          children: [
            { id: "inner-1", text: "బుధుడు (Mercury) - సూర్యునికి అతి దగ్గరి గ్రహం" },
            { id: "inner-2", text: "శుక్రుడు (Venus) - అత్యంత వేడి గ్రహం" },
            { id: "inner-3", text: "భూమి (Earth) - జీవం ఉన్న ఏకైక గ్రహం" },
            { id: "inner-4", text: "అంగారకుడు (Mars) - అరుణ గ్రహం (రెడ్ ప్లానెట్)" }
          ]
        },
        {
          id: "solar-outer",
          text: "బాహ్య గ్రహాలు (Outer Planets)",
          children: [
            { id: "outer-1", text: "గురుడు (Jupiter) - సౌర వ్యవస్థలోనే పెద్ద గ్రహం" },
            { id: "outer-2", text: "శని (Saturn) - అందమైన వలయాలు ఉన్న గ్రహం" },
            { id: "outer-3", text: "వరుణుడు (Uranus) - మంచుతో నిండిన రాక్షస గ్రహం" },
            { id: "outer-4", text: "ఇంద్రుడు (Neptune) - సూర్యునికి చాలా దూరంలో ఉన్న గ్రహం" }
          ]
        },
        {
          id: "solar-others",
          text: "ఇతర ఖగోళ వస్తువులు",
          children: [
            { id: "other-satellite", text: "ఉపగ్రహాలు - గ్రహాల చుట్టూ తిరిగేవి (ఉదా: చంద్రుడు)" },
            { id: "other-asteroids", text: "గ్రహశకలాలు (Asteroids) - రాతి ముక్కలు" },
            { id: "other-comets", text: "తోకచుక్కలు (Comets) - మంచు మరియు ధూళి కణాలు" }
          ]
        }
      ]
    }
  },
  {
    id: "sample-telugu-grammar",
    title: "తెలుగు భాషా భాగాలు (Parts of Speech)",
    description: "తెలుగు వ్యాకరణంలో వాక్య నిర్మాణానికి అవసరమైన భాషా భాగాల వర్గీకరణ.",
    originalText: SAMPLE_TEXTS.grammar,
    createdAt: "2026-05-27T01:00:00Z",
    rootNode: {
      id: "grammar-root",
      text: "భాషా భాగాలు\n(Parts of Speech)",
      children: [
        {
          id: "g-noun",
          text: "నామవాచకం (Noun)",
          children: [
            { id: "g-noun-def", text: "మనుషులు, స్థలాలు, వస్తువుల పేర్లను తెలియజేసే పదాలు" },
            { id: "g-noun-eg", text: "ఉదాహరణలు: రాముడు, హైదరాబాదు, గోదావరి, సింహం" }
          ]
        },
        {
          id: "g-pronoun",
          text: "సర్వనామం (Pronoun)",
          children: [
            { id: "g-pro-def", text: "నామవాచకానికి బదులుగా వాడబడే పదాలు" },
            { id: "g-pro-eg", text: "ఉదాహరణలు: అతడు, ఆమె, ఇది, వారు, నేను" }
          ]
        },
        {
          id: "g-verb",
          text: "క్రియ (Verb)",
          children: [
            { id: "g-verb-def", text: "పనులను తెలియజేసే పదాలు" },
            { id: "g-verb-eg", text: "ఉదాహరణలు: చదివాడు, రాస్తోంది, నడుస్తున్నారు, వెళ్ళాడు" }
          ]
        },
        {
          id: "g-adjective",
          text: "విశేషణం (Adjective)",
          children: [
            { id: "g-adj-def", text: "నామవాచకాల లేదా సర్వనామాల గుణాలను తెలియజేసేవి" },
            { id: "g-adj-eg", text: "ఉదాహరణలు: నల్లని తాడు, మధురమైన గొంతు, పెద్ద ఇల్లు" }
          ]
        },
        {
          id: "g-indeclinable",
          text: "అవ్యయం (Indeclinable)",
          children: [
            { id: "g-ind-def", text: "లింగ, వచన, విభక్తుల మార్పు లేని పదాలు" },
            { id: "g-ind-eg", text: "ఉదాహరణలు: ఆహా!, అయ్యో!, అక్కడ, ఎక్కడ, మరియు" }
          ]
        }
      ]
    }
  },
  {
    id: "sample-freedom-struggle",
    title: "భారత స్వాతంత్ర్య సమరం",
    description: "భారతదేశానికి స్వాతంత్ర్యం సిద్ధించడానికి జరిగిన పోరాటంలో ముఖ్యమైన అంశాలు.",
    originalText: SAMPLE_TEXTS.freedom,
    createdAt: "2026-05-27T02:00:00Z",
    rootNode: {
      id: "freedom-root",
      text: "భారత స్వాతంత్ర్య సమరం\n(Freedom Struggle)",
      children: [
        {
          id: "f-milestones",
          text: "ముఖ్యమైన మైలురాళ్ళు",
          children: [
            { id: "milestone-1857", text: "1857 సిపాయిల తిరుగుబాటు - ప్రథమ స్వతంత్ర సంగ్రామం" },
            { id: "milestone-1885", text: "1885 ఐఎన్‌సి (INC) స్థాపన - వ్యవస్థీకృత పోరాటం" },
            { id: "milestone-1947", text: "1947 ఆగస్టు 15 - భారతదేశానికి స్వాతంత్ర్యం లభించడం" }
          ]
        },
        {
          id: "f-movements",
          text: "ప్రధాన ఉద్యమాలు",
          children: [
            { id: "mov-vandemataram", text: "వందేమాతరం ఉద్యమం (1905) - బెంగాల్ విభజన వ్యతిరేకత" },
            { id: "mov-noncooperation", text: "సహాయ నిరాకరణ ఉద్యమం (1920) - గాంధీజీ నాయకత్వంలో" },
            { id: "mov-salt", text: "శాసనోల్లంఘన లేదా ఉప్పు సత్యాగ్రహం (1930) - దండి యాత్ర" },
            { id: "mov-quitindia", text: "క్విట్ ఇండియా ఉద్యమం (1942) - డూ ఆర్ డై నినాదం" }
          ]
        },
        {
          id: "f-leaders",
          text: "ప్రముఖ నాయకులు",
          children: [
            { id: "lead-gandhi", text: "మహాత్మా గాంధీ - సత్యం మరియు అహింస సిద్ధాంతాలు" },
            { id: "lead-alluri", text: "అల్లూరి సీతారామరాజు - మన్యం తిరుగుబాటు విప్లవ వీరుడు" },
            { id: "lead-scbose", text: "సుభాష్ చంద్రబోస్ - ఆజాద్ హింద్ ఫౌజ్ స్థాపకుడు" },
            { id: "lead-patel", text: "సర్దార్ వల్లభాయ్ పటేల్ - సంస్థానాల విలీనం" }
          ]
        }
      ]
    }
  }
];
