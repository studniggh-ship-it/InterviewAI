import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  Target, 
  Award, 
  CheckCircle2, 
  Zap, 
  ChevronDown, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Users,
  Smartphone
} from 'lucide-react';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const features = [
    {
      icon: BrainCircuit,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      title: 'Gemini AI Mock Interviews',
      desc: 'Dynamic real-time question generation tailored specifically to your target job role and difficulty level.'
    },
    {
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      title: 'ATS Resume Analyzer',
      desc: 'Instant PDF parsing and AI scoring with targeted skill gap identification and project suggestions.'
    },
    {
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      title: '6-Dimensional Feedback',
      desc: 'Detailed scoring on technical precision, communication, grammar, confidence, and problem-solving.'
    },
    {
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      title: 'Progress Analytics',
      desc: 'Visualize your weekly score growth, streak records, and topic mastery with interactive charts.'
    },
    {
      icon: Smartphone,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      title: 'Capacitor Mobile Ready',
      desc: 'Cross-platform native architectural layout ready for instant Android APK compilation.'
    },
    {
      icon: ShieldCheck,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      title: 'Local & Secure SQLite',
      desc: 'Zero reliance on third-party cloud backends. Fast, local JWT token authentication and data privacy.'
    }
  ];

  const howItWorks = [
    { step: '01', title: 'Select Job Role & Difficulty', desc: 'Pick from 12+ industry standard tech roles or input your own custom position.' },
    { step: '02', title: 'Answer Single AI Questions', desc: 'Interact with Gemini AI one question at a time with live countdown timer.' },
    { step: '03', title: 'Receive AI Scorecard', desc: 'Get immediate breakdown scores, model suggested answers, and improvement tips.' },
    { step: '04', title: 'Track Mastery & Streaks', desc: 'Build daily habits with streak counters and analytics dashboards.' }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Full Stack Software Engineer',
      college: 'Stanford Alumni',
      text: 'INTERVIEWAI gave me the confidence I needed to land my dream SDE role. The suggested model answers were spot-on!',
      score: '96% Technical Score'
    },
    {
      name: 'Priya Sharma',
      role: 'Frontend Developer',
      college: 'IIT Delhi',
      text: 'The ATS resume analyzer identified 4 missing skill tags on my resume. After updating it, I got 3 recruiter callbacks in a week!',
      score: '92% ATS Score'
    },
    {
      name: 'Michael Vance',
      role: 'Machine Learning Engineer',
      college: 'CMU',
      text: 'The 6-dimension evaluation breakdown is incredible. It highlighted grammar and delivery tips I never thought about.',
      score: '94% Overall Score'
    }
  ];

  const faqs = [
    {
      q: 'How does Gemini API power the mock interviews?',
      a: 'INTERVIEWAI connects directly to Google Gemini API to analyze your selected job role and difficulty, dynamically producing realistic questions and assessing your answers with 6 distinct rubric dimensions.'
    },
    {
      q: 'Can I use INTERVIEWAI on my mobile device?',
      a: 'Yes! The entire application is built with a responsive glassmorphic design and Capacitor architecture, making it ready for Android devices and mobile web.'
    },
    {
      q: 'Is my resume and interview data kept private?',
      a: 'Absolutely. All accounts, sessions, resume analyses, and feedback reports are stored securely in your local SQLite database using encrypted JWT sessions.'
    },
    {
      q: 'What job roles are supported?',
      a: 'We support Software Engineer, Frontend, Backend, Full Stack, Flutter, Python, Java, Data Analyst, AI Engineer, Machine Learning Engineer, HR, Marketing, Business Analyst, plus Custom Roles.'
    }
  ];

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden bg-hero-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            <span>Next-Gen AI Interviewer Powered by Gemini 2.5</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight"
          >
            Master Your Next Technical Interview with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400">
              INTERVIEWAI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Simulate real tech interviews, parse your resume with ATS scoring, and receive immediate multi-dimensional feedback to secure top job offers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <Button size="lg" icon={<Zap className="w-5 h-5 fill-white" />}>
                Start Free Practice Now
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">
                Explore How It Works
              </Button>
            </a>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <GlassCard className="text-center p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-400">12+</div>
              <div className="text-xs text-slate-400 mt-1">Specialized Tech Roles</div>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">6</div>
              <div className="text-xs text-slate-400 mt-1">Rubric Metrics</div>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">ATS</div>
              <div className="text-xs text-slate-400 mt-1">Resume Optimizer</div>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">SQLite Secured</div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest">Built For Production Excellence</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white">Everything You Need To Crack Top Technical Interviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <GlassCard key={idx} hoverEffect className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-slate-950/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Simple & Powerful Workflow</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white">How INTERVIEWAI Works</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <GlassCard key={idx} className="relative space-y-4 p-6">
                <div className="text-4xl font-black text-brand-500/20">{step.step}</div>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Success Stories</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white">Loved By Software Engineers & Developers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <GlassCard key={idx} className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {'★'.repeat(5)}
                  </div>
                  <p className="text-sm text-slate-300 italic">"{t.text}"</p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role} • {t.college}</div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    {t.score}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview (Coming Soon) */}
      <section className="py-16 bg-slate-950/60 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <span>Pricing Plans</span>
            <span className="bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Coming Soon</span>
          </div>
          <h2 className="text-3xl font-bold text-white">100% Free During Production Beta</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            All features including unlimited Gemini AI sessions, ATS resume analyses, analytics dashboards, and history tracking are free.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest">Frequently Asked Questions</h2>
            <p className="text-3xl font-bold text-white">Got Questions? We Have Answers</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <GlassCard key={idx} className="p-5 cursor-pointer" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-brand-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </div>
                {openFaq === idx && (
                  <p className="mt-3 text-sm text-slate-400 pt-3 border-t border-white/5 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-brand-900/60 via-indigo-900/60 to-brand-900/60 border-t border-brand-500/30 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready To Ace Your Next Technical Interview?</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Join thousands of developers leveling up their interview skills with INTERVIEWAI today.
          </p>
          <Link to="/signup" className="inline-block">
            <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
