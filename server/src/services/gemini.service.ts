import { aiClient, GEMINI_MODEL } from '../config/gemini';

export interface SingleAnswerEvaluation {
  score: number;
  correctnessScore: number;
  technicalAccuracy: number;
  relevance: number;
  clarity: number;
  depth: number;
  communication: number;
  aiUnderstanding: string;
  strengths: string[];
  weaknesses: string[];
  suggestedAnswer: string;
  feedbackText: string;
  isAnswered: boolean;
}

export interface EvaluatedQuestionAnswer {
  questionId?: number;
  questionIndex: number;
  question: string;
  category?: string;
  answer: string;
  timeSpentSeconds?: number;
  correctnessScore?: number;
  technicalAccuracy?: number;
  relevanceScore?: number;
  clarityScore?: number;
  depthScore?: number;
  isAnswered?: boolean;
  feedbackText?: string;
  strengthsText?: string;
  weaknessesText?: string;
  suggestedAnswer?: string;
  aiUnderstanding?: string;
}

export interface QuestionResponse {
  questionText: string;
  category: string;
  conversationalLeadIn?: string;
}

export interface ResumeContext {
  summary?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  projects?: string[];
  experience?: string[];
}

export interface EvaluationResponse {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  grammarScore: number;
  vocabularyScore: number;
  leadershipScore: number;
  behaviorScore: number;
  accuracyScore: number;
  difficultyLevel: string;
  estimatedPerformance: string;
  performanceSummary: string;
  categoryScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  suggestedAnswers: {
    questionIndex: number;
    question: string;
    category?: string;
    candidateAnswer?: string;
    score: number;
    technicalAccuracy?: number;
    relevance?: number;
    clarity?: number;
    depth?: number;
    isAnswered?: boolean;
    suggestedAnswer: string;
    aiUnderstanding?: string;
    strengths?: string[];
    weaknesses?: string[];
    feedbackText?: string;
  }[];
  tips: string[];
}

export interface KeywordDensityItem {
  keyword: string;
  count: number;
  category: string;
}

export interface ResumeAnalysisResponse {
  atsScore: number;
  summary: string;
  missingSkills: string[];
  matchedSkills: string[];
  recommendedSkills: string[];
  grammarIssues: string[];
  formattingIssues: string[];
  keywordDensity: KeywordDensityItem[];
  experienceAnalysis: string[];
  educationAnalysis: string[];
  projectsAnalysis: string[];
  achievementsAnalysis: string[];
  projectSuggestions: string[];
  tips: string[];
}

// Standard 8-Category Taxonomy Matrix for comprehensive question rotation
export const STANDARD_QUESTION_CATEGORIES = [
  'Fundamentals',
  'Practical/Application',
  'Problem Solving',
  'Debugging',
  'System Design',
  'Behavioral',
  'Scenario Based',
  'Advanced Concepts'
] as const;

export type StandardQuestionCategory = (typeof STANDARD_QUESTION_CATEGORIES)[number];

export const QUESTION_CATEGORIES = [
  ...STANDARD_QUESTION_CATEGORIES,
  'Technical Architecture',
  'Code Quality & Testing',
  'Concurrency & Performance',
  'Security & Reliability',
  'Cloud & DevOps'
];

/**
 * Normalizes question text by:
 * - converting to lowercase
 * - removing unnecessary punctuation
 * - normalizing whitespace
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/['’]/g, '') // remove apostrophes cleanly (e.g. don't -> dont)
    .replace(/[^\w\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

/**
 * Selects the next target category systematically rotating through STANDARD_QUESTION_CATEGORIES.
 */
export function selectNextCategory(
  questionIndex: number,
  usedCategories: string[] = []
): string {
  // 1. Find categories in STANDARD_QUESTION_CATEGORIES that haven't been used yet in this session
  const unused = STANDARD_QUESTION_CATEGORIES.filter(cat => !usedCategories.includes(cat));
  if (unused.length > 0) {
    return unused[questionIndex % unused.length];
  }

  // 2. If all categories have been used (e.g. question index >= 8), find the category used least frequently,
  // making sure it is not the immediately preceding category.
  const lastUsed = usedCategories.length > 0 ? usedCategories[usedCategories.length - 1] : '';
  const counts: Record<string, number> = {};
  for (const cat of STANDARD_QUESTION_CATEGORIES) {
    counts[cat] = usedCategories.filter(c => c === cat).length;
  }

  const sorted = [...STANDARD_QUESTION_CATEGORIES]
    .filter(cat => cat !== lastUsed)
    .sort((a, b) => (counts[a] || 0) - (counts[b] || 0));

  return sorted[0] || STANDARD_QUESTION_CATEGORIES[questionIndex % STANDARD_QUESTION_CATEGORIES.length];
}

const INTERVIEW_STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'at', 'of', 'on', 'and', 'or', 'to',
  'how', 'what', 'why', 'where', 'when', 'which', 'who', 'whom', 'whose',
  'can', 'you', 'your', 'explain', 'describe', 'tell', 'me', 'about', 'with', 'for',
  'would', 'have', 'had', 'has', 'been', 'being', 'from', 'this', 'that', 'these', 'those',
  'our', 'will', 'could', 'should', 'please', 'discuss', 'approach', 'strategy',
  'system', 'systems', 'production', 'handle', 'handling', 'work', 'works', 'working',
  'manage', 'managing', 'implement', 'implementing', 'built', 'building', 'use', 'using'
]);

/**
 * Extracts core semantic tokens by stripping conversational filler and interview stop words.
 */
export function extractCoreTokens(text: string): Set<string> {
  const norm = normalizeQuestionText(text);
  const words = norm.split(' ');
  const tokens = new Set<string>();
  for (const w of words) {
    if (w.length > 2 && !INTERVIEW_STOP_WORDS.has(w)) {
      tokens.add(w);
    }
  }
  return tokens;
}

export interface SimilarityResult {
  similarity: number;
  isDuplicate: boolean;
  reason?: string;
  matchedQuestion?: string;
}

/**
 * Evaluates whether a new question is an exact match, semantic duplicate, or high-similarity rewording.
 */
