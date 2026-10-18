import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleContext } from '../context/RoleContext';
import { User, Mail, Hash, ArrowRight, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';
import logoImg from '../assets/logo.png';

const AVATAR_OPTIONS = [
  { id: 'mint', label: 'Mint Spark', bg: '#c8f0dd', text: '🌱' },
  { id: 'yellow', label: 'Solar Pulse', bg: '#ffea79', text: '⚡' },
  { id: 'peach', label: 'Neon Peach', bg: '#ffd6c0', text: '🔥' },
  { id: 'blue', label: 'Deep Blue', bg: '#c8e2ff', text: '🎓' },
];

const SignupPage = () => {
  const { signup, confirmSignup, resendConfirmationCode, login } = useContext(RoleContext);
  const navigate = useNavigate();

  const [step, setStep] = useState('signup'); // 'signup' | 'confirm'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    avatarTheme: 'mint'
  });

  const [confirmationCode, setConfirmationCode] = useState('');
  const [cognitoUsername, setCognitoUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [errors, setErrors] = useState({});
  const [infoMsg, setInfoMsg] = useState('');

  // Resume verification if page was refreshed
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cp_pending_confirmation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username && parsed.email) {
          setCognitoUsername(parsed.username);
          setForm(prev => ({
            ...prev,
            email: parsed.email,
            name: parsed.name || '',
            studentId: parsed.studentId || ''
          }));
          setStep('confirm');
          setInfoMsg(`Resumed verification for ${parsed.email}. Please check your inbox for the code.`);
        }
      }
    } catch (_) {}
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Campus email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    
    // Optional student ID validation: if provided, validate format
    if (form.studentId.trim() && !/^[A-Za-z0-9-]+$/.test(form.studentId.trim())) {
      errs.studentId = 'Student ID can only contain letters, numbers, and hyphens';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    setInfoMsg('');

    try {
      const res = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        studentId: form.studentId.trim(),
        role: 'student',
        gender: form.avatarTheme // Avatar preference
      });

      if (res.needsConfirmation) {
        setCognitoUsername(res.username || '');
        setStep('confirm');
        setInfoMsg(`A 6-digit confirmation code was sent to ${form.email}.`);
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      console.error('Cognito sign up error:', err);
      if (err.code === 'UsernameExistsException' || err.name === 'UsernameExistsException') {
        setErrors({ email: 'An account with this email already exists. Try signing in.' });
      } else {
        setErrors({ general: err.message || 'Failed to create campus account.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!confirmationCode.trim()) {
      setErrors({ confirm: 'Please enter the 6-digit verification code.' });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await confirmSignup(cognitoUsername || form.email, confirmationCode.trim());
      // Auto login after confirmation
      if (form.password) {
        try {
          await login(form.email, form.password);
          navigate('/student', { replace: true });
          return;
        } catch (_) {}
      }
      navigate('/login', { replace: true, state: { verified: true } });
    } catch (err) {
      console.error('Confirmation error:', err);
      setErrors({ confirm: err.message || 'Invalid or expired verification code.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendingCode(true);
    setErrors({});
    try {
      await resendConfirmationCode(cognitoUsername || form.email);
      setInfoMsg('A fresh verification code has been dispatched to your email.');
    } catch (err) {
      setErrors({ confirm: err.message || 'Failed to resend code.' });
    } finally {
      setResendingCode(false);
    }
  };

  const inputClass = (field) => 
    `w-full border-3 ${errors[field] ? 'border-red-500 bg-red-50' : 'border-black'} p-3 font-bold text-sm outline-none focus:bg-pastel-yellow focus-visible:ring-2 focus-visible:ring-black transition-colors placeholder:text-black/40`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white border-3 border-black p-8 neo-shadow-lg relative"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Link to="/" className="inline-flex items-center group py-1" title="EventTrail Home" aria-label="EventTrail Home">
            <img
              src={logoImg}
              alt="EventTrail"
              className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 select-none"
            />
          </Link>
        </div>

        <h1 className="font-display font-black text-3xl uppercase text-center mb-2">
          {step === 'signup' ? 'Create Account' : 'Confirm Email'}
        </h1>
        <p className="text-center text-sm font-bold text-black/60 mb-6 uppercase tracking-wider">
          {step === 'signup' ? 'Join your campus event network' : 'Enter the OTP sent to your inbox'}
        </p>

        {/* Status / Errors */}
        <AnimatePresence>
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="bg-red-50 border-3 border-red-500 text-red-700 p-3 mb-6 text-xs font-bold shadow-[2px_2px_0px_0px_#ef4444]"
            >
              {errors.general}
            </motion.div>
          )}
          {infoMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
              className="bg-pastel-mint border-3 border-black text-black p-3 mb-6 text-xs font-bold shadow-[2px_2px_0px_0px_#000]"
            >
              {infoMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'signup' ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="signup-name" className="block text-xs font-black uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative flex items-center">
                <input
                  id="signup-name"
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  className={inputClass('name')}
                  required
                />
                <User size={18} className="absolute right-3.5 text-black/40 pointer-events-none" />
              </div>
              {errors.name && <p className="text-red-500 font-bold text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-black uppercase tracking-wider mb-1">
                Campus Email *
              </label>
              <div className="relative flex items-center">
                <input
                  id="signup-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="alex@campus.edu"
                  autoComplete="email"
                  className={inputClass('email')}
                  required
                />
                <Mail size={18} className="absolute right-3.5 text-black/40 pointer-events-none" />
              </div>
              {errors.email && <p className="text-red-500 font-bold text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="signup-studentid" className="block text-xs font-black uppercase tracking-wider mb-1">
                Student ID <span className="text-black/50 font-medium">(Optional)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="signup-studentid"
                  type="text"
                  value={form.studentId}
                  onChange={handleChange('studentId')}
                  placeholder="STU-2026-042"
                  className={inputClass('studentId')}
                />
                <Hash size={18} className="absolute right-3.5 text-black/40 pointer-events-none" />
              </div>
              {errors.studentId && <p className="text-red-500 font-bold text-xs mt-1">{errors.studentId}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-black uppercase tracking-wider mb-1">
                Password * <span className="text-black/50 font-medium">(min 8 chars)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`${inputClass('password')} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 text-black/60 hover:text-black focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 font-bold text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Avatar Theme Selection (replaces mandatory binary gender) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Profile Avatar Style
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, avatarTheme: opt.id }))}
                    className={`py-2 px-1 border-2 border-black flex flex-col items-center justify-center gap-1 transition-all ${
                      form.avatarTheme === opt.id
                        ? 'shadow-[2px_2px_0px_0px_#000] scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: opt.bg }}
                    title={opt.label}
                  >
                    <span className="text-base">{opt.text}</span>
                    <span className="text-[10px] font-black uppercase text-black">{opt.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-3.5 mt-2 flex items-center justify-center gap-2 text-base font-black uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} strokeWidth={3} />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label htmlFor="confirm-code" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Verification Code
              </label>
              <input
                id="confirm-code"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="123456"
                className="w-full border-3 border-black p-3 font-mono font-bold text-center text-lg tracking-widest outline-none focus:bg-pastel-yellow transition-colors"
                autoFocus
                required
              />
              {errors.confirm && <p className="text-red-500 font-bold text-xs mt-1">{errors.confirm}</p>}
            </div>

            <Button
              type="submit"
              variant="mint"
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2 text-base font-black uppercase tracking-wider border-3 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendingCode}
                className="text-xs font-bold text-black/70 hover:text-black underline uppercase"
              >
                {resendingCode ? 'Sending...' : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => setStep('signup')}
                className="text-xs font-bold text-black/70 hover:text-black underline uppercase"
              >
                Edit Information
              </button>
            </div>
          </form>
        )}

        {/* Existing account footer */}
        <div className="mt-8 pt-6 border-t-3 border-black text-center">
          <p className="text-xs font-bold text-black/70 uppercase tracking-wider mb-2">
            Already have an account?
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-2.5 bg-pastel-mint border-2 border-black font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-y-px transition-all"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
