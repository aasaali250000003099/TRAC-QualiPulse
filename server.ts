/**
 * QualiPulse Backend Server
 * Express + Vite Full-Stack Server with Gemini API Fallback Ladder & Robust Ingestion
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Production Directive 6: Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static assets from public folder
app.use(express.static(path.resolve('public')));

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Production Directive 6: Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-2.5-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Standard Helper: generateContentWithFallback
 * Catches recoverable errors (503, 429, 404, 500) and attempts next model in ladder
 */
async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string
): Promise<FallbackResult> {
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction,
              temperature: 0.7,
            }
          : undefined,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      const errorMessage = String(err?.message || '');
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        errorMessage.includes('503') ||
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('overloaded');

      console.warn(`[Gemini Fallback] Model ${model} failed (status: ${status}). Recoverable: ${isRecoverable}. Error: ${errorMessage}`);

      if (!isRecoverable) {
        // If not recoverable (e.g. fatal auth issue), still attempt next or throw
        continue;
      }
    }
  }

  throw new Error(
    `All models in the fallback ladder failed. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

// Health Check API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
  });
});

/**
 * Production Directive 6: Defensive Payload Ingestion (Null-Safe Destructuring)
 * POST /api/gemini/analyze
 */
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    // Null-safe destructuring with strict fallback defaults
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const userInput = typeof body.userInput === 'string' ? body.userInput.trim() : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim() : 'general';
    const jobRole = typeof body.jobRole === 'string' ? body.jobRole.trim() : 'Employee';
    const department = typeof body.department === 'string' ? body.department.trim() : 'General';
    const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';
    const companyStandards = Array.isArray(body.companyStandards) ? body.companyStandards : [];
    const conversationHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];

    if (!userInput) {
      return res.status(400).json({ error: 'User input text is required.' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please configure GEMINI_API_KEY in your environment or Secret Manager.',
      });
    }

    // Build standards reference string (sanitized data framing)
    const standardsSummary = companyStandards
      .map(
        (s: any, idx: number) =>
          `[STANDARD ${idx + 1}] Category: ${s.category || 'General'} | Title: ${s.title || 'Untitled'}\nGuidelines: ${s.content || ''}`
      )
      .join('\n\n');

    // Build conversation context
    const historySummary = conversationHistory
      .slice(-6)
      .map((h: any) => `User (${h.topic || 'General'}): ${h.userInput}\nAuditor: ${h.geminiResponse}`)
      .join('\n\n');

    const systemInstruction = `You are TRAC QualiPulse AI, the Senior Institutional Quality Assurance Auditor for Tawi-Tawi Regional Agricultural College (TRAC), a premier state higher education college in the Bangsamoro Autonomous Region in Muslim Mindanao (BARMM), Philippines.
Your objective is to conduct a collaborative, structured, and insightful institutional quality audit interview with TRAC faculty, academic department heads, researchers, administrative personnel, laboratory custodians, and agricultural extension staff.

You will evaluate the auditee's input regarding their work processes, academic hurdles, research bottlenecks, complaints, or improvement suggestions.
You must ground your evaluation in Tawi-Tawi Regional Agricultural College's Quality Standards & SOPs (including CHED mandates, AACCUP accreditation areas, CSC civil service rules, and agricultural research/extension benchmarks), while maintaining a supportive, solutions-oriented tone.

Output must be well-structured JSON with the following keys:
{
  "conversationalResponse": "Comprehensive multi-paragraph response addressing the TRAC faculty/staff member directly, reflecting on their thoughts, acknowledging academic or operational difficulties with empathy, and offering deep analytical commentary.",
  "insightsSummary": "Concise executive synthesis of the key points, underlying operational or institutional root causes, and systemic patterns at TRAC.",
  "brainstormingIdeas": "3-5 high-impact, innovative brainstorming suggestions or alternative process models to resolve the bottlenecks within the college ecosystem.",
  "actionableSuggestions": "Step-by-step immediate and long-term actionable recommendations for both the employee and TRAC college administration.",
  "qualityAssessment": "A qualitative assessment rating (e.g. 'AACCUP Compliance Rating: Strong Alignment / Minor Documentation Gap', or 'Operational Alert: Critical Laboratory & Farm Resource Bottleneck') with 2-3 sentences explaining the rating relative to college and accreditation standards."
}

Do NOT wrap in markdown backticks or formatting other than raw valid JSON.`;

    const prompt = `INSTITUTION: Tawi-Tawi Regional Agricultural College (TRAC)
AUDITEE PROFILE:
- Role / Designation: ${jobRole}
- Department / College / Office: ${department}
- Specific Academic / Operational Functions: ${jobDescription || 'Not specified'}

AUDIT TOPIC AREA: ${topic}

OFFICIAL TRAC QUALITY STANDARDS & INSTITUTIONAL GUIDELINES:
${standardsSummary ? standardsSummary : 'No custom TRAC standards uploaded yet. Ground evaluation in CHED CMOs, AACCUP Accreditation Criteria (Areas I-X), and SUC Quality Management Standards.'}

PREVIOUS CONVERSATION CONTEXT:
${historySummary ? historySummary : 'Starting new institutional audit dialogue thread.'}

CURRENT AUDITEE INPUT:
"${userInput}"

Provide your comprehensive quality audit review, brainstorming ideas, and reflections now in the requested JSON structure.`;

    const { text, modelUsed } = await generateContentWithFallback(prompt, systemInstruction);

    // Clean JSON response
    let parsed: any;
    try {
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if model returned unstructured text
      parsed = {
        conversationalResponse: text,
        insightsSummary: 'Synthesized insights from user audit submission.',
        brainstormingIdeas: 'Explore process automation, cross-team syncs, and SLA documentation.',
        actionableSuggestions: 'Document current pain points and review with department lead.',
        qualityAssessment: 'Audited & Recorded: General Process Review',
      };
    }

    return res.json({
      success: true,
      modelUsed,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/analyze:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to process quality audit analysis.',
    });
  }
});

/**
 * POST /api/gemini/summarize-audit
 * For Super Admin to generate aggregate organizational audit insights
 */
app.post('/api/gemini/summarize-audit', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const submissions = Array.isArray(body.submissions) ? body.submissions : [];
    const standards = Array.isArray(body.standards) ? body.standards : [];

    if (submissions.length === 0) {
      return res.status(400).json({ error: 'No audit submissions provided.' });
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
      });
    }

    const submissionsData = submissions
      .slice(0, 30)
      .map(
        (s: any, idx: number) =>
          `[SUBMISSION ${idx + 1}] Role: ${s.userRole || 'Staff'} | Dept: ${s.userDept || 'General'} | Topic: ${s.topic || 'General'}\nInput: ${s.userInput}\nAssessment: ${s.qualityAssessment || 'N/A'}`
      )
      .join('\n---\n');

    const prompt = `You are QualiPulse Chief Institutional Quality Assurance Auditor for Tawi-Tawi Regional Agricultural College (TRAC).
Analyze the following workforce, faculty, and administrative audit entries collected across academic departments, research centers, and support offices at TRAC:

AUDIT ENTRIES:
${submissionsData}

Generate an Institutional Executive Quality Audit & Accreditation Intelligence Report for TRAC College Leadership, including:
1. Executive Summary & Institutional Health (Accreditation & SUC Standing)
2. Top Systemic Pain Points & Cross-Departmental Bottlenecks (Curriculum, Research, Farm/Lab Resources, Student Services)
3. Faculty & Staff Sentiment & Operational Roadblocks
4. High-Value Quality Improvement & AACCUP Preparation Recommendations
5. Strategic Action Matrix for College Deans, Research Directors, and the College President

Return format: Return clear, beautifully formatted Markdown with headers, bullet points, and key institutional metrics.`;

    const { text, modelUsed } = await generateContentWithFallback(prompt);

    return res.json({
      success: true,
      modelUsed,
      summary: text,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/summarize-audit:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate audit intelligence report.',
    });
  }
});

// Full-Stack Server Configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist static files
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QualiPulse Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
