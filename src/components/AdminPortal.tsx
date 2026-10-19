import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CompanyStandard, AuditInteraction } from '../types';
import {
  collectionGroup,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizePayload } from '../firebase';
import {
  Database,
  PlusCircle,
  FileCheck,
  Users,
  Sparkles,
  Search,
  Trash2,
  Edit3,
  BookOpen,
  Building,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  FileText,
  Download,
  ShieldAlert,
} from 'lucide-react';

interface AdminPortalProps {
  standards: CompanyStandard[];
  onStandardsUpdated: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ standards, onStandardsUpdated }) => {
  const { currentUser, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'standards' | 'submissions' | 'synthesis'>('standards');

  // Standards Management State
  const [editingStandard, setEditingStandard] = useState<Partial<CompanyStandard> | null>(null);
  const [standardTitle, setStandardTitle] = useState('');
  const [standardCategory, setStandardCategory] = useState('Institutional Accreditation');
  const [standardDescription, setStandardDescription] = useState('');
  const [standardContent, setStandardContent] = useState('');
  const [standardVersion, setStandardVersion] = useState('2026.1');
  const [savingStandard, setSavingStandard] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Submissions State
  const [allSubmissions, setAllSubmissions] = useState<AuditInteraction[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');
  const [inspectingSubmission, setInspectingSubmission] = useState<AuditInteraction | null>(null);

  // AI Intelligence Synthesis State
  const [synthesisReport, setSynthesisReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchAllSubmissions = async () => {
    setLoadingSubmissions(true);
    setStatusMessage(null);
    try {
      const interactionsRef = collectionGroup(db, 'interactions');
      const q = query(interactionsRef, limit(100));
      const snap = await getDocs(q);

      const items: AuditInteraction[] = [];
      snap.forEach((d) => {
        items.push(d.data() as AuditInteraction);
      });

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllSubmissions(items);
    } catch (err: unknown) {
      console.error('Failed to fetch cross-user submissions:', err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'interactions (collectionGroup)');
      } catch (e: any) {
        setStatusMessage(`Permissions note: ${e.message}`);
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions' || activeTab === 'synthesis') {
      fetchAllSubmissions();
    }
  }, [activeTab]);

  const standardPresets = [
    {
      title: 'TRAC AACCUP Program Accreditation Benchmark (Areas I - X)',
      category: 'Institutional Accreditation',
      version: '2026.1',
      description: 'Accreditation criteria covering Vision-Mission, Faculty, Curriculum, Support Services, Research, Extension, and Laboratories.',
      content: `1. CURRICULUM & INSTRUCTION (Area III): All degree courses must implement validated Outcomes-Based Education (OBE) syllabi with documented assessment rubrics.
2. FACULTY DEVELOPMENT (Area II): At least 60% of full-time academic faculty must possess relevant Master's degrees; faculty development portfolios must be updated annually.
3. RESEARCH & EXTENSION (Areas V & VI): Every academic program must maintain active community-based agricultural or aquatic extension projects in Tawi-Tawi with measurable impact metrics.
4. LABORATORIES & PHYSICAL PLANT (Area VII): Equipment calibration logs, inventory sheets, and safety protocols must be inspected prior to each academic semester.`,
    },
    {
      title: 'TRAC Faculty Workload & Syllabus Submission SOP',
      category: 'Academic SOP',
      version: '1.4',
      description: 'Institutional guidelines for semestral syllabus review, teaching load computation, and grading deadlines.',
      content: `1. SYLLABUS ENDORSEMENT: Course syllabi must be submitted to the Dean by the 2nd week of classes and uploaded to the college academic repository.
2. TEACHING CONTACT HOURS: Maximum regular teaching load is 18-21 units; research and administrative designations must have corresponding approved release time.
3. GRADE SUBMISSION DEADLINE: Final course grades must be encoded into the Registrar portal within 5 working days following the final examination period.
4. REMEDIAL SUPPORT: Instructors must conduct at least 2 documented academic consultation hours per week for struggling students.`,
    },
    {
      title: 'TRAC Agricultural Research Station & Laboratory Protocol',
      category: 'Research & Farm Operations',
      version: '2.0',
      description: 'Operating guidelines for experimental farms, soil testing, aquaculture hatcheries, and campus laboratories.',
      content: `1. REQUISITION TIMELINE: Experimental reagents, seeds, and farm supplies must be requisitioned at least 30 days prior to planting or breeding cycles.
2. BIOSAFETY & HAZARD CONTROLS: Chemical disposal and aquaculture waste must adhere strictly to environmental safety and DENR regulations.
3. DATA REPOSITORIES: Thesis experiment datasets must be archived in the TRAC RDE research vault upon project completion.`,
    },
  ];

  const applyPreset = (preset: typeof standardPresets[0]) => {
    setStandardTitle(preset.title);
    setStandardCategory(preset.category);
    setStandardVersion(preset.version);
    setStandardDescription(preset.description);
    setStandardContent(preset.content);
  };

  const handleSaveStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isSuperAdmin) return;

    setSavingStandard(true);
    setStatusMessage(null);

    const standardId =
      editingStandard?.id ||
      `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newStandard: CompanyStandard = {
      id: standardId,
      title: standardTitle.trim(),
      category: standardCategory.trim(),
      description: standardDescription.trim(),
      content: standardContent.trim(),
      version: standardVersion.trim() || '2026.1',
      uploadedBy: currentUser.uid,
      uploadedByEmail: currentUser.email || 'aasaali_250000003099@uic.edu.ph',
      isActive: true,
      createdAt: editingStandard?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const sanitized = sanitizePayload(newStandard);
      const docRef = doc(db, 'company_standards', standardId);
      await setDoc(docRef, sanitized);

      setStatusMessage('Standard successfully published to TRAC institutional database.');
      setEditingStandard(null);
      setStandardTitle('');
      setStandardDescription('');
      setStandardContent('');
      setStandardVersion('2026.1');
      onStandardsUpdated();
    } catch (err: unknown) {
      console.error('Failed to save company standard:', err);
      handleFirestoreError(err, OperationType.WRITE, `company_standards/${standardId}`);
    } finally {
      setSavingStandard(false);
    }
  };

  const handleDeleteStandard = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this institutional quality standard?')) return;
    try {
      const docRef = doc(db, 'company_standards', id);
      await deleteDoc(docRef);
      setStatusMessage('Institutional standard removed.');
      onStandardsUpdated();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `company_standards/${id}`);
    }
  };

  const handleEditStandard = (standard: CompanyStandard) => {
    setEditingStandard(standard);
    setStandardTitle(standard.title);
    setStandardCategory(standard.category);
    setStandardDescription(standard.description);
    setStandardContent(standard.content);
    setStandardVersion(standard.version);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingStandard(null);
    setStandardTitle('');
    setStandardDescription('');
    setStandardContent('');
    setStandardVersion('2026.1');
  };

  const handleGenerateSynthesis = async () => {
    if (allSubmissions.length === 0) {
      alert('No audit submissions available to synthesize.');
      return;
    }
    setGeneratingReport(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/gemini/summarize-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions: allSubmissions,
          standards,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to synthesize audit report');
      }

      const resData = await response.json();
      setSynthesisReport(resData.summary);
    } catch (err: any) {
      console.error('Failed to generate synthesis:', err);
      setStatusMessage(`AI Synthesis error: ${err?.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const filteredSubmissions = allSubmissions.filter((sub) => {
    const q = submissionSearch.toLowerCase();
    const matchesSearch =
      !q ||
      sub.userInput.toLowerCase().includes(q) ||
      sub.sessionTitle?.toLowerCase().includes(q) ||
      sub.userRole?.toLowerCase().includes(q) ||
      sub.userDept?.toLowerCase().includes(q) ||
      sub.geminiResponse.toLowerCase().includes(q);

    const matchesDept = selectedDeptFilter === 'all' || sub.userDept === selectedDeptFilter;
    const matchesTopic = selectedTopicFilter === 'all' || sub.topic === selectedTopicFilter;

    return matchesSearch && matchesDept && matchesTopic;
  });

  const uniqueDepartments = Array.from(new Set(allSubmissions.map((s) => s.userDept).filter(Boolean)));

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Super Administrator Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 font-medium">
          This portal is strictly reserved for the designated super administrator (aasaali_250000003099@uic.edu.ph).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Super Admin Command Header in Green and White Palette */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 rounded-2xl border border-emerald-700/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg text-white">
        <div className="flex items-center space-x-3.5">
          <img
            src="/trac-logo-128.png"
            alt="TRAC Official Seal"
            className="w-13 h-13 object-contain rounded-full bg-white p-0.5 border-2 border-emerald-300 ring-2 ring-amber-400/50 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">TRAC Super Administrator Command Center</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded uppercase">
                TRAC QA Governance
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1 font-medium">
              Tawi-Tawi Regional Agricultural College &bull; Admin: <span className="text-emerald-200 font-bold">{currentUser?.email}</span>
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center space-x-1.5 bg-black/20 p-1.5 rounded-xl border border-white/15">
          <button
            onClick={() => setActiveTab('standards')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'standards'
                ? 'bg-white text-emerald-900 shadow'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Standards &amp; Basis ({standards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-white text-emerald-900 shadow'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Faculty Audits ({allSubmissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('synthesis')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'synthesis'
                ? 'bg-white text-emerald-900 shadow'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive AI Synthesis</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center space-x-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: Company Standards & Audit Basis */}
      {activeTab === 'standards' && (
        <div className="space-y-6">
          {/* Upload / Edit Standard Form */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {editingStandard ? 'Edit Institutional Quality Standard' : 'Upload TRAC Standards & Quality Audit Basis'}
                </h3>
              </div>
              {editingStandard && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600 mb-5 font-medium">
              These guidelines serve as the authoritative reference data for Gemini 3.6 Flash when evaluating faculty submissions across TRAC academic departments.
            </p>

            {/* Quick preset templates */}
            {!editingStandard && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 block mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Click to load an official TRAC benchmark template:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {standardPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-100 text-[11px] text-emerald-900 font-medium border border-emerald-300 transition-colors shadow-sm cursor-pointer"
                    >
                      {preset.title.slice(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveStandard} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Standard / Benchmark Title *
                  </label>
                  <input
                    type="text"
                    value={standardTitle}
                    onChange={(e) => setStandardTitle(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="e.g. TRAC AACCUP Area III Curriculum Quality Rubric"
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={standardCategory}
                    onChange={(e) => setStandardCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-2.5 text-xs text-slate-900 transition-colors shadow-sm font-medium"
                  >
                    <option value="Institutional Accreditation">Institutional Accreditation (AACCUP)</option>
                    <option value="Academic SOP">Academic SOP (CHED)</option>
                    <option value="Research & Farm Operations">Research &amp; Farm Operations</option>
                    <option value="Faculty & Staff Development">Faculty &amp; Staff Development</option>
                    <option value="Student Support & Services">Student Support &amp; Services</option>
                    <option value="Laboratory & Facilities">Laboratory &amp; Facilities</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Scope &amp; Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={standardDescription}
                    onChange={(e) => setStandardDescription(e.target.value)}
                    maxLength={1000}
                    placeholder="Briefly state the scope, target institutes, and compliance criteria..."
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Version
                  </label>
                  <input
                    type="text"
                    value={standardVersion}
                    onChange={(e) => setStandardVersion(e.target.value)}
                    maxLength={32}
                    placeholder="e.g. 2026.1"
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Mandatory Standard Guidelines &amp; Audit Criteria *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">{standardContent.length} / 50,000 chars</span>
                </div>
                <textarea
                  value={standardContent}
                  onChange={(e) => setStandardContent(e.target.value)}
                  required
                  rows={6}
                  placeholder="Enter the numbered guidelines, AACCUP criteria, teaching hour limits, or experimental protocols..."
                  className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl p-4 text-xs text-slate-900 placeholder-slate-400 transition-colors font-mono leading-relaxed shadow-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingStandard || !standardTitle.trim() || !standardContent.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingStandard ? 'Publishing...' : editingStandard ? 'Update Standard' : 'Publish Quality Standard'}
                </button>
              </div>
            </form>
          </div>

          {/* List of Published Standards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Published TRAC Standards ({standards.length})</span>
            </h3>

            {standards.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <FileCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">No standards uploaded yet</p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Upload college SOPs or click one of the preset templates above to establish the institutional audit basis.
                </p>
              </div>
            ) : (
              standards.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-white border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase">
                        {s.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-medium">v{s.version || '1.0'}</span>
                      <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                    </div>

                    {s.description && (
                      <p className="text-xs text-slate-600 italic font-medium">{s.description}</p>
                    )}

                    <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800 whitespace-pre-wrap font-mono line-clamp-3">
                      {s.content}
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      Uploaded by: {s.uploadedByEmail || 'Super Admin'} &bull; {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleEditStandard(s)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Standard"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStandard(s.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Standard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Cross-User Workforce Audit Submissions */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-emerald-100 p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  placeholder="Search submissions by faculty statement, role, institute, or keyword..."
                  className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-white border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="all">All Departments &amp; Units</option>
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={selectedTopicFilter}
                  onChange={(e) => setSelectedTopicFilter(e.target.value)}
                  className="bg-white border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="all">All Topics</option>
                  <option value="work_processes">Teaching &amp; Work Processes</option>
                  <option value="challenges">Difficulties &amp; Bottlenecks</option>
                  <option value="complaints">Complaints &amp; Friction</option>
                  <option value="suggestions">Suggestions &amp; Innovations</option>
                </select>

                <button
                  onClick={fetchAllSubmissions}
                  className="p-2 text-slate-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                  title="Refresh Submissions"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSubmissions ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {loadingSubmissions ? (
            <div className="text-center py-12 text-xs text-slate-600 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading cross-faculty audit entries...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-emerald-100 shadow-sm">
              <Users className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No Workforce Audits Found</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Auditees will appear here once faculty and staff submit their self-audits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setInspectingSubmission(sub)}
                  className="p-5 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-sm hover:shadow-md space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase">
                        {sub.topic.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {sub.sessionTitle || 'Audit Entry'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center space-x-3 font-medium">
                      <span className="flex items-center space-x-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.userRole || 'Faculty'}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.userDept || 'Unit'}</span>
                      </span>
                      <span>&bull;</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-normal">
                    &ldquo;{sub.userInput}&rdquo;
                  </p>

                  {sub.qualityAssessment && (
                    <div className="text-[11px] text-emerald-800 font-semibold truncate pt-1 border-t border-slate-100">
                      🏅 Assessment: {sub.qualityAssessment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Executive AI Intelligence Synthesis */}
      {activeTab === 'synthesis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Cross-Department Quality Audit Intelligence</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Synthesize all {allSubmissions.length} faculty and staff submissions against your {standards.length} official TRAC standards.
                </p>
              </div>

              <button
                onClick={handleGenerateSynthesis}
                disabled={generatingReport || allSubmissions.length === 0}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {generatingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Intelligence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Generate Executive Audit Synthesis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Synthesis Report Display */}
          {synthesisReport && (
            <div className="p-8 rounded-2xl bg-white border border-emerald-200 shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Executive Quality Audit &amp; Institutional Health Report (TRAC)
                  </h3>
                </div>

                <button
                  onClick={() => {
                    const blob = new Blob([synthesisReport], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `trac_executive_audit_${new Date().toISOString().slice(0, 10)}.md`;
                    a.click();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs text-emerald-900 font-bold border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Report (.md)</span>
                </button>
              </div>

              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans space-y-3 font-normal">
                {synthesisReport}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspect Submission Modal */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white border border-emerald-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                  {inspectingSubmission.topic.replace('_', ' ')}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {inspectingSubmission.sessionTitle || 'Audit Submission'}
                </h3>
              </div>
              <button
                onClick={() => setInspectingSubmission(null)}
                className="text-slate-600 hover:text-slate-900 text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Faculty Statement ({inspectingSubmission.userRole || 'Role'} &bull; {inspectingSubmission.userDept || 'Dept'})
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                  {inspectingSubmission.userInput}
                </p>
              </div>

              {inspectingSubmission.qualityAssessment && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 block mb-1">AACCUP Compliance Assessment</span>
                  <p className="text-slate-900 font-semibold">{inspectingSubmission.qualityAssessment}</p>
                </div>
              )}

              {inspectingSubmission.insightsSummary && (
                <div className="p-3.5 rounded-xl bg-white border border-teal-200 shadow-sm">
                  <span className="text-[10px] font-bold text-teal-700 block mb-1">Root Causes &amp; Insights</span>
                  <p className="text-slate-700 whitespace-pre-line font-normal">{inspectingSubmission.insightsSummary}</p>
                </div>
              )}

              {inspectingSubmission.actionableSuggestions && (
                <div className="p-3.5 rounded-xl bg-white border border-green-200 shadow-sm">
                  <span className="text-[10px] font-bold text-green-700 block mb-1">Recommended Next Steps</span>
                  <p className="text-slate-700 whitespace-pre-line font-normal">{inspectingSubmission.actionableSuggestions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
