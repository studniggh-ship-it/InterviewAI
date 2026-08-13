import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden bg-hero-glow">
      <div className="max-w-md w-full text-center space-y-6 relative z-10">
        <GlassCard className="p-8 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500/10 text-brand-400 mx-auto border border-brand-500/20">
            <span className="text-3xl font-black">404</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The page you are looking for does not exist or has been moved. Let's get you back to practicing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full" icon={<Home className="w-4 h-4" />}>
                Dashboard
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
                Home Page
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
