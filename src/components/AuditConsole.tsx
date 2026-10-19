import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, sanitizePayload } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { AuditInteraction, AuditTopic, CompanyStandard, GeminiAnalysisResponse } from '../types';
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileCheck,
  Building,
  Briefcase,
  HelpCircle,
  MessageSquare,
  Flame,
  Shield,
} from 'lucide-react';

interface AuditConsoleProps {
  standards: CompanyStandard[];
  recentInteractions: AuditInteraction[];
  onInteractionSaved: (interaction: AuditInteraction) => void;
  onNavigateToProfile: () => void;
  onOpenStandards: () => void;
}

export const AuditConsole: React.FC<AuditConsoleProps> = ({
  standards,
  recentInteractions,
  onInteractionSaved,
  onNavigateToProfile,
  onOpenStandards,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [topic, setTopic] = useState<AuditTopic>('work_processes');
  const [userInput, setUserInput] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [lastSavedInteraction, setLastSavedInteraction] = useState<AuditInteraction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetrySave, setCanRetrySave] = useState(false);
  const [pendingInteraction, setPendingInteraction] = useState<AuditInteraction | null>(null);

  const topicsList: { id: AuditTopic; label: string; icon: any; placeholder: string; desc: string; template: string }[] = [
    {
      id: 'work_processes',
      label: 'Academic & Work Processes',
      icon: RefreshCw,
      desc: 'How do you execute instruction, research, extension, or administrative workflows at TRAC?',
      placeholder: 'Describe your classroom teaching protocols, research field methods, experimental farm routines, or office processing workflows...',
      template: 'At the Institute of Agriculture, our semestral workflow requires faculty to submit syllabus updates aligned with CHED OBE standards by Week 2. However, the curriculum review committee meets irregularly, causing delayed syllabus endorsement to students...',
    },
    {
      id: 'challenges',
      label: 'Difficulties & Bottlenecks',
      icon: AlertTriangle,
      desc: 'What obstacles or resource limitations impede teaching quality, research, or student services?',
      placeholder: 'Detail delays in laboratory reagents, farm equipment maintenance, unreliable internet, or accreditation document backlogs...',
      template: 'We face severe delays in procuring laboratory reagents and soil test kits for agricultural science theses. It takes 2 months for purchase requisitions to clear, forcing students to delay their field experiments and crop harvesting cycles...',
    },
    {
      id: 'complaints',
      label: 'Complaints & Roadblocks',
      icon: Flame,
      desc: 'Highlight procedural bottlenecks, unaddressed maintenance issues, or institutional friction.',
      placeholder: 'Voice concerns regarding heavy faculty teaching loads, lack of research release time, or communication gaps across college institutes...',
      template: 'Faculty teaching loads are exceeding 24 contact hours without adequate research release time, compromising our ability to publish in accredited journals for SUC leveling. Furthermore, water supply interruptions at the aquaculture research station remain unresolved...',
    },
    {
      id: 'suggestions',
      label: 'Suggestions & Innovations',
      icon: Lightbulb,
      desc: 'Propose innovative improvements for TRAC academic programs, farm facilities, or student services.',
      placeholder: 'Share proposals for digital enrollment portals, community seaweed farming extension partnerships, or faculty development programs...',
      template: 'I propose establishing a dedicated TRAC Central Science & Aquaculture Testing Facility shared across departments. Additionally, digitizing the student registration and grade submission system will cut enrollment queues by 70% and streamline AACCUP Area X audits...',
    },
    {
      id: 'general',
      label: 'Open Institutional Reflection',
      icon: MessageSquare,
      desc: 'General quality assurance self-audit reflections and observations on college growth.',
      placeholder: 'Reflect freely on campus climate, community extension impact in Tawi-Tawi, or upcoming accreditation preparation...',
      template: 'Reflecting on our recent AACCUP Level II survey visit for the BS Agriculture program, our community extension engagement in Bongao is strong, but our physical library collection and digital journal subscriptions require urgent modernization...',
    },
  ];

  const currentTopicMeta = topicsList.find((t) => t.id === topic) || topicsList[0];

  const handleApplyTemplate = () => {
    setUserInput(currentTopicMeta.template);
    if (!sessionTitle) {
      setSessionTitle(`${currentTopicMeta.label} Audit Review`);
    }
  };

  const persistInteraction = async (interaction: AuditInteraction): Promise<boolean> => {
    if (!currentUser) return false;
    setSaveStatus('saving');
    setCanRetrySave(false);

    try {
      const sanitized = sanitizePayload(interaction);
      const docRef = doc(db, 'users', currentUser.uid, 'interactions', interaction.id);

      await setDoc(docRef, sanitized);

      setSaveStatus('saved');
      setLastSavedInteraction(interaction);
      onInteractionSaved(interaction);
      setPendingInteraction(null);
      return true;
    } catch (err: unknown) {
      console.error('Firestore save failed:', err);
      setSaveStatus('failed');
      setCanRetrySave(true);
      setPendingInteraction(interaction);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/interactions/${interaction.id}`);
      } catch (e: any) {
        setErrorMessage(`Persistence Error: ${e.message}`);
      }
      return false;
    }
  };

  const handleRetrySave = async () => {
    if (!pendingInteraction) return;
    setErrorMessage(null);
    const success = await persistInteraction(pendingInteraction);
    if (success) {
      setUserInput('');
      setSessionTitle('');
    }
  };

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    if (!currentUser) {
      setErrorMessage('You must be signed in to submit an audit entry.');
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userInput.trim(),
          topic,
          jobRole: userProfile?.jobRole || 'Faculty / Staff Member',
          department: userProfile?.department || 'Academic Department',
          jobDescription: userProfile?.jobDescription || '',
          companyStandards: standards,
          conversationHistory: recentInteractions.slice(-4),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const resData = await response.json();
      const analysis: GeminiAnalysisResponse = resData.data;
      setAnalysisResult(analysis);
      setModelUsed(resData.modelUsed || 'Gemini 3.6 Flash');

      const interactionId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = sessionTitle.trim() || `${currentTopicMeta.label} - ${new Date().toLocaleDateString()}`;

      const newInteraction: AuditInteraction = {
        id: interactionId,
        userId: currentUser.uid,
        sessionTitle: title,
        topic,
        userInput: userInput.trim(),
        geminiResponse: analysis.conversationalResponse,
        insightsSummary: analysis.insightsSummary,
        brainstormingIdeas: analysis.brainstormingIdeas,
        actionableSuggestions: analysis.actionableSuggestions,
        qualityAssessment: analysis.qualityAssessment,
        userRole: userProfile?.jobRole || 'Faculty',
        userDept: userProfile?.department || 'Department',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await persistInteraction(newInteraction);

      if (saved) {
        setUserInput('');
        setSessionTitle('');
      }
    } catch (err: any) {
      console.error('Audit processing failed:', err);
      setErrorMessage(err?.message || 'Failed to process quality audit.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Auditee Banner in Green & White Theme with Official Logo */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 rounded-2xl border border-emerald-700/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg text-white">
        <div className="flex items-center space-x-3.5">
          <img
            src="/trac-logo-128.png"
            alt="TRAC Official Seal"
            className="w-12 h-12 object-contain rounded-full bg-white p-0.5 border-2 border-emerald-300 ring-2 ring-emerald-400/30 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">TRAC Quality Audit Intelligence Console</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-emerald-100 border border-white/30 rounded">
                Faculty-Isolated
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-100/90 mt-1 font-medium">
              <span className="flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-emerald-200" />
                <span className="text-white font-semibold">{userProfile?.jobRole || 'Role not configured'}</span>
              </span>
              <span className="text-emerald-300">&bull;</span>
              <span className="flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-emerald-200" />
                <span className="text-white font-semibold">{userProfile?.department || 'Department not configured'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {(!userProfile?.jobRole || !userProfile?.jobDescription) && (
            <button
              onClick={onNavigateToProfile}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 text-xs font-bold flex items-center space-x-1.5 shadow transition-all hover:bg-amber-300"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Complete Profile Context</span>
            </button>
          )}

          <button
            onClick={onOpenStandards}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-200" />
            <span>Active Standards ({standards.length})</span>
          </button>
        </div>
      </div>

      {/* Persistence Error Banner with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">Attention Required</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          {canRetrySave && (
            <button
              onClick={handleRetrySave}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-colors shrink-0 ml-3"
            >
              Retry Save
            </button>
          )}
        </div>
      )}

      {/* Successful Transaction Confirmation */}
      {saveStatus === 'saved' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Audit exchange successfully evaluated by Gemini 3.6 Flash and persisted to your isolated TRAC ledger!</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono font-medium">
            ID: {lastSavedInteraction?.id}
          </span>
        </div>
      )}

      {/* Main Audit Input Console Box */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-md space-y-5">
        {/* Topic Selector Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
            Step 1: Select Audit Focus Area
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {topicsList.map((t) => {
              const Icon = t.icon;
              const isSelected = topic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                    {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                  </div>
                  <span className="text-xs font-bold">{t.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentTopicMeta.desc}</span>
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmitAudit} className="space-y-4 pt-2">
          {/* Optional Session Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Session Title / Audit Note (Optional)
              </label>
              <button
                type="button"
                onClick={handleApplyTemplate}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 underline font-semibold cursor-pointer"
              >
                Insert sample TRAC scenario
              </button>
            </div>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              maxLength={200}
              placeholder={`e.g. ${currentTopicMeta.label} - Q3 Process Review`}
              className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
            />
          </div>

          {/* User Input Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Your Academic Statement, Roadblock, or Proposal *
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {userInput.length} / 10,000 characters
              </span>
            </div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              maxLength={10000}
              required
              rows={5}
              placeholder={currentTopicMeta.placeholder}
              className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl p-4 text-xs text-slate-900 placeholder-slate-400 transition-colors leading-relaxed shadow-sm"
            />
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strictly isolated to your faculty UID in Firestore. No cross-user exposure.</span>
            </div>

            <button
              type="submit"
              disabled={analyzing || !userInput.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Auditing with Gemini 3.6 Flash...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit for Audit &amp; Insights</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Gemini Audit Result Cards */}
      {analysisResult && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                TRAC Quality Audit Evaluation
              </h3>
            </div>
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Engine: {modelUsed || 'Gemini 3.6 Flash'}
            </span>
          </div>

          {/* Quality Assessment Grade Card */}
          {analysisResult.qualityAssessment && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-300 shadow-sm">
              <div className="flex items-center space-x-2 mb-1">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  AACCUP Compliance Assessment &amp; Quality Index
                </span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                {analysisResult.qualityAssessment}
              </p>
            </div>
          )}

          {/* Detailed Analytical Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Root Causes */}
            <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-sm">
              <div className="flex items-center space-x-2 text-teal-700 mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Root Causes &amp; Systemic Insights
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {analysisResult.insightsSummary}
              </p>
            </div>

            {/* Brainstorming Ideas */}
            <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-700 mb-2.5">
                <Lightbulb className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Brainstorming &amp; High-Leverage Ideas
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {analysisResult.brainstormingIdeas}
              </p>
            </div>
          </div>

          {/* Actionable Next Steps */}
          <div className="p-5 rounded-2xl bg-white border border-green-200 shadow-sm">
            <div className="flex items-center space-x-2 text-green-700 mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Actionable Remediation &amp; Next Steps
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
              {analysisResult.actionableSuggestions}
            </p>
          </div>

          {/* Conversational Auditor Commentary */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-sm">
            <div className="flex items-center space-x-2 text-emerald-800 mb-2.5">
              <MessageSquare className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Full Auditor Commentary &amp; Institutional Reflection
              </h4>
            </div>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line space-y-2 font-normal">
              {analysisResult.conversationalResponse}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
