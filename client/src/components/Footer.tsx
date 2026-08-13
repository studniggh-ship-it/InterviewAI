import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-darkBg/90 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">INTERVIEW<span className="text-brand-400">AI</span></span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Production-ready AI interview practice and ATS resume analysis platform built for developers and job seekers.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Features</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/interview/setup" className="hover:text-brand-400">Mock AI Interview</Link></li>
              <li><Link to="/resume" className="hover:text-brand-400">ATS Resume Analyzer</Link></li>
              <li><Link to="/progress" className="hover:text-brand-400">Skill Analytics</Link></li>
              <li><Link to="/history" className="hover:text-brand-400">Interview History</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Supported Roles</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Software Engineer</li>
              <li>Frontend & Backend Developer</li>
              <li>AI & Machine Learning Engineer</li>
              <li>Data Analyst & Business Analyst</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/settings" className="hover:text-brand-400">Privacy Policy</Link></li>
              <li><Link to="/settings" className="hover:text-brand-400">Terms of Service</Link></li>
              <li><Link to="/settings" className="hover:text-brand-400">About INTERVIEWAI</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} INTERVIEWAI. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Designed for production and Capacitor mobile deployment</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