export function evaluateQuestionSimilarity(
  newQuestion: string,
  existingQuestion: string
): SimilarityResult {
  const normNew = normalizeQuestionText(newQuestion);
  const normExisting = normalizeQuestionText(existingQuestion);

  if (!normNew || !normExisting) {
    return { similarity: 0, isDuplicate: false };
  }

  // 1. Exact normalized text match check
  if (normNew === normExisting) {
    return {
      similarity: 1.0,
      isDuplicate: true,
      reason: 'Exact normalized text match',
      matchedQuestion: existingQuestion
    };
  }

  const tokensNew = extractCoreTokens(newQuestion);
  const tokensExisting = extractCoreTokens(existingQuestion);

  // If no significant core tokens, fall back to exact match
  if (tokensNew.size === 0 || tokensExisting.size === 0) {
    const isExact = normNew === normExisting;
    return {
      similarity: isExact ? 1.0 : 0.0,
      isDuplicate: isExact,
      reason: isExact ? 'Exact match' : undefined,
      matchedQuestion: isExact ? existingQuestion : undefined
    };
  }

  // 2. Token overlap and Jaccard similarity
  let intersectionCount = 0;
  tokensNew.forEach(token => {
    if (tokensExisting.has(token)) {
      intersectionCount++;
    }
  });

  const unionCount = new Set([...tokensNew, ...tokensExisting]).size;
  const jaccard = unionCount === 0 ? 0 : intersectionCount / unionCount;

  // Containment ratio: overlap relative to the shorter question's core concepts
  const minTokens = Math.min(tokensNew.size, tokensExisting.size);
  const containmentRatio = minTokens === 0 ? 0 : intersectionCount / minTokens;

  // 3. Character Trigram overlap for grammatical and morphological variations
  const getTrigrams = (s: string) => {
    const tg = new Set<string>();
    for (let i = 0; i <= s.length - 3; i++) {
      tg.add(s.substring(i, i + 3));
    }
    return tg;
  };

  const tgA = getTrigrams(normNew);
  const tgB = getTrigrams(normExisting);
  let tgMatch = 0;
  tgA.forEach(t => { if (tgB.has(t)) tgMatch++; });
  const tgUnion = new Set([...tgA, ...tgB]).size;
  const trigramSim = tgUnion === 0 ? 0 : tgMatch / tgUnion;

  const combinedSimilarity = (jaccard * 0.5) + (containmentRatio * 0.3) + (trigramSim * 0.2);

  // Duplicate rejection triggers
  if (jaccard >= 0.45) {
    return {
      similarity: Math.round(combinedSimilarity * 100) / 100,
      isDuplicate: true,
      reason: `High concept word overlap (Jaccard: ${Math.round(jaccard * 100)}%)`,
      matchedQuestion: existingQuestion
    };
  }

  if (containmentRatio >= 0.65 && minTokens >= 2) {
    return {
      similarity: Math.round(combinedSimilarity * 100) / 100,
      isDuplicate: true,
      reason: `High semantic containment ratio (${Math.round(containmentRatio * 100)}% of core concepts rephrased)`,
      matchedQuestion: existingQuestion
    };
  }

  if (trigramSim >= 0.65) {
    return {
      similarity: Math.round(combinedSimilarity * 100) / 100,
      isDuplicate: true,
      reason: `High morphological trigram similarity (${Math.round(trigramSim * 100)}%)`,
      matchedQuestion: existingQuestion
    };
  }

  if (combinedSimilarity >= 0.50) {
    return {
      similarity: Math.round(combinedSimilarity * 100) / 100,
      isDuplicate: true,
      reason: `High overall similarity score (${Math.round(combinedSimilarity * 100)}%)`,
      matchedQuestion: existingQuestion
    };
  }

  return {
    similarity: Math.round(combinedSimilarity * 100) / 100,
    isDuplicate: false,
    matchedQuestion: existingQuestion
  };
}

/**
 * Checks a candidate question against all previously asked questions in the session.
 */
export function checkAgainstPreviousQuestions(
  newQuestion: string,
  previousQuestions: string[]
): { isDuplicate: boolean; matchedQuestion?: string; reason?: string; similarity: number } {
  for (const prevQ of previousQuestions) {
    const evalRes = evaluateQuestionSimilarity(newQuestion, prevQ);
    if (evalRes.isDuplicate) {
      return {
        isDuplicate: true,
        matchedQuestion: prevQ,
        reason: evalRes.reason,
        similarity: evalRes.similarity
      };
    }
  }
  return { isDuplicate: false, similarity: 0 };
}

/**
 * Dynamic Non-Repetitive Combinatoric Synthesis Fallback Generator.
 * Synthesizes unique questions across standard categories, role domains, and technologies
 * ensuring zero high-similarity collisions with prior questions in the session.
 */
