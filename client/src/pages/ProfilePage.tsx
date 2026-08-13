import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  GraduationCap, 
  Code2, 
  FileText, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Save,
  Clock
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFullProfile();
  }, []);

  const fetchFullProfile = async () => {
    try {
      const res = await apiClient.get('/profile');
      const u = res.data;
      setName(u.name || '');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setLinkedin(u.linkedin || '');
      setGithub(u.github || '');
      setPortfolio(u.portfolio || '');
      setTargetRole(u.target_role || '');
      setExperience(u.experience || '');
      setEducation(u.education || u.college || '');
      setSkills(u.skills || '');
      setBio(u.bio || '');
      setAvatarUrl(u.avatar_url || '');
    } catch (e) {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setLinkedin(user.linkedin || '');
        setGithub(user.github || '');
        setPortfolio(user.portfolio || '');
        setTargetRole(user.target_role || '');
        setExperience(user.experience || '');
        setEducation(user.education || user.college || '');
        setSkills(user.skills || '');
        setBio(user.bio || '');
        setAvatarUrl(user.avatar_url || '');
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await apiClient.put('/profile', {
        name,
        phone,
        linkedin,
        github,
        portfolio,
        target_role: targetRole,
        experience,
        education,
        college: education,
        skills,
        bio,
        avatar_url: avatarUrl,
      });

      updateUser(res.data.user);
      setSuccessMsg('Profile updated successfully in SQLite database.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const res = await apiClient.post('/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setAvatarUrl(res.data.avatar_url);
        updateUser({ avatar_url: res.data.avatar_url });
        setSuccessMsg('Profile photo updated successfully.');
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error || 'Failed to upload photo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <UserIcon className="w-6 h-6 text-pink-400" /> Candidate Profile Management
            </h1>
            <p className="text-xs text-slate-400">
              Manage all 12 candidate profile fields to help AI tailor realistic mock interview questions.
            </p>
          </div>

          <GlassCard className="p-8 space-y-6">
            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Avatar Photo Section */}
            <div className="flex items-center gap-6 pb-6 border-b border-white/5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden border-2 border-brand-400/40 shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0).toUpperCase() || 'U'
                  )}
                </div>

                <label
                  htmlFor="avatar-file-input"
                  className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  title="Upload profile photo"
                >
                  <Camera className="w-6 h-6" />
                </label>
                <input
                  type="file"
                  id="avatar-file-input"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{name || 'Your Name'}</h3>
                <p className="text-xs text-slate-400">{email}</p>
                <div className="text-[11px] text-brand-400 mt-1">Hover & click image to upload new avatar</div>
              </div>
            </div>

            {/* Profile Form (12 Fields) */}
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Personal & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Email Address (Read-only for security) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Address (Registered)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs opacity-60 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Target Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Role</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Senior Full Stack Engineer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Professional Bio & Elevator Pitch</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly introduce your career background and what makes you passionate about software engineering..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 rounded-xl glass-input text-xs resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Online Profiles */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Social & Portfolio Profiles
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">LinkedIn URL</label>
                    <div className="relative">
                      <Linkedin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">GitHub Profile</label>
                    <div className="relative">
                      <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Portfolio Website</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://myportfolio.dev"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Skills & Education */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  3. Skills, Experience & Education
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Experience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Total Experience</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="3+ Years / Mid-Level"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Education / University</label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="B.S. Computer Science, Stanford"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Technical Skills & Tech Stack</label>
                  <div className="relative">
                    <Code2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={2}
                      placeholder="React, TypeScript, Node.js, Express, SQLite, Python, Docker, AWS"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </GlassCard>
        </main>
      </div>
    </div>
  );
};
