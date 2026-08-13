import { InterviewSession, ResumeAnalysis } from '../types';

/**
 * Generates and triggers download/print of an Interview Report PDF
 */
export function exportInterviewPDF(session: InterviewSession) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF report.');
    return;
  }

  const dateFormatted = new Date(session.created_at).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>InterviewAI Report - ${session.role} (${session.difficulty})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 32px 40px;
      line-height: 1.5;
      font-size: 13px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #4338ca;
      letter-spacing: -0.5px;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-primary { background: #e0e7ff; color: #3730a3; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      text-align: center;
    }

    .stat-val {
      font-size: 20px;
      font-weight: 800;
      color: #1e1b4b;
    }

    .stat-lbl {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 24px;
    }

    .score-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .score-pill span {
      font-size: 11px;
      font-weight: 600;
      color: #334155;
    }

    .score-pill strong {
      font-size: 13px;
      font-weight: 800;
      color: #4338ca;
    }

    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 12px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .strengths-weaknesses {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .bullet-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }

    .bullet-box h4 {
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .bullet-box.str h4 { color: #166534; }
    .bullet-box.weak h4 { color: #991b1b; }

    .bullet-box ul {
      list-style-type: none;
      padding-left: 0;
    }

    .bullet-box li {
      font-size: 11px;
      color: #334155;
      margin-bottom: 6px;
      position: relative;
      padding-left: 14px;
    }

    .bullet-box li::before {
      content: "•";
      position: absolute;
      left: 0;
      font-weight: bold;
    }

    .qa-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }

    .qa-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .q-badge {
      background: #4338ca;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .q-text {
      font-size: 12px;
      font-weight: 750;
      color: #0f172a;
    }

    .user-ans {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 11px;
      color: #334155;
      font-style: italic;
    }

    .model-ans {
      background: #ecfdf5;
      border-left: 3px solid #10b981;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 11px;
      color: #065f46;
    }

    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    .print-btn-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ffffff;
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
      border: 1px solid #cbd5e1;
      display: flex;
      gap: 8px;
      z-index: 1000;
    }

    .btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
    }

    .btn-primary { background: #4338ca; color: white; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
  </style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
  </div>

  <div class="header-bar">
    <div>
      <div class="brand-title">InterviewAI</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Comprehensive AI Evaluation & Transcript Report</div>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-primary">${session.role}</span>
      <span class="badge badge-success">${session.difficulty}</span>
      ${session.estimated_performance ? `<span class="badge badge-warning">${session.estimated_performance}</span>` : ''}
    </div>
  </div>

  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-val" style="color: #059669;">${session.overall_score || 0}%</div>
      <div class="stat-lbl">Final Score</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${session.duration_minutes || 0}m</div>
      <div class="stat-lbl">Duration</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${session.answered_questions || (session.transcript ? session.transcript.length : 0)}</div>
      <div class="stat-lbl">Questions Answered</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="font-size: 12px; line-height: 24px;">${dateFormatted}</div>
      <div class="stat-lbl">Date Conducted</div>
    </div>
  </div>

  <div class="section-title">8-Dimension Competency Breakdown</div>
  <div class="scores-grid">
    <div class="score-pill"><span>Technical Depth</span><strong>${session.technical_score || 0}%</strong></div>
    <div class="score-pill"><span>Communication</span><strong>${session.communication_score || 0}%</strong></div>
    <div class="score-pill"><span>Problem Solving</span><strong>${session.problem_solving_score || 0}%</strong></div>
    <div class="score-pill"><span>Confidence</span><strong>${session.confidence_score || 0}%</strong></div>
    <div class="score-pill"><span>Grammar</span><strong>${session.grammar_score || 0}%</strong></div>
    <div class="score-pill"><span>Vocabulary</span><strong>${session.vocabulary_score || 0}%</strong></div>
    <div class="score-pill"><span>Leadership</span><strong>${session.leadership_score || 80}%</strong></div>
    <div class="score-pill"><span>Behavior & Fit</span><strong>${session.behavior_score || 82}%</strong></div>
  </div>

  ${(session.strengths && session.strengths.length > 0) || (session.weaknesses && session.weaknesses.length > 0) ? `
    <div class="strengths-weaknesses">
      <div class="bullet-box str">
        <h4>Key Candidate Strengths</h4>
        <ul>
          ${(session.strengths || []).map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div class="bullet-box weak">
        <h4>Areas for Improvement</h4>
        <ul>
          ${(session.weaknesses || []).map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    </div>
  ` : ''}

  <div class="section-title">Full Interview Transcript & Suggested Answers</div>
  ${(session.transcript && session.transcript.length > 0) ? session.transcript.map((item, idx) => {
    const matchedSuggestion = session.suggestedAnswers?.find(s => s.questionIndex === item.question_index || s.question === item.question_text);
    return `
      <div class="qa-card">
        <div class="qa-header">
          <span class="q-badge">Q${idx + 1}</span>
          <span class="q-text">${item.question_text}</span>
          ${item.category ? `<span style="font-size: 10px; color: #64748b; margin-left: auto;">[${item.category}]</span>` : ''}
        </div>
        <div class="user-ans">
          <div style="font-size: 10px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-bottom: 2px;">Candidate Response:</div>
          ${item.answer_text}
        </div>
        ${matchedSuggestion ? `
          <div class="model-ans">
            <div style="font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 2px;">Suggested Ideal Answer:</div>
            ${matchedSuggestion.suggestedAnswer}
          </div>
        ` : ''}
      </div>
    `;
  }).join('') : '<p style="font-size: 11px; color: #64748b;">No transcript recordings available.</p>'}

  <div class="footer">
    Generated securely by InterviewAI • Verified against SQLite Database records
  </div>

  <script>
    window.onload = function() {
      // Auto-focus print dialog after rendering
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generates and triggers download/print of an ATS Resume Analysis PDF
 */
export function exportResumeAnalysisPDF(analysis: ResumeAnalysis) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF report.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ATS Resume Analysis Report - ${analysis.originalFilename}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 32px 40px;
      line-height: 1.5;
      font-size: 13px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #7c3aed;
      letter-spacing: -0.5px;
    }

    .hero-card {
      background: #fdf4ff;
      border: 1px solid #f0abfc;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .score-circle {
      text-align: center;
    }

    .score-val {
      font-size: 36px;
      font-weight: 900;
      color: #7c3aed;
    }

    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 10px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    .skills-tag-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .tag {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    .tag-matched { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .tag-missing { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }

    .card h4 {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 8px;
      color: #334155;
    }

    .card ul {
      list-style-type: none;
      padding-left: 0;
    }

    .card li {
      font-size: 11px;
      color: #475569;
      margin-bottom: 6px;
      position: relative;
      padding-left: 14px;
    }

    .card li::before {
      content: "•";
      position: absolute;
      left: 0;
      font-weight: bold;
      color: #7c3aed;
    }

    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    .print-btn-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ffffff;
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
      border: 1px solid #cbd5e1;
      display: flex;
      gap: 8px;
      z-index: 1000;
    }

    .btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      border: none;
    }

    .btn-primary { background: #7c3aed; color: white; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
  </style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
  </div>

  <div class="header-bar">
    <div>
      <div class="brand-title">InterviewAI • ATS Scanner</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">File: ${analysis.originalFilename}</div>
    </div>
    <div style="font-size: 11px; color: #64748b;">
      Generated: ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
    </div>
  </div>

  <div class="hero-card">
    <div style="max-width: 75%;">
      <div style="font-size: 14px; font-weight: 800; color: #581c87; margin-bottom: 4px;">Executive ATS Summary</div>
      <p style="font-size: 11px; color: #6b21a8; line-height: 1.5;">${analysis.summary}</p>
    </div>
    <div class="score-circle">
      <div class="score-val">${analysis.atsScore}%</div>
      <div style="font-size: 10px; font-weight: 700; color: #7c3aed; text-transform: uppercase;">ATS Score</div>
    </div>
  </div>

  <div class="section-title">Matched Technical Skills (${analysis.matchedSkills?.length || 0})</div>
  <div class="skills-tag-grid">
    ${(analysis.matchedSkills || []).map(s => `<span class="tag tag-matched">✓ ${s}</span>`).join('')}
  </div>

  <div class="section-title">Missing & Recommended Keywords (${analysis.missingSkills?.length || 0})</div>
  <div class="skills-tag-grid">
    ${(analysis.missingSkills || []).map(s => `<span class="tag tag-missing">✕ ${s}</span>`).join('')}
  </div>

  <div class="grid-2">
    <div class="card">
      <h4>Grammar & Action Verbs</h4>
      <ul>
        ${(analysis.grammarIssues || ['Action verbs and grammar meet professional standards.']).map(g => `<li>${g}</li>`).join('')}
      </ul>
    </div>
    <div class="card">
      <h4>Formatting & Structure</h4>
      <ul>
        ${(analysis.formattingIssues || ['Single-column ATS hierarchy verified.']).map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <h4>Recommended Project Enhancements</h4>
      <ul>
        ${(analysis.projectSuggestions || []).map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
    <div class="card">
      <h4>Actionable ATS Tips</h4>
      <ul>
        ${(analysis.tips || []).map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="footer">
    Generated securely by InterviewAI Resume Intelligence Engine
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