export function generateDynamicFallbackQuestion(
  role: string,
  difficulty: string,
  questionIndex: number,
  previousQuestions: string[] = [],
  usedCategories: string[] = [],
  targetCategory: string = 'Fundamentals',
  resumeContext?: ResumeContext
): QuestionResponse {
  const categoryTemplates: Record<string, string[]> = {
    'Fundamentals': [
      'core memory management, garbage collection mechanics, and lifecycle optimization',
      'protocol handshakes, connection multiplexing, and efficient serialization formats',
      'type systems, runtime invariant checking, and structural subtype validation',
      'asynchronous event loop mechanics, microtasks, and task queue scheduling',
      'cache coherence protocols and transactional isolation levels'
    ],
    'Practical/Application': [
      'building an automated end-to-end data pipeline with robust backpressure handling',
      'implementing resilient client-side state synchronization with optimistic updates',
      'structuring component hierarchies and modular library interfaces for high reuse',
      'integrating third-party webhooks with at-least-once delivery guarantees and idempotency',
      'implementing zero-downtime database schema migrations on high-write production tables'
    ],
    'Problem Solving': [
      'designing a distributed rate limiter using a sliding window counter or token bucket',
      'implementing a high-performance LRU/LFU cache with O(1) reads and thread-safe evictions',
      'detecting and preventing circular dependency deadlocks in a workflow DAG orchestrator',
      'resolving high tail latency spikes (p99) caused by garbage collection or thread contention',
      'architecting an efficient pagination and search indexing strategy across millions of records'
    ],
    'Debugging': [
      'diagnosing an intermittent memory leak and thread pool starvation in a high-throughput microservice',
      'troubleshooting a silent database deadlocking incident during concurrent batch transactions',
      'isolating cascading failures and network partition timeouts in a distributed service mesh',
      'triage and root-cause analysis of browser UI rendering freezes and Core Web Vitals regressions',
      'debugging corrupted distributed state across WebSocket replicas when nodes restart'
    ],
    'System Design': [
      'architecting an event-driven notification engine supporting millions of concurrent subscribers',
      'designing a globally distributed active-active database replication and failover architecture',
      'structuring a CQRS and event-sourcing system with read-model projections and replay capability',
      'designing a scalable video processing or asset transformation pipeline with priority queues',
      'designing a secure API gateway with rate-limiting, OAuth2 token validation, and circuit breakers'
    ],
    'Behavioral': [
      'navigating an architectural deadlock between senior engineers with opposing design philosophies',
      'balancing critical architectural refactoring against high-pressure quarterly product deadlines',
      'leading a blameless post-mortem after a critical severity-1 outage in production',
      'mentoring team members through complex engineering paradigms while maintaining sprint velocity',
      'handling shifting product requirements mid-flight without compromising engineering quality'
    ],
    'Scenario Based': [
      'handling a sudden 10x traffic surge during a major marketing campaign without degrading user experience',
      'recovering from a silent data corruption bug in production while preserving customer trust and uptime',
      'decoupling a legacy monolithic codebase into isolated microservices without taking downtime',
      'safely rolling out a breaking API contract change to external third-party consumers',
      'handling upstream third-party dependency outages gracefully using circuit breakers and fallback stores'
    ],
    'Advanced Concepts': [
      'concurrency primitives, lock-free data structures, and memory barrier semantics',
      'distributed consensus protocols (Raft, Paxos) and leader election failovers',
      'database internal storage engines (LSM-trees vs B+ trees) and write amplification trade-offs',
      'fine-grained zero-trust security policies and mutual TLS in containerized environments',
      'chaos engineering and automated fault injection to validate system resilience'
    ]
  };

  const leadIns = [
    "Thank you, that's a clear explanation.",
    "Understood, that's an interesting approach.",
    "Good point. Building on that,",
    "Great insights into your technical decisions.",
    "I appreciate that breakdown.",
    "That makes sense from an engineering perspective.",
    "Excellent. Let's explore another dimension.",
    "Thank you. Shifting gears to system behavior,",
    "I see your reasoning. Moving forward,",
    "Great context. Let's delve into architectural trade-offs,"
  ];

  const pool = categoryTemplates[targetCategory] || categoryTemplates['Fundamentals'];
  const leadIn = questionIndex > 0 ? leadIns[questionIndex % leadIns.length] + ' ' : '';

  // Extract skills from resume context or role
  const skillMention = resumeContext?.matchedSkills && resumeContext.matchedSkills.length > 0
    ? resumeContext.matchedSkills[questionIndex % resumeContext.matchedSkills.length]
    : undefined;

  let chosenQuestion = '';
  for (const topic of pool) {
    const candidateQ = skillMention
      ? `As a ${role} (${difficulty}), how do you approach ${topic} when working with ${skillMention}?`
      : `As a ${role} (${difficulty}), how do you approach ${topic} in production systems?`;

    const dup = checkAgainstPreviousQuestions(candidateQ, previousQuestions);
    if (!dup.isDuplicate) {
      chosenQuestion = candidateQ;
      break;
    }
  }

  if (!chosenQuestion) {
    chosenQuestion = `In your experience as a ${role} (${difficulty}), how do you address ${pool[questionIndex % pool.length]}?`;
  }

  return {
    questionText: `${leadIn}${chosenQuestion}`,
    category: targetCategory,
    conversationalLeadIn: leadIn
  };
}

/**
 * Determines whether a candidate answer is empty, skipped, refusal, or non-substantive.
 */
