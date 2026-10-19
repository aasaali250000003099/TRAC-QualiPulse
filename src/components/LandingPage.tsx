import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Sparkles, Database, ArrowRight, Award, Zap } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/40 text-slate-800 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-200/40 via-green-100/30 to-transparent blur-3xl pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 relative z-10 w-full">
        {/* Prominent Official Seal & Badge */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-300" />
            <img
              src="/trac-logo-512.png"
              alt="Tawi-Tawi Regional Agricultural College Official Seal"
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain relative z-10 drop-shadow-xl rounded-full bg-white p-2 border-4 border-emerald-300 ring-4 ring-emerald-500/20"
            />
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Tawi-Tawi Regional Agricultural College &bull; Quality Assurance Management Office</span>
          </div>
        </div>

        {/* Hero title & subtitle */}
        <div className="text-center mt-6 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Advancing Academic &amp; Agricultural Excellence at{' '}
            <span className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 bg-clip-text text-transparent">
              Tawi-Tawi Regional Agricultural College
            </span>
          </h1>
          <p className="mt-4 text-xs font-semibold text-emerald-800 uppercase tracking-widest">
            Bongao, Tawi-Tawi &bull; Established Under Batas Pambansa Blg. 384
          </p>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            A confidential, AI-guided institutional self-audit platform where TRAC faculty, researchers, extension specialists, and administrative staff evaluate academic workflows, research bottlenecks, and laboratory facilities against AACCUP and CHED quality standards.
          </p>

          {/* Primary CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-3.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white rounded-xl shadow-xl shadow-emerald-700/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Authenticating...' : 'Sign In with Google SSO'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Private &amp; Faculty-Isolated</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Zero Stored Passwords</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Real-time Gemini Feedback</span>
            </span>
          </div>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Super Admin Governance</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Designated QAMO administrator uploads college SOPs, AACCUP criteria, and monitors cross-departmental audit intelligence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Strict Data Isolation</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Firestore security rules enforce owner-bound isolation (<code className="text-emerald-700 font-semibold">request.auth.uid == userId</code>). Faculty records remain strictly confidential.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Multi-Turn AI Reflections</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Converse with Gemini 3.6 Flash regarding instructional challenges, laboratory supplies, and workload. Receive structured root-cause analysis and next steps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-lime-50 border border-lime-200 flex items-center justify-center text-lime-700 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Audit History &amp; Reporting</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Maintain an immutable chronological record of all quality submissions, with instant search, topic categorization, and exportable personal reports.
            </p>
          </div>
        </div>

        {/* Workflow Showcase */}
        <div className="mt-16 bg-white p-8 rounded-2xl border border-emerald-100 shadow-md">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">How the TRAC Quality Audit Lifecycle Works</h2>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Structured four-step feedback loop grounded in official college and accreditation standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">Step 1</span>
              <h4 className="text-sm font-bold text-slate-800">Google SSO &amp; Profile</h4>
              <p className="text-xs text-slate-600 mt-1">Authenticate and specify your academic institute, department, and teaching/research functions.</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">Step 2</span>
              <h4 className="text-sm font-bold text-slate-800">Category Selection</h4>
              <p className="text-xs text-slate-600 mt-1">Choose between Teaching Processes, Difficulties, Complaints, or Innovations.</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider block mb-1">Step 3</span>
              <h4 className="text-sm font-bold text-slate-800">Gemini 3.6 Flash Audit</h4>
              <p className="text-xs text-slate-600 mt-1">Gemini cross-references TRAC and AACCUP standards to provide brainstorming and root causes.</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">Step 4</span>
              <h4 className="text-sm font-bold text-slate-800">Isolated Persistence</h4>
              <p className="text-xs text-slate-600 mt-1">Your prompt and evaluation are safely stored in your private Firestore collection.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Logo */}
      <footer className="border-t border-emerald-100 bg-white/90 py-8 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="/trac-logo-128.png"
              alt="TRAC Logo"
              className="w-9 h-9 object-contain rounded-full bg-white p-0.5 border border-emerald-300"
            />
            <div className="text-left">
              <span className="font-bold text-xs text-slate-800 block">Tawi-Tawi Regional Agricultural College</span>
              <span className="text-[11px] text-emerald-800">Quality Assurance Management Office (QAMO) &bull; Nalil, Bongao</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Powered by Gemini 3.6 Flash &bull; Firestore Owner-Bound Security &bull; AACCUP / CHED Aligned
          </p>
        </div>
      </footer>
    </div>
  );
};
