import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  History, 
  BarChart3, 
  User, 
  Settings,
  Sparkles,
  Flame
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { streak } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Start Interview', path: '/interview/setup', icon: Briefcase },
    { label: 'Resume Analyzer', path: '/resume', icon: FileText },
    { label: 'Interview History', path: '/history', icon: History },
    { label: 'Progress Analytics', path: '/progress', icon: BarChart3 },
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 glass-panel rounded-2xl p-4 space-y-6 border border-white/10">
        {/* Streak banner */}
        {streak && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
              <div>
                <div className="text-xs text-amber-300 font-medium">Daily Streak</div>
                <div className="text-sm font-bold text-amber-400">{streak.streak_count} Days Active</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/90 to-brand-500/90 text-white shadow-md shadow-brand-500/20 border border-brand-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* AI Intelligence badge card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-950/60 to-indigo-950/60 border border-brand-500/30 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-white">AI Interview Intelligence</div>
          <p className="text-[11px] text-slate-400">Powered by real-time adaptive evaluation models</p>
        </div>
      </div>
    </aside>
  );
};