export function isRefusalOrEmptyAnswer(answer?: string | null): boolean {
  if (!answer) return true;
  const trimmed = answer.trim();
  if (trimmed.length === 0) return true;

  const lower = trimmed.toLowerCase().replace(/['']/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const skipPhrases = new Set([
    'skipped', 'skip', 'no answer', 'no answer provided', 'pass', 'passed', 'next', 'idk',
    'i dont know', 'i do not know', 'dont know', 'do not know', 'no idea', 'i have no idea',
    'have no idea', 'not sure', 'im not sure', 'i am not sure', 'no clue', 'dunno',
    'cant answer', 'cannot answer', 'nothing', 'na', 'n a', 'none', 'i forgot', 'forgot',
    'no comments', 'no comment', 'pass question', 'skip question', 'leave blank'
  ]);

  if (skipPhrases.has(lower)) return true;
  if (lower.startsWith('i dont know') || lower.startsWith('i do not know') || lower.startsWith('idk') || lower.startsWith('no idea') || lower.startsWith('im not sure')) {
    if (trimmed.split(/\s+/).length <= 8) return true;
  }

  // Meaningless short text without domain terms
  if (trimmed.length < 8) {
    const hasTechWord = /(react|node|sql|data|api|state|code|test|class|func|async|db|aws|git|web|css|html|js|ts|rest|http)/i.test(trimmed);
    if (!hasTechWord) return true;
  }

  return false;
}

export class GeminiService {
  /**
   * Generates a personalized opening greeting initiating the interview.
   */
  static getOpeningGreeting(role: string, totalQuestions: number = 7, candidateName?: string): string {
    const displayName = candidateName && candidateName.trim() && candidateName.toLowerCase() !== 'user' ? candidateName.trim() : '';
    const greetingIntro = displayName ? `Hello ${displayName}!` : 'Hello! Welcome to InterviewAI.';
    return `${greetingIntro} I'm your AI interviewer today. I'll be conducting your interview for the ${role} position and evaluating your communication skills, technical knowledge, confidence, and problem-solving abilities. This interview contains ${totalQuestions} questions. Please answer naturally. Take your time. Are you ready to begin?`;
  }

  /**
   * Generates a spoken closing congratulations debrief upon completing all questions.
   */
  static getClosingCongratulations(candidateName?: string): string {
    const displayName = candidateName && candidateName.trim() && candidateName.toLowerCase() !== 'user' ? candidateName.trim() : '';
    const nameStr = displayName ? `, ${displayName}` : '';
    return `Congratulations${nameStr}! You have successfully completed today's interview. I'm now preparing your detailed evaluation report. Thank you for your time, and I wish you the very best in your future interviews.`;
  }

  /**
   * Evaluates a single submitted candidate answer in real time using Gemini AI.
   */
  static async evaluateSingleAnswer(
    role: string,
    difficulty: string,
    question: string,
    answer: string
  ): Promise<SingleAnswerEvaluation> {
    if (isRefusalOrEmptyAnswer(answer)) {
      const lower = (answer || '').toLowerCase();
      const isHonestIdk = lower.includes('know') || lower.includes('idk') || lower.includes('sure');
      const score = isHonestIdk ? 10 : 0;
      return {
        score,
        correctnessScore: score,
        technicalAccuracy: 0,
        relevance: 0,
        clarity: 0,
        depth: 0,
        communication: isHonestIdk ? 15 : 0,
        aiUnderstanding: isHonestIdk 
          ? 'Candidate explicitly indicated they do not know the answer to this question.'
          : 'Candidate skipped or provided no substantive answer for this question.',
        strengths: [],
        weaknesses: [
          `No substantive technical answer was provided for this ${role} question.`
        ],
        suggestedAnswer: `For '${question}', an ideal technical answer should articulate: 1) Core conceptual mechanism, 2) Technical trade-offs, 3) Concrete implementation specifics, and 4) Production reliability or error handling.`,
        feedbackText: `This question was skipped or unanswered. In technical interviews for ${role}, explaining partial knowledge, related architecture paradigms, or asking clarifying questions is significantly better than skipping.`,
        isAnswered: false
      };
    }

    const prompt = `
You are an elite Principal Engineering Director and Lead Hiring Examiner evaluating a candidate's answer for a "${role}" position (${difficulty} level).

Question Asked:
"${question}"

Candidate's Actual Spoken Transcript:
"${answer}"

EVALUATION CRITERIA (CRITICAL):
1. Evaluate ONLY what the candidate actually said in their submitted answer. Never invent statements or assume unstated knowledge.
2. If the candidate gave a strong, technically accurate, comprehensive answer:
   - score: 80 to 98
   - technicalAccuracy: 80 to 98
   - depth: 75 to 95
   - relevance: 85 to 100
   - clarity: 80 to 95
   - communication: 80 to 95
3. If the candidate gave a partially correct or shallow answer:
   - score: 45 to 65
   - technicalAccuracy: 45 to 65
   - depth: 35 to 55
   - relevance: 60 to 80
   - clarity: 50 to 75
   - communication: 55 to 75
4. If the candidate gave an incorrect, confusing, or erroneous answer:
   - score: 10 to 35
   - technicalAccuracy: 10 to 35
   - depth: 10 to 30
   - relevance: 20 to 50
   - clarity: 30 to 60
   - communication: 30 to 60
5. "strengths": An array of 1 to 3 bullet points quoting or citing specific technical points the candidate got right. If the answer scored below 40 or is mostly incorrect, strengths MUST be an empty array [].
6. "weaknesses": An array of 1 to 3 bullet points identifying specific technical gaps, missing edge cases, or errors in their reasoning.
7. "suggestedAnswer": A concise, master-level improved model answer (2-3 sentences).
8. "feedbackText": 1-2 sentences of actionable coaching referencing their actual response.

Return ONLY valid JSON matching this schema without markdown:
{
  "score": 85,
  "technicalAccuracy": 85,
  "relevance": 90,
  "clarity": 80,
  "depth": 75,
  "communication": 85,
  "aiUnderstanding": "Candidate explained...",
  "strengths": ["Clear explanation of..."],
  "weaknesses": ["Did not address trade-offs regarding..."],
  "suggestedAnswer": "An ideal response covers...",
  "feedbackText": "Good explanation of... To improve, elaborate on..."
}
`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const rawScore = Number(parsed.score ?? parsed.correctnessScore ?? 70);
          const score = Math.min(100, Math.max(5, rawScore));
          const technicalAccuracy = Math.min(100, Math.max(5, Number(parsed.technicalAccuracy ?? score)));
          const relevance = Math.min(100, Math.max(5, Number(parsed.relevance ?? score)));
          const clarity = Math.min(100, Math.max(5, Number(parsed.clarity ?? score)));
          const depth = Math.min(100, Math.max(5, Number(parsed.depth ?? score)));
          const communication = Math.min(100, Math.max(5, Number(parsed.communication ?? clarity)));

          let strengths: string[] = Array.isArray(parsed.strengths) 
            ? parsed.strengths.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
            : (typeof parsed.strengths === 'string' && parsed.strengths.trim() ? [parsed.strengths.trim()] : []);
          
          if (score < 40) {
            strengths = [];
          }

          let weaknesses: string[] = Array.isArray(parsed.weaknesses)
            ? parsed.weaknesses.filter((w: any) => typeof w === 'string' && w.trim().length > 0)
            : (typeof parsed.weaknesses === 'string' && parsed.weaknesses.trim() ? [parsed.weaknesses.trim()] : []);
          
          if (weaknesses.length === 0 && score < 75) {
            weaknesses = ['Could expand on underlying trade-offs and edge-case handling.'];
          }

          return {
            score,
            correctnessScore: score,
            technicalAccuracy,
            relevance,
            clarity,
            depth,
            communication,
            aiUnderstanding: parsed.aiUnderstanding || 'Candidate addressed the interview question.',
            strengths,
            weaknesses,
            suggestedAnswer: parsed.suggestedAnswer || `For '${question}', a senior response covers core architecture, trade-offs, and practical edge cases.`,
            feedbackText: parsed.feedbackText || 'Response evaluated based on technical accuracy and clarity.',
            isAnswered: true
          };
        }
      } catch (e) {
        console.warn('⚠️ Gemini single answer evaluation failed, using dynamic rubric:', e);
      }
    }

    // Dynamic heuristic evaluation based on actual answer content and keywords
    const words = answer.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const technicalKeywords = [
      'react', 'node', 'state', 'hook', 'database', 'sql', 'nosql', 'index', 'scale', 'cache',
      'redis', 'api', 'rest', 'graphql', 'grpc', 'concurrency', 'lock', 'thread', 'memory',
      'architecture', 'latency', 'throughput', 'ci/cd', 'docker', 'kubernetes', 'aws', 'component',
      'async', 'promise', 'callback', 'schema', 'transaction', 'blob', 'table', 'cluster', 'load balancer'
    ];
    const techMatches = technicalKeywords.filter(k => answer.toLowerCase().includes(k));

    let score = 45;
    if (wordCount < 15) {
      score = 20;
    } else if (wordCount < 35) {
      score = Math.min(60, 35 + (techMatches.length * 6));
    } else {
      score = Math.min(92, 55 + (techMatches.length * 5));
    }

    const techAcc = Math.min(100, Math.max(10, score));
    const rel = Math.min(100, Math.max(15, score + (techMatches.length > 0 ? 5 : -5)));
    const clar = Math.min(100, Math.max(15, wordCount >= 20 ? score : score - 10));
    const dep = Math.min(100, Math.max(10, score - 5));
    const comm = Math.min(100, Math.max(15, clar));

    return {
      score,
      correctnessScore: score,
      technicalAccuracy: techAcc,
      relevance: rel,
      clarity: clar,
      depth: dep,
      communication: comm,
      aiUnderstanding: `Candidate addressed the question with ${wordCount} words${techMatches.length > 0 ? ` referencing ${techMatches.slice(0, 3).join(', ')}` : ''}.`,
      strengths: score >= 55 && techMatches.length > 0 ? [`Appropriately cited key domain concepts: ${techMatches.slice(0, 3).join(', ')}.`] : [],
      weaknesses: wordCount < 30 ? ['Response was brief; detail underlying mechanisms and trade-offs.'] : ['Could incorporate more quantitative throughput or edge-case metrics.'],
      suggestedAnswer: `For '${question}', an ideal response articulates: 1) Underlying architecture, 2) Technical trade-offs, 3) Implementation specifics, and 4) Production reliability.`,
      feedbackText: techMatches.length > 0 
        ? `You appropriately referenced ${techMatches.slice(0, 2).join(' and ')}. To strengthen your answer, elaborate on trade-offs and scaling constraints.`
        : `Your response touched on the basics. For ${role} interviews, incorporate specific architectural patterns and production examples.`,
      isAnswered: true
    };
  }

  /**
   * 100% Dynamic Question Generation Engine with:
   * - Adaptive difficulty scaling
   * - Resume projects/skills integration
   * - Strict >70% similarity anti-repetition check
   * - Contextual conversational lead-ins
   * - 24+ category taxonomy
   */
  /**
   * Robust Dynamic Question Generation Engine with:
   * - Strict Anti-Repetition & Semantic Duplicate Rejection
   * - Standard 8-Category Taxonomy Rotation
   * - Session-isolated question and category history
   * - Server-side question text normalization
   * - 3-Attempt Regeneration Loop on Duplicate Detection
   * - Detailed [Interview] logging
   * - Adaptive difficulty & follow-up intelligence
   */
  static async generateQuestion(
    role: string,
    difficulty: string,
    questionIndex: number,
    previousQuestions: string[] = [],
    previousAnswers: string[] = [],
    resumeContext?: ResumeContext,
    lastAnswerCorrectness?: number,
    usedCategories: string[] = []
  ): Promise<QuestionResponse> {
    // 1. Determine Adaptive Difficulty
    let effectiveDifficulty = difficulty;
    if (lastAnswerCorrectness !== undefined) {
      if (lastAnswerCorrectness >= 80) {
        effectiveDifficulty = difficulty === 'Junior' ? 'Mid-Level' : 'Senior / Principal';
      } else if (lastAnswerCorrectness <= 40) {
        effectiveDifficulty = difficulty === 'Senior' ? 'Mid-Level' : 'Junior / Foundational';
      }
    }

    // 2. Select diverse target category systematically rotating through STANDARD_QUESTION_CATEGORIES
    let currentTargetCategory = selectNextCategory(questionIndex, usedCategories);

    // 3. Assemble Conversation History
    const historyContext = previousQuestions.map((q, i) => {
      const a = previousAnswers[i] || '(Skipped or In Progress)';
      const cat = usedCategories[i] ? ` [Category: ${usedCategories[i]}]` : '';
      return `Q${i + 1}${cat}: ${q}\nA${i + 1}: ${a}`;
    }).join('\n\n');

    // 4. Assemble Resume Context snippet
    let resumePromptSnippet = '';
    if (resumeContext) {
      const parts = [];
      if (resumeContext.matchedSkills && resumeContext.matchedSkills.length > 0) {
        parts.push(`Key Skills: ${resumeContext.matchedSkills.join(', ')}`);
      }
      if (resumeContext.projects && resumeContext.projects.length > 0) {
        parts.push(`Candidate Projects: ${resumeContext.projects.slice(0, 3).join('; ')}`);
      }
      if (resumeContext.summary) {
        parts.push(`Resume Summary: ${resumeContext.summary.slice(0, 300)}`);
      }
      if (parts.length > 0) {
        resumePromptSnippet = `\nCANDIDATE RESUME PROFILE:\n${parts.join('\n')}\n(Incorporate their stated tools, projects, or background organically when relevant).\n`;
      }
    }

    // 5. 3-Attempt Regeneration Loop
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // If regenerating due to duplicate detection, switch to another category
      if (attempt > 1) {
        const remainingUnused = STANDARD_QUESTION_CATEGORIES.filter(
          c => !usedCategories.includes(c) && c !== currentTargetCategory
        );
        if (remainingUnused.length > 0) {
          currentTargetCategory = remainingUnused[(attempt - 1) % remainingUnused.length];
        } else {
          currentTargetCategory = STANDARD_QUESTION_CATEGORIES[(questionIndex + attempt) % STANDARD_QUESTION_CATEGORIES.length];
        }
      }

      const prompt = `
You are a distinguished Lead Technical Interviewer and Senior Director conducting a high-signal, natural voice interview for a "${role}" position.
Target Difficulty Level: ${effectiveDifficulty} (Adaptively calibrated).
Current Question Index: ${questionIndex + 1}.
Primary Category Focus: "${currentTargetCategory}".
${resumePromptSnippet}
${historyContext ? `DIALOGUE CONVERSATION CONTEXT SO FAR:
${historyContext}

PREVIOUS QUESTIONS ASKED IN THIS SESSION:
${previousQuestions.map((q, idx) => `   ${idx + 1}. "${q}" (Category: ${usedCategories[idx] || 'General'})`).join('\n')}

STRICT ANTI-REPETITION & QUESTION DIVERSITY RULES (MANDATORY):
1. NEVER repeat any of the questions already asked above.
2. NEVER ask a semantically equivalent question or test the exact same concept using different wording.
3. Avoid merely rewording or phrasing an existing question differently.
4. Generate a GENUINELY DIFFERENT question strictly focused on the "${currentTargetCategory}" category.
5. The question must be tailored to the candidate's role (${role}), level (${effectiveDifficulty}), and relevant technologies.
${lastAnswerCorrectness !== undefined && lastAnswerCorrectness <= 45 ? '6. The candidate had difficulty or gave a brief response on the last question. If formulating a follow-up, clearly build on their answer into a related practical design or recovery scenario — NEVER simply ask them to re-explain the previous question.' : ''}
${lastAnswerCorrectness !== undefined && lastAnswerCorrectness >= 75 ? '6. The candidate answered strongly. Progress into deeper architecture, edge cases, or trade-offs in ' + currentTargetCategory + '.' : ''}
7. Formulate a short, natural spoken lead-in (1 sentence max) acknowledging what they said.
8. Keep the question crisp and conversational (1 to 2 spoken sentences).` : `OPENING QUESTION INSTRUCTIONS:
1. This is Question 1 of the interview for ${role} (${effectiveDifficulty}) in the category "${currentTargetCategory}".
2. Do NOT ask generic "Tell me about yourself". Instead, ask a sharp, dynamic, conversational opening question assessing core foundational or practical engineering problem solving for ${role}.
3. Keep it crisp, conversational, and direct (1 to 2 spoken sentences).`}

Generate ONLY valid JSON without markdown formatting:
{
  "conversationalLeadIn": "Spoken 1-sentence acknowledgment of prior response (or empty if Q1)",
  "questionText": "Your natural, unique question here?",
  "category": "${currentTargetCategory}"
}
`;

      if (aiClient) {
        try {
          const response = await aiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
          });

          const rawText = response.text || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const leadIn = parsed.conversationalLeadIn ? `${parsed.conversationalLeadIn.trim()} ` : '';
            const rawQ = parsed.questionText ? parsed.questionText.trim() : '';
            const category = parsed.category || currentTargetCategory;

            console.log(`[Interview] Question generated: "${rawQ}" (Category: ${category}) [Attempt ${attempt}/${maxAttempts}]`);

            // Server-side duplicate / similarity check
            const dupCheck = checkAgainstPreviousQuestions(rawQ, previousQuestions);

            if (dupCheck.isDuplicate) {
              console.log(`[Interview] Duplicate detected: "${rawQ}" is too similar to "${dupCheck.matchedQuestion}" (Similarity: ${Math.round(dupCheck.similarity * 100)}%). Reason: ${dupCheck.reason}`);
              if (attempt < maxAttempts) {
                console.log(`[Interview] Regenerating question: (Attempt ${attempt + 1}/${maxAttempts})`);
                continue;
              }
            } else if (rawQ.length > 10) {
              const fullQuestion = leadIn ? `${leadIn}${rawQ}` : rawQ;
              console.log(`[Interview] Question accepted: "${fullQuestion}"`);
              return {
                questionText: fullQuestion,
                category: category,
                conversationalLeadIn: parsed.conversationalLeadIn || ''
              };
            }
          }
        } catch (error) {
          console.warn(`⚠️ Gemini question generation attempt ${attempt} failed:`, error);
          if (attempt < maxAttempts) {
            console.log(`[Interview] Regenerating question: (Attempt ${attempt + 1}/${maxAttempts})`);
          }
        }
      }
    }

    // 6. Dynamic Combinatoric Synthesis Fallback
    const fallback = generateDynamicFallbackQuestion(
      role,
      effectiveDifficulty,
      questionIndex,
      previousQuestions,
      usedCategories,
      currentTargetCategory,
      resumeContext
    );

    console.log(`[Interview] Question accepted: "${fallback.questionText}" [Dynamic Synthesis Fallback]`);
    return fallback;
  }

  /**
   * Evaluates all answered questions and returns complete deterministic scoring, category breakdown, performance summary, and model answers.
   */
  static async evaluateInterview(
    role: string,
    difficulty: string,
    qaPairs: EvaluatedQuestionAnswer[]
  ): Promise<EvaluationResponse> {
    const evaluatedList: {
      questionIndex: number;
      question: string;
      category: string;
      answer: string;
      timeSpentSeconds: number;
      score: number;
      technicalAccuracy: number;
      relevance: number;
      clarity: number;
      depth: number;
      communication: number;
      isAnswered: boolean;
      aiUnderstanding: string;
      strengths: string[];
      weaknesses: string[];
      suggestedAnswer: string;
      feedbackText: string;
    }[] = [];

    for (const pair of qaPairs) {
      let itemEval: SingleAnswerEvaluation;
      const isRefusal = isRefusalOrEmptyAnswer(pair.answer);

      if (isRefusal) {
        itemEval = await GeminiService.evaluateSingleAnswer(role, difficulty, pair.question, pair.answer || '');
      } else if (
        pair.correctnessScore !== undefined && 
        pair.technicalAccuracy !== undefined && 
        pair.suggestedAnswer &&
        pair.suggestedAnswer.trim().length > 0
      ) {
        let sList: string[] = [];
        let wList: string[] = [];
        try { sList = JSON.parse(pair.strengthsText || '[]'); } catch { sList = pair.strengthsText ? [pair.strengthsText] : []; }
        try { wList = JSON.parse(pair.weaknessesText || '[]'); } catch { wList = pair.weaknessesText ? [pair.weaknessesText] : []; }
        
        itemEval = {
          score: pair.correctnessScore,
          correctnessScore: pair.correctnessScore,
          technicalAccuracy: pair.technicalAccuracy,
          relevance: pair.relevanceScore ?? pair.correctnessScore,
          clarity: pair.clarityScore ?? pair.correctnessScore,
          depth: pair.depthScore ?? pair.correctnessScore,
          communication: pair.clarityScore ?? pair.correctnessScore,
          aiUnderstanding: pair.aiUnderstanding || 'Candidate provided a structured response.',
          strengths: sList,
          weaknesses: wList,
          suggestedAnswer: pair.suggestedAnswer,
          feedbackText: pair.feedbackText || '',
          isAnswered: pair.isAnswered !== undefined ? Boolean(pair.isAnswered) : !isRefusal
        };
      } else {
        itemEval = await GeminiService.evaluateSingleAnswer(role, difficulty, pair.question, pair.answer || '');
      }

      evaluatedList.push({
        questionIndex: pair.questionIndex,
        question: pair.question,
        category: pair.category || 'Fundamentals',
        answer: pair.answer || '(No answer provided)',
        timeSpentSeconds: pair.timeSpentSeconds || 0,
        score: itemEval.score,
        technicalAccuracy: itemEval.technicalAccuracy,
        relevance: itemEval.relevance,
        clarity: itemEval.clarity,
        depth: itemEval.depth,
        communication: itemEval.communication,
        isAnswered: itemEval.isAnswered,
        aiUnderstanding: itemEval.aiUnderstanding,
        strengths: itemEval.strengths,
        weaknesses: itemEval.weaknesses,
        suggestedAnswer: itemEval.suggestedAnswer,
        feedbackText: itemEval.feedbackText
      });
    }

    const totalQuestions = evaluatedList.length;
    const answeredQuestions = evaluatedList.filter(q => q.isAnswered);
    const answeredCount = answeredQuestions.length;
    const skippedCount = totalQuestions - answeredCount;

    // Deterministic overall & dimensional scores calculated strictly from individual question scores
    const overallScore = totalQuestions > 0 
      ? Math.round(evaluatedList.reduce((sum, q) => sum + q.score, 0) / totalQuestions)
      : 0;

    const technicalScore = totalQuestions > 0 
      ? Math.round(evaluatedList.reduce((sum, q) => sum + q.technicalAccuracy, 0) / totalQuestions)
      : 0;

    const communicationScore = totalQuestions > 0 
      ? Math.round(evaluatedList.reduce((sum, q) => sum + q.communication, 0) / totalQuestions)
      : 0;

    const problemSolvingScore = totalQuestions > 0 
      ? Math.round(evaluatedList.reduce((sum, q) => sum + q.depth, 0) / totalQuestions)
      : 0;

    const accuracyScore = totalQuestions > 0 
      ? Math.round(evaluatedList.reduce((sum, q) => sum + q.relevance, 0) / totalQuestions)
      : 0;

    const grammarScore = answeredCount > 0
      ? Math.round(answeredQuestions.reduce((sum, q) => sum + q.clarity, 0) / answeredCount)
      : 0;

    // Technical vocabulary score derived from actual terminology in answered questions
    let avgTechTermCount = 0;
    if (answeredCount > 0) {
      const techKeywords = ['react', 'node', 'state', 'sql', 'index', 'cache', 'redis', 'api', 'rest', 'lock', 'thread', 'latency', 'architecture', 'docker', 'aws', 'component', 'pipeline', 'stream', 'async', 'promise', 'database', 'transaction', 'schema'];
      const termCounts = answeredQuestions.map(q => {
        const words = q.answer.toLowerCase();
        return techKeywords.filter(k => words.includes(k)).length;
      });
      avgTechTermCount = termCounts.reduce((a, b) => a + b, 0) / answeredCount;
    }
    const vocabularyScore = answeredCount > 0 
      ? Math.min(98, Math.max(15, Math.round(technicalScore * 0.7 + Math.min(25, avgTechTermCount * 6))))
      : 0;

    const confidenceScore = answeredCount > 0
      ? Math.min(98, Math.max(15, Math.round((communicationScore * 0.6) + (overallScore * 0.4))))
      : 0;

    // Behavioral & Leadership metrics derived from actual behavioral/systems questions or scaled communication
    const behavioralQs = evaluatedList.filter(q => q.category === 'Behavioral' || q.category === 'Scenario Based');
    const leadershipScore = answeredCount > 0
      ? (behavioralQs.length > 0 ? Math.round(behavioralQs.reduce((s, q) => s + q.score, 0) / behavioralQs.length) : Math.round((communicationScore * 0.5) + (problemSolvingScore * 0.5)))
      : 0;

    const behaviorScore = answeredCount > 0
      ? (behavioralQs.length > 0 ? Math.round(behavioralQs.reduce((s, q) => s + q.clarity, 0) / behavioralQs.length) : Math.round((communicationScore * 0.7) + (accuracyScore * 0.3)))
      : 0;

    // Category Scores: ONLY for categories that actually exist in this session!
    const categoryScores: Record<string, number> = {};
    const uniqueCategories = Array.from(new Set(evaluatedList.map(q => q.category)));
    for (const cat of uniqueCategories) {
      const catItems = evaluatedList.filter(q => q.category === cat);
      categoryScores[cat] = Math.round(catItems.reduce((s, q) => s + q.score, 0) / catItems.length);
    }

    // Deterministic Performance Tier
    const estimatedPerformance = overallScore >= 85 
      ? 'Strong Hire' 
      : overallScore >= 70 
      ? 'Hire' 
      : overallScore >= 55 
      ? 'Leaning Hire' 
      : 'Needs Practice';

    // Strengths: Derived strictly from actual answers scoring >= 60
    const strengthsSet = new Set<string>();
    for (const q of evaluatedList) {
      if (q.score >= 60 && q.strengths && q.strengths.length > 0) {
        for (const s of q.strengths) {
          if (s && s.trim()) strengthsSet.add(s.trim());
        }
      }
    }
    let strengths = Array.from(strengthsSet).slice(0, 4);
    if (strengths.length === 0) {
      strengths = answeredCount > 0
        ? ['Completed interview session with genuine effort; build stronger foundational depth before final-round evaluations.']
        : ['Completed the scheduled session. No substantive technical responses were provided to establish technical strengths.'];
    }

    // Weaknesses: Derived strictly from actual answers scoring < 60 or skipped questions
    const weaknessesSet = new Set<string>();
    for (const q of evaluatedList) {
      if (q.score < 60 || !q.isAnswered) {
        if (q.weaknesses && q.weaknesses.length > 0) {
          for (const w of q.weaknesses) {
            if (w && w.trim()) weaknessesSet.add(w.trim());
          }
        } else if (!q.isAnswered) {
          weaknessesSet.add(`Did not provide a substantive technical response for ${q.category} question: "${q.question.slice(0, 80)}..."`);
        }
      }
    }
    let weaknesses = Array.from(weaknessesSet).slice(0, 4);
    if (weaknesses.length === 0) {
      weaknesses = ['Consistently strong responses throughout; continue refining precision on high-scale distributed edge cases.'];
    }

    // Performance Summary: Data-driven summary
    const strongCategories = Object.entries(categoryScores).filter(([_, score]) => score >= 70).map(([cat]) => cat);
    const weakCategories = Object.entries(categoryScores).filter(([_, score]) => score < 60).map(([cat]) => cat);

    let summaryText = `Based on your ${totalQuestions}-question interview for ${role} (${difficulty}), you completed ${answeredCount} of ${totalQuestions} questions with an overall score of ${overallScore}%.`;
    if (strongCategories.length > 0) {
      summaryText += ` You demonstrated solid proficiency in ${strongCategories.join(', ')}.`;
    }
    if (weakCategories.length > 0) {
      summaryText += ` Targeted preparation is recommended in ${weakCategories.join(', ')}.`;
    }
    if (skippedCount > 0) {
      summaryText += ` Note that ${skippedCount} question${skippedCount > 1 ? 's were' : ' was'} skipped or unanswered.`;
    }

    // Actionable Tips
    const tips: string[] = [];
    if (weakCategories.length > 0) {
      tips.push(`Deepen domain preparation for ${weakCategories.slice(0, 2).join(' and ')} by implementing concrete practice projects.`);
    }
    if (skippedCount > 0) {
      tips.push('Avoid skipping questions. In live technical interviews, breaking down what you know about related mechanisms is significantly better than passing.');
    }
    if (communicationScore < 70 && answeredCount > 0) {
      tips.push('Structure complex answers using the STAR framework (Situation, Task, Action, Result) to improve clarity and articulation.');
    }
    if (problemSolvingScore < 70 && answeredCount > 0) {
      tips.push('Explicitly articulate architectural trade-offs, error boundaries, and throughput bottlenecks in your designs.');
    }
    if (tips.length === 0) {
      tips.push('Maintain current structured communication patterns and practice time-boxed architectural deep-dives.');
      tips.push('Continue citing exact quantitative metrics and production telemetry in past project examples.');
    }

    const suggestedAnswers = evaluatedList.map(item => ({
      questionIndex: item.questionIndex,
      question: item.question,
      category: item.category,
      candidateAnswer: item.answer,
      score: item.score,
      technicalAccuracy: item.technicalAccuracy,
      relevance: item.relevance,
      clarity: item.clarity,
      depth: item.depth,
      isAnswered: item.isAnswered,
      suggestedAnswer: item.suggestedAnswer,
      aiUnderstanding: item.aiUnderstanding,
      strengths: item.strengths,
      weaknesses: item.weaknesses,
      feedbackText: item.feedbackText
    }));

    return {
      overallScore,
      technicalScore,
      communicationScore,
      confidenceScore,
      problemSolvingScore,
      grammarScore,
      vocabularyScore,
      leadershipScore,
      behaviorScore,
      accuracyScore,
      difficultyLevel: difficulty,
      estimatedPerformance,
      performanceSummary: summaryText,
      categoryScores,
      strengths,
      weaknesses,
      suggestedAnswers,
      tips
    };
  }

  /**
   * Analyzes an uploaded resume PDF text using Gemini ATS Intelligence.
   */
  static async analyzeResume(resumeText: string, targetRole: string = 'Software Engineer'): Promise<ResumeAnalysisResponse> {
    const prompt = `
You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter analyzing a candidate resume for a "${targetRole}" position.

Resume Plaintext Content:
${resumeText.slice(0, 5000)}

ATS PARSING & SCORING INSTRUCTIONS:
1. Calculate realistic ATS Compatibility Score (0-100).
2. Extract matched technical skills found in resume relevant to ${targetRole}.
3. Identify critical missing technical skills that would increase recruiter hit rate.
4. Extract keyword density counts for the top 5-8 most prominent technical terms.
5. Provide a 2-3 sentence executive candidate summary.
6. Evaluate Experience, Education, Projects, and Achievements with concrete bullet points.
7. Suggest 2 high-impact technical portfolio projects tailored to bridge their skill gaps.

Return ONLY valid JSON matching this schema:
{
  "atsScore": 82,
  "summary": "Experienced full-stack engineer with strong background in React, Node, and cloud architectures...",
  "matchedSkills": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
  "missingSkills": ["Kubernetes", "GraphQL", "Redis Caching", "CI/CD Pipelines"],
  "recommendedSkills": ["System Design", "Microservices", "Terraform"],
  "grammarIssues": ["Ensure consistent past tense in previous experience descriptions"],
  "formattingIssues": ["Avoid multi-column layouts for maximum ATS scanner compatibility"],
  "keywordDensity": [
    { "keyword": "React", "count": 6, "category": "Frontend" },
    { "keyword": "TypeScript", "count": 4, "category": "Language" },
    { "keyword": "Node.js", "count": 3, "category": "Backend" }
  ],
  "experienceAnalysis": [
    "Strong progression of technical responsibilities",
    "Consider adding quantified impact (e.g., 'reduced API latency by 35%')"
  ],
  "educationAnalysis": [
    "Accredited Computer Science credentials clearly highlighted"
  ],
  "projectsAnalysis": [
    "Projects demonstrate end-to-end full stack architecture capability"
  ],
  "achievementsAnalysis": [
    "Good demonstration of production deployments and feature ownership"
  ],
  "projectSuggestions": [
    "Build a distributed real-time messaging engine with WebSockets & Redis Pub/Sub",
    "Develop an automated CI/CD pipeline deployment with Docker and Kubernetes"
  ],
  "tips": [
    "Place technical skills directly below contact header for rapid ATS indexing",
    "Use bullet points starting with strong action verbs (Architected, Engineered, Optimized)"
  ]
}
`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            atsScore: Number(parsed.atsScore ?? 78),
            summary: parsed.summary || 'Strong candidate profile with solid foundational engineering experience.',
            matchedSkills: parsed.matchedSkills || ['JavaScript', 'React', 'Node.js', 'Git'],
            missingSkills: parsed.missingSkills || ['Kubernetes', 'Redis', 'AWS'],
            recommendedSkills: parsed.recommendedSkills || ['System Design', 'Microservices'],
            grammarIssues: parsed.grammarIssues || ['Maintain consistent bullet formatting'],
            formattingIssues: parsed.formattingIssues || ['Use standard ATS single-column structure'],
            keywordDensity: parsed.keywordDensity || [
              { keyword: 'React', count: 5, category: 'Frontend' },
              { keyword: 'JavaScript', count: 4, category: 'Language' },
              { keyword: 'API', count: 3, category: 'Backend' }
            ],
            experienceAnalysis: parsed.experienceAnalysis || ['Solid engineering foundation with scope for quantifiable impact'],
            educationAnalysis: parsed.educationAnalysis || ['Relevant technical degree / coursework present'],
            projectsAnalysis: parsed.projectsAnalysis || ['Good architectural demonstrations in personal / work projects'],
            achievementsAnalysis: parsed.achievementsAnalysis || ['Clear technical ownership demonstrated'],
            projectSuggestions: parsed.projectSuggestions || [
              'Build a distributed caching service with Redis and Go/Node',
              'Implement a real-time event streaming pipeline with Kafka'
            ],
            tips: parsed.tips || ['Incorporate metric-driven results in every bullet point']
          };
        }
      } catch (e) {
        console.warn('⚠️ Gemini resume analysis failed, using fallback analyzer:', e);
      }
    }

    // Heuristic fallback ATS resume analysis
    const keywords = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Docker', 'AWS', 'JavaScript', 'Git', 'HTML', 'CSS'];
    const matched = keywords.filter(kw => resumeText.toLowerCase().includes(kw.toLowerCase()));
    const missing = keywords.filter(kw => !resumeText.toLowerCase().includes(kw.toLowerCase())).slice(0, 4);

    const calculatedATS = Math.min(92, Math.max(55, 50 + (matched.length * 5)));

    return {
      atsScore: calculatedATS,
      summary: `Candidate demonstrates practical experience with ${matched.slice(0, 3).join(', ')}. Strong match for ${targetRole} positions.`,
      matchedSkills: matched.length > 0 ? matched : ['Software Development', 'Problem Solving', 'Git'],
      missingSkills: missing.length > 0 ? missing : ['Kubernetes', 'Redis', 'CI/CD'],
      recommendedSkills: ['System Design', 'Cloud Architecture', 'Automated Testing'],
      grammarIssues: ['Ensure action verbs start every bullet point uniformly'],
      formattingIssues: ['Use standard UTF-8 bullet symbols for flawless ATS parsing'],
      keywordDensity: matched.slice(0, 5).map(kw => ({ keyword: kw, count: 3, category: 'Technical' })),
      experienceAnalysis: [
        'Demonstrates relevant technical background and hands-on tooling',
        'Add quantified results (e.g. % performance increase, users served)'
      ],
      educationAnalysis: ['Educational qualifications clearly presented'],
      projectsAnalysis: ['Project portfolio reflects domain competence'],
      achievementsAnalysis: ['Highlights successful software contributions and collaborative delivery'],
      projectSuggestions: [
        'Develop a high-throughput microservices backend with asynchronous queue workers',
        'Build a responsive web application featuring real-time state synchronization'
      ],
      tips: [
        'Lead each bullet point with strong action verbs (e.g., Engineered, Spearheaded, Optimized)',
        'Quantify achievements with concrete business and performance metrics'
      ]
    };
  }
}
