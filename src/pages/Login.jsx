import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleContext } from '../context/RoleContext';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const LoginPage = () => {
  const { login } = useContext(RoleContext);
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);

    // Mock login — simulate async check
    await new Promise(r => setTimeout(r, 700));

    const userData = {
      email,
      name: role === 'student' ? 'Alex Student' : 'Admin User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email,
    };

    login(role, userData);
    navigate(role === 'admin' ? '/admin' : '/student', { replace: true });
  };

  const inputClass = "w-full border-3 border-black p-3 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors placeholder:text-black/40";

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white border-3 border-black p-8 neo-shadow-lg relative"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="bg-accent-yellow border-2 border-black w-10 h-10 flex items-center justify-center font-display font-black text-xl shadow-[2px_2px_0px_0px_#000]">
            ET
          </div>
        </div>

        <h1 className="font-display font-black text-3xl uppercase text-center mb-2">
          Welcome back
        </h1>
        <p className="text-center text-sm font-bold text-black/60 mb-8 uppercase tracking-wider">
          Sign in to your account
        </p>

        {/* Role Toggle */}
        <div className="flex mb-8 border-3 border-black bg-bg-neobrutalist p-1 shadow-[2px_2px_0px_0px_#000]">
          {[
            { value: 'student', label: 'Student', icon: GraduationCap },
            { value: 'admin', label: 'Admin', icon: ShieldCheck },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setRole(value); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 uppercase font-bold text-sm transition-all neo-clickable ${
                role === value
                  ? 'bg-pastel-mint border-black shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-transparent border-transparent text-black/60 hover:text-black'
              }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} noValidate className="flex flex-col gap-6">
          {/* Email */}
          <div>
            <label className="block font-display font-black text-sm uppercase mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder={role === 'student' ? 'student@campus.edu' : 'admin@campus.edu'}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-display font-black text-sm uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={`${inputClass} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-pastel-peach border-3 border-black p-3 text-sm font-bold flex items-center justify-center text-black neo-shadow-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="w-full py-4 text-base mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in...
              </span>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </Button>
        </form>

        {/* Signup link — only for student */}
        <AnimatePresence>
          {role === 'student' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center mt-6 font-bold text-sm"
            >
              <span className="text-black/60 uppercase">Don't have an account? </span>
              <Link to="/signup" className="text-black uppercase hover:bg-pastel-yellow px-1 transition-colors">
                Sign Up Free
              </Link>
            </motion.p>
          )}
        </AnimatePresence>

        {/* Back to landing */}
        <div className="text-center mt-6">
          <Link to="/" className="text-black/40 uppercase font-bold text-xs hover:text-black transition-colors">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
