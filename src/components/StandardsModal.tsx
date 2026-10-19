import React from 'react';
import { CompanyStandard } from '../types';
import { BookOpen, X, ShieldCheck, Tag, Calendar, User } from 'lucide-react';

interface StandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  standards: CompanyStandard[];
}

export const StandardsModal: React.FC<StandardsModalProps> = ({ isOpen, onClose, standards }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-emerald-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-emerald-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center space-x-3">
            <img
              src="/trac-logo-128.png"
              alt="TRAC Official Seal"
              className="w-9 h-9 object-contain rounded-full bg-white p-0.5 border border-emerald-300 shadow-sm shrink-0"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">TRAC Institutional Quality Standards &amp; Accreditation Rubrics</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Official benchmarks, AACCUP criteria, and SOPs uploaded by the TRAC Super Administrator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {standards.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-emerald-200 rounded-xl bg-emerald-50/30">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No Custom Standards Uploaded Yet</p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 font-medium">
                The TRAC Super Administrator has not yet published custom institutional guidelines. Self-audits are currently benchmarked against CHED, AACCUP, and SUC Quality Management Standards.
              </p>
            </div>
          ) : (
            standards.map((standard) => (
              <div
                key={standard.id}
                className="p-5 rounded-xl bg-emerald-50/40 border border-emerald-200 hover:border-emerald-400 transition-colors shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                      {standard.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{standard.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center space-x-1 font-medium">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>v{standard.version || '1.0'}</span>
                  </span>
                </div>

                {standard.description && (
                  <p className="text-xs text-slate-600 mb-3 italic font-medium">
                    {standard.description}
                  </p>
                )}

                <div className="p-3.5 rounded-lg bg-white border border-emerald-100 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed shadow-inner">
                  {standard.content}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-emerald-100 font-medium">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Uploaded by: {standard.uploadedByEmail || 'Super Admin'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(standard.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-emerald-100 bg-slate-50/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Close Standards
          </button>
        </div>
      </div>
    </div>
  );
};
