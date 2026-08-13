import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Flame, 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  History, 
  BarChart3, 
  Settings 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, streak, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = ['/', '/login', '/signup', '/forgot-password'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-darkBg/75 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-300">
            INTERVIEW<span className="text-brand-400">AI</span>
          </span>
        </Link>

        {/* Public Landing Nav links */}
        {isPublicPage && !isAuthenticated && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-brand-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-400 transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-brand-400 transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-brand-400 transition-colors">FAQ</a>
          </nav>
        )}

        {/* Right Section Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {streak && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>{streak.streak_count} Day Streak</span>
                </div>
              )}

              <Link to="/profile" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden border border-brand-400/40">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <span className="text-sm font-medium text-slate-200 hidden lg:inline">{user?.name}</span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 text-slate-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <LayoutDashboard className="w-4 h-4 text-brand-400" /> Dashboard
              </Link>
              <Link to="/interview/setup" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Start Interview
              </Link>
              <Link to="/resume" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <FileText className="w-4 h-4 text-purple-400" /> Resume Analyzer
              </Link>
              <Link to="/history" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <History className="w-4 h-4 text-amber-400" /> History
              </Link>
              <Link to="/progress" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Analytics
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <User className="w-4 h-4 text-pink-400" /> Profile
              </Link>
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800">
                <Settings className="w-4 h-4 text-slate-400" /> Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
