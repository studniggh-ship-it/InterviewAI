import 'dotenv/config';
import { GeminiService, calculateQuestionSimilarity } from './src/services/gemini.service';

async function testDynamicQuestionEngine() {
  console.log('🧪 Starting 20-Question Dynamic Generation & Anti-Repetition Test Suite...\n');

  const role = 'Full Stack Developer';
  const difficulty = 'Senior';
  const resumeContext = {
    summary: 'Senior Software Engineer with 6 years experience building distributed web apps with React, Node.js, TypeScript, PostgreSQL, and Redis.',
    matchedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    projects: [
      'Real-time collaborative whiteboard with WebSockets and CRDTs',
      'High-throughput financial ledger API with PostgreSQL and Redis caching'
    ],
    experience: ['Senior Engineer at FinTech Corp', 'Full Stack Developer at SaaS Inc']
  };

  const generatedQuestions: string[] = [];
  const simulatedAnswers: string[] = [
    'I architected the state management with Zustand and synchronized distributed cursors over WebSockets with optimistic UI updates.',
    'For database bottlenecks, we created composite B-tree indexes, analyzed query execution plans with EXPLAIN ANALYZE, and introduced Redis caching.',
    'I handled transactional consistency using database transactions with row-level locking to avoid race conditions.',
    'We implemented continuous integration pipelines using GitHub Actions, running Jest unit tests and Docker image scans before deploying to AWS ECS.',
    'I resolved a conflict with a teammate regarding GraphQL versus REST by creating a benchmark prototype demonstrating payload reduction.'
  ];

  let collisionCount = 0;
  const categoriesFound = new Set<string>();

  for (let i = 0; i < 20; i++) {
    const prevQSlice = [...generatedQuestions];
    const prevASlice = simulatedAnswers.slice(0, i);
    const simulatedScore = 50 + ((i * 7) % 45); // Varying simulated scores (50 to 92)

    const startTime = Date.now();
    const result = await GeminiService.generateQuestion(
      role,
      difficulty,
      i,
      prevQSlice,
      prevASlice,
      resumeContext,
      simulatedScore
    );
    const elapsed = Date.now() - startTime;

    console.log(`[Q${i + 1}] (${result.category}) [${elapsed}ms]:`);
    console.log(`    "${result.questionText}"`);

    categoriesFound.add(result.category);

    // Check similarity against all previously generated questions
    for (let j = 0; j < generatedQuestions.length; j++) {
      const sim = calculateQuestionSimilarity(result.questionText, generatedQuestions[j]);
      if (sim > 0.70) {
        console.error(`❌ COLLISION DETECTED between Q${i + 1} and Q${j + 1} (Similarity: ${(sim * 100).toFixed(1)}%)`);
        collisionCount++;
      }
    }

    generatedQuestions.push(result.questionText);
  }

  console.log('\n==================================================');
  console.log(`📊 TEST RESULTS:`);
  console.log(`- Total Questions Generated: ${generatedQuestions.length}`);
  console.log(`- Unique Categories Explored: ${categoriesFound.size}`);
  console.log(`- High Similarity Collisions (>70%): ${collisionCount}`);
  console.log('==================================================\n');

  if (collisionCount === 0 && generatedQuestions.length === 20) {
    console.log('✅ TEST PASSED: All 20 consecutive questions are unique with zero repetitive collisions!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Collisions or missing questions detected.');
    process.exit(1);
  }
}

testDynamicQuestionEngine().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
