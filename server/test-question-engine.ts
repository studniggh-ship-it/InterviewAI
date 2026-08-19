import 'dotenv/config';
import {
  GeminiService,
  normalizeQuestionText,
  evaluateQuestionSimilarity,
  calculateQuestionSimilarity,
  STANDARD_QUESTION_CATEGORIES
} from './src/services/gemini.service';

async function runComprehensiveQuestionEngineTests() {
  console.log('🧪 ================================================================');
  console.log('🧪 INTERVIEWAI QUESTION DIVERSITY & ANTI-REPETITION TEST SUITE');
  console.log('🧪 ================================================================\n');

  // -------------------------------------------------------------
  // TEST PART 1: Unit Tests for Normalization & Similarity Engine
  // -------------------------------------------------------------
  console.log('🔹 PART 1: Testing Normalization & Duplicate Detection Algorithms...');

  // Test 1.1: Exact Duplicate (with punctuation/casing variations)
  const q1a = 'How do you handle database indexing for high-traffic queries?';
  const q1b = 'how do you handle database indexing for high traffic queries';
  const eval1 = evaluateQuestionSimilarity(q1a, q1b);
  console.log(`  [1.1] Exact match test: isDuplicate=${eval1.isDuplicate}, reason="${eval1.reason}"`);
  if (!eval1.isDuplicate) throw new Error('Failed to detect exact match');

  // Test 1.2: Reworded Question / Same Concept
  const q2a = 'Explain how React reconciliation works with the Virtual DOM.';
  const q2b = 'Can you describe the Virtual DOM reconciliation process in React?';
  const eval2 = evaluateQuestionSimilarity(q2a, q2b);
  console.log(`  [1.2] Reworded concept test: isDuplicate=${eval2.isDuplicate}, similarity=${Math.round(eval2.similarity * 100)}%, reason="${eval2.reason}"`);
  if (!eval2.isDuplicate) throw new Error('Failed to detect reworded concept duplicate');

  // Test 1.3: Completely Distinct Questions
  const q3a = 'How do you configure Redis cache eviction and avoid cache stampedes?';
  const q3b = 'Tell me about a time you resolved a major disagreement with a product manager.';
  const eval3 = evaluateQuestionSimilarity(q3a, q3b);
  console.log(`  [1.3] Distinct questions test: isDuplicate=${eval3.isDuplicate}, similarity=${Math.round(eval3.similarity * 100)}%`);
  if (eval3.isDuplicate) throw new Error('False positive on distinct questions');

  // Test 1.4: Follow-up that builds on answer vs direct repeat
  const q4a = 'How do you structure database transactions in PostgreSQL?';
  const q4b = 'Building on your PostgreSQL transactions, how do you handle deadlocks and lock contention under high concurrency?';
  const eval4 = evaluateQuestionSimilarity(q4b, q4a);
  console.log(`  [1.4] Progressive follow-up test: isDuplicate=${eval4.isDuplicate}, similarity=${Math.round(eval4.similarity * 100)}%`);
  if (eval4.isDuplicate) throw new Error('Follow-up building on concept was incorrectly flagged as duplicate');

  console.log('✅ PART 1 PASSED: Normalization & Similarity unit tests passed perfectly.\n');

  // -------------------------------------------------------------
  // TEST PART 2: 10+ Question Simulated Interview Session
  // -------------------------------------------------------------
  console.log('🔹 PART 2: Generating 12 Consecutive Questions in a Live Interview Session...');

  const role = 'Full Stack Developer';
  const difficulty = 'Senior';
  const resumeContext = {
    summary: 'Senior Full Stack Engineer with 5+ years experience building distributed web systems with React, TypeScript, Node.js, PostgreSQL, and AWS.',
    matchedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    projects: [
      'Real-time collaborative document editor with WebSockets and CRDTs',
      'High-throughput payment processing engine with PostgreSQL and Redis'
    ],
    experience: ['Senior Engineer at FinTech Global', 'Full Stack Developer at CloudSaaS']
  };

  const generatedQuestions: string[] = [];
  const usedCategories: string[] = [];
  const simulatedAnswers: string[] = [
    'I architected the frontend state using Redux Toolkit and optimized re-renders using useMemo and custom selectors.',
    'For database optimization, we added compound B-tree indexes, monitored pg_stat_activity, and introduced Redis for read caching.',
    'We implemented distributed locking using Redis Redlock and handled payment idempotency with database transaction keys.',
    'I diagnosed a memory leak using Node.js heap snapshots in Chrome DevTools and found unbounded event listeners.',
    'We designed a CQRS architecture with Kafka event streaming and read-replica databases.',
    'I facilitated a compromise between two senior engineers by benchmarking gRPC vs REST payloads with real network metrics.',
    'During a 10x traffic spike, we scaled our ECS tasks horizontally and enabled CloudFront edge caching with stale-while-revalidate.',
    'We used Raft consensus in our distributed leader election to prevent split-brain scenarios.'
  ];

  let collisionCount = 0;
  const categoriesSeen = new Set<string>();

  for (let i = 0; i < 12; i++) {
    const prevQSlice = [...generatedQuestions];
    const prevCatSlice = [...usedCategories];
    const prevASlice = simulatedAnswers.slice(0, i);
    const simulatedScore = 40 + ((i * 13) % 55); // Varying scores (40 to 95)

    const startTime = Date.now();
    const result = await GeminiService.generateQuestion(
      role,
      difficulty,
      i,
      prevQSlice,
      prevASlice,
      resumeContext,
      simulatedScore,
      prevCatSlice
    );
    const elapsed = Date.now() - startTime;

    console.log(`  [Q${i + 1}] (${result.category}) [${elapsed}ms]:`);
    console.log(`      "${result.questionText}"`);

    categoriesSeen.add(result.category);
    usedCategories.push(result.category);

    // Cross-check newly generated question against EVERY previously generated question
    for (let j = 0; j < generatedQuestions.length; j++) {
      const simEval = evaluateQuestionSimilarity(result.questionText, generatedQuestions[j]);
      if (simEval.isDuplicate) {
        console.error(`  ❌ COLLISION: Q${i + 1} is duplicate of Q${j + 1} (Score: ${Math.round(simEval.similarity * 100)}%, Reason: ${simEval.reason})`);
        collisionCount++;
      }
    }

    generatedQuestions.push(result.questionText);
  }

  console.log('\n==================================================');
  console.log(`📊 TEST SUITE SUMMARY:`);
  console.log(`- Total Questions Generated: ${generatedQuestions.length}`);
  console.log(`- Unique Categories Explored: ${categoriesSeen.size} / ${STANDARD_QUESTION_CATEGORIES.length}`);
  console.log(`- High Similarity / Duplicate Collisions: ${collisionCount}`);
  console.log('==================================================\n');

  if (collisionCount === 0 && generatedQuestions.length === 12 && categoriesSeen.size >= 6) {
    console.log('✅ ALL TESTS PASSED: 12 consecutive questions generated with 0 duplicates and diverse category rotation!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Collisions detected or insufficient category diversity.');
    process.exit(1);
  }
}

runComprehensiveQuestionEngineTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
