import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, Building, FileText, CheckCircle2, AlertCircle, Save, Sparkles } from 'lucide-react';

export const ProfileEditor: React.FC = () => {
  const { userProfile, updateUserProfile, currentUser, isSuperAdmin } = useAuth();

  const [jobRole, setJobRole] = useState(userProfile?.jobRole || '');
  const [department, setDepartment] = useState(userProfile?.department || '');
  const [jobDescription, setJobDescription] = useState(userProfile?.jobDescription || '');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setJobRole(userProfile.jobRole || '');
      setDepartment(userProfile.department || '');
      setJobDescription(userProfile.jobDescription || '');
      setDisplayName(userProfile.displayName || currentUser?.displayName || '');
    }
  }, [userProfile, currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        jobRole: jobRole.trim(),
        department: department.trim(),
        jobDescription: jobDescription.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save professional background.');
    } finally {
      setSaving(false);
    }
  };

  const sampleRoles = [
    {
      title: 'Assistant Professor - Agronomy & Crop Science',
      dept: 'Institute of Agriculture & Environmental Sciences',
      desc: 'Conducts undergraduate instruction in plant breeding and soil science, oversees student experimental farm trials, drafts OBE-compliant syllabi conforming to CHED standards, and publishes crop yield research.',
    },
    {
      title: 'Instructor - Aquaculture & Marine Fisheries',
      dept: 'College of Fisheries & Aquatic Sciences',
      desc: 'Delivers lectures on seaweed culture and marine cage aquaculture, oversees water quality testing laboratory, and coordinates coastal community extension projects in Tawi-Tawi.',
    },
    {
      title: 'Research & Extension Coordinator',
      dept: 'Research, Development & Extension (RDE) Office',
      desc: 'Monitors faculty research compliance, manages externally funded agricultural development grants, and organizes community livelihood training programs across island municipalities.',
    },
    {
      title: 'Quality Assurance & Accreditation Officer',
      dept: 'Quality Assurance Management Office (QAMO)',
      desc: 'Coordinates AACCUP institutional and program accreditation, audits OBE instructional syllabi, tracks faculty performance evaluations, and monitors institutional ISO compliance.',
    },
    {
      title: 'College Registrar & Records Officer',
      dept: 'Office of the College Registrar',
      desc: 'Maintains student scholastic transcripts, manages semestral enrollment verification, enforces CHED curriculum prerequisites, and generates graduation clearances.',
    },
  ];

  const applySample = (sample: typeof sampleRoles[0]) => {
    setJobRole(sample.title);
    setDepartment(sample.dept);
    setJobDescription(sample.desc);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img
            src="/trac-logo-128.png"
            alt="TRAC Official Seal"
            className="w-12 h-12 object-contain rounded-full bg-white p-0.5 border border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm shrink-0"
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <span>Academic Background &amp; Audit Context</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              TRAC QualiPulse uses your academic role and responsibilities to contextualize AACCUP &amp; CHED benchmarks.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <span className="self-start sm:self-auto px-3 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full shadow-sm">
            👑 Super Administrator (TRAC QAMO)
          </span>
        )}
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Academic profile saved successfully. Your next audit session will evaluate against this updated background.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Form Card */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-md">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Name / Faculty Name</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={128}
                required
                placeholder="e.g. Prof. Fatima Al-Mansoor"
                className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
              />
            </div>

            {/* Email (Read-only SSO) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                <span>Verified Google SSO Email</span>
              </label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed shadow-inner"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Institutional Google Authentication</span>
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                <span>Role / Designation at TRAC *</span>
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                maxLength={128}
                required
                placeholder="e.g. Assistant Professor, Farm Superintendent, Registrar Staff"
                className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-green-600" />
                <span>Institute / College / Unit *</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                maxLength={128}
                required
                placeholder="e.g. Institute of Agriculture, College of Fisheries, RDE Office"
                className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Job Function / Job Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Teaching, Research, or Operational Functions *</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">{jobDescription.length} / 5000 chars</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={5000}
              required
              rows={5}
              placeholder="Describe your day-to-day responsibilities, course loads, laboratory or farm duties, research projects, extension initiatives, and accreditation document preparation..."
              className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl p-4 text-xs text-slate-900 placeholder-slate-400 transition-colors leading-relaxed shadow-sm"
            />
            <p className="text-[11px] text-emerald-800 mt-1.5 font-medium">
              💡 Detail your courses, research field stations, or office duties so Gemini 3.6 Flash can audit with maximum precision against AACCUP criteria.
            </p>
          </div>

          {/* Pre-fill Sample Presets */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-700 font-bold block mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Or click to load a TRAC archetype:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleRoles.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applySample(sample)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] text-emerald-900 font-medium border border-emerald-200 transition-colors text-left cursor-pointer"
                >
                  {sample.title} ({sample.dept})
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Academic Background'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
