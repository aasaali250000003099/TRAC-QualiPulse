import React, { useState } from 'react';
import { AuditInteraction, AuditTopic } from '../types';
import {
  LayoutDashboard,
  Search,
  Download,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface AuditHistoryProps {
  interactions: AuditInteraction[];
  onInteractionDeleted: (id: string) => void;
  onStartAudit: () => void;
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({
  interactions,
  onInteractionDeleted,
  onStartAudit,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = interactions.filter((item) => {
    const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      item.sessionTitle?.toLowerCase().includes(query) ||
      item.userInput.toLowerCase().includes(query) ||
      item.geminiResponse.toLowerCase().includes(query) ||
      item.qualityAssessment?.toLowerCase().includes(query);
    return matchesTopic && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to delete this audit record from your private history?')) {
      return;
    }

    setDeletingId(id);
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'interactions', id);
      await deleteDoc(docRef);
      onInteractionDeleted(id);
    } catch (err) {
      console.error('Failed to delete interaction:', err);
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/interactions/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(interactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trac_audit_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTopicBadge = (t: AuditTopic) => {
    switch (t) {
      case 'work_processes':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">Work Processes</span>;
      case 'challenges':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">Challenge / Bottleneck</span>;
      case 'complaints':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-900 border border-rose-200">Complaint / Friction</span>;
      case 'suggestions':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">Innovation / Suggestion</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">General Audit</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src="/trac-logo-128.png"
            alt="TRAC Official Seal"
            className="w-11 h-11 object-contain rounded-full bg-white p-0.5 border border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm shrink-0"
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <span>My Private TRAC Audit History</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Chronological log of your confidential quality audits, root causes, and Gemini recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {interactions.length > 0 && (
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export History (JSON)</span>
            </button>
          )}

          <button
            onClick={onStartAudit}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Audit Exchange</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across questions, responses, root causes, or quality grades..."
              className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'work_processes', 'challenges', 'complaints', 'suggestions'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedTopic === t
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-emerald-50/50'
                }`}
              >
                {t === 'all'
                  ? 'All Topics'
                  : t === 'work_processes'
                  ? 'Processes'
                  : t === 'challenges'
                  ? 'Bottlenecks'
                  : t === 'complaints'
                  ? 'Complaints'
                  : 'Suggestions'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Entries List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-emerald-200 rounded-2xl shadow-sm">
            <MessageSquare className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Audit Records Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 font-medium">
              {searchQuery || selectedTopic !== 'all'
                ? 'Try adjusting your search query or topic filter.'
                : 'You have not submitted any audit dialogues yet. Start your first session now.'}
            </p>
            <button
              onClick={onStartAudit}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-emerald-700/20"
            >
              Start First TRAC Quality Audit
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all shadow-sm hover:shadow-md overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTopicBadge(item.topic)}
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.sessionTitle || 'Untitled Audit Session'}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-normal">
                      &ldquo;{item.userInput}&rdquo;
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1 font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </span>
                      {item.qualityAssessment && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-800 font-bold truncate max-w-xs">
                            {item.qualityAssessment}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={deletingId === item.id}
                      title="Delete Record"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg bg-emerald-50"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-800" /> : <ChevronDown className="w-4 h-4 text-emerald-800" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed View */}
                {isExpanded && (
                  <div className="p-6 border-t border-emerald-100 bg-emerald-50/20 space-y-5 animate-fade-in">
                    {/* User Prompt Box */}
                    <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        Your Submitted Input ({item.userRole || 'Auditee'} &bull; {item.userDept || 'Dept'})
                      </span>
                      <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
                        {item.userInput}
                      </p>
                    </div>

                    {/* Quality Assessment */}
                    {item.qualityAssessment && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                            Quality Compliance Grade
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                          {item.qualityAssessment}
                        </p>
                      </div>
                    )}

                    {/* 2-column breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.insightsSummary && (
                        <div className="p-4 rounded-xl bg-white border border-teal-200 shadow-sm">
                          <div className="flex items-center space-x-2 text-teal-700 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                              Root Causes &amp; Systemic Insights
                            </h4>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                            {item.insightsSummary}
                          </p>
                        </div>
                      )}

                      {item.brainstormingIdeas && (
                        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
                          <div className="flex items-center space-x-2 text-emerald-700 mb-2">
                            <Lightbulb className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                              Brainstorming &amp; Solutions
                            </h4>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                            {item.brainstormingIdeas}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actionable Suggestions */}
                    {item.actionableSuggestions && (
                      <div className="p-4 rounded-xl bg-white border border-green-200 shadow-sm">
                        <div className="flex items-center space-x-2 text-green-700 mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-900">
                            Actionable Next Steps
                          </h4>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                          {item.actionableSuggestions}
                        </p>
                      </div>
                    )}

                    {/* Full Response */}
                    <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        Full Gemini 3.6 Flash Audit Response
                      </span>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-normal">
                        {item.geminiResponse}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
