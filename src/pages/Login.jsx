import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleContext } from '../context/RoleContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck, KeyRound, CheckCircle2, RefreshCw, Users, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import logoImg from '../assets/logo.png';

const LoginPage = () => {
  const { login, completeNewPassword, forgotPassword, confirmPassword, confirmSignup, resendConfirmationCode } = useContext(RoleContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Destination to return after login (e.g. event detail page or tickets)
  const returnTo = location.state?.from || null;

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Reset & Challenge Flows
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'forgot' | 'resetConfirm' | 'verifyAccount' | 'forceNewPassword'
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationUsername, setVerificationUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendingCode, setResendingCode] = useState(false);

  // First-time organizer login challenge state (FORCE_CHANGE_PASSWORD)
  const [challengeUser, setChallengeUser] = useState(null);
  const [challengeAttributes, setChallengeAttributes] = useState({});
  const [firstTimePassword, setFirstTimePassword] = useState('');
  const [confirmFirstTimePassword, setConfirmFirstTimePassword] = useState('');
  const [firstTimeName, setFirstTimeName] = useState('');

  // Check if there is pending confirmation state saved in sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cp_pending_confirmation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          setEmail(parsed.email);
          setResetEmail(parsed.email);
          setVerificationUsername(parsed.username || parsed.email);
        }
      }
    } catch (_) {}
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in your campus email and password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const result = await login(email, password);

      // Check for first-time password change challenge (admin-created club organizers)
      if (result && result.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setChallengeUser(result.cognitoUser);
        setChallengeAttributes(result.userAttributes || {});
        setViewMode('forceNewPassword');
        setSuccessMsg('First-time login detected. Please create your permanent password.');
        return;
      }

      // Authoritative destination based strictly on server-verified session role
      const verifiedRole = result?.role || 'student';
      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else if (verifiedRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (verifiedRole === 'club_admin') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      console.error('Cognito sign in error:', err);
      if (err.code === 'UserNotConfirmedException' || err.name === 'UserNotConfirmedException') {
        setError('Your email is not verified yet. Please enter the verification code sent to your inbox.');
        setVerificationUsername(email);
        setViewMode('verifyAccount');
      } else if (err.code === 'NotAuthorizedException' || err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password. Please verify your credentials.');
      } else if (err.code === 'UserNotFoundException' || err.name === 'UserNotFoundException') {
        setError('No campus account found with this email. Please check your credentials or contact your administrator.');
      } else {
        setError(err.message || 'Failed to sign in. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your registered campus email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(resetEmail);
      setSuccessMsg(`Verification code sent to ${resetEmail}. Check your inbox!`);
      setViewMode('resetConfirm');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setError('Please enter both the reset code and your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmPassword(resetEmail, resetCode, newPassword);
      setSuccessMsg('Password reset successfully! You can now sign in with your new password.');
      setEmail(resetEmail);
      setPassword('');
      setViewMode('login');
    } catch (err) {
      console.error('Confirm password error:', err);
      setError(err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccountConfirm = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmSignup(verificationUsername || email, verificationCode);
      setSuccessMsg('Account verified successfully! Please log in.');
      setViewMode('login');
    } catch (err) {
      console.error('Account verification error:', err);
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!firstTimePassword || !confirmFirstTimePassword) {
      setError('Please enter and confirm your new permanent password.');
      return;
    }
    if (firstTimePassword.length < 8) {
      setError('Permanent password must be at least 8 characters long.');
      return;
    }
    if (firstTimePassword !== confirmFirstTimePassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const attributes = { ...challengeAttributes };
      if (firstTimeName) attributes.name = firstTimeName;

      const session = await completeNewPassword(challengeUser, firstTimePassword, attributes);
      setSuccessMsg('Permanent password established! Welcome to EventTrail.');

      const userRole = session?.role || 'club_admin';
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'club_admin') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      console.error('Complete first-time password challenge error:', err);
      setError(err.message || 'Failed to set permanent password. Please ensure it meets password policy.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendingCode(true);
    setError('');
    try {
      await resendConfirmationCode(verificationUsername || email);
      setSuccessMsg('A new verification code has been dispatched to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResendingCode(false);
    }
  };

  const inputClass = "w-full border-3 border-black p-3 font-bold text-sm outline-none focus:bg-pastel-yellow focus-visible:ring-2 focus-visible:ring-black transition-colors placeholder:text-black/40";

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white border-3 border-black p-8 neo-shadow-lg relative"
      >
        {/* Logo Header */}
        <div className="flex items-center justify-center mb-6">
          <Link to="/" className="inline-flex items-center group py-1" title="EventTrail Home" aria-label="EventTrail Home">
            <img
              src={logoImg}
              alt="EventTrail"
              className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 select-none"
            />
          </Link>
        </div>

        {/* Dynamic Titles */}
        {viewMode === 'login' && (
          <>
            <h1 className="font-display font-black text-3xl uppercase text-center mb-2">
              Welcome back
            </h1>
            <p className="text-center text-sm font-bold text-black/60 mb-5 uppercase tracking-wider">
              {returnTo ? 'Sign in to complete your reservation' : 'Sign in to your campus account'}
            </p>

            {/* 3-Option Role Indicator / Preference Toggle */}
            <div className="flex mb-2 border-3 border-black bg-bg-neobrutalist p-1 shadow-[2px_2px_0px_0px_#000]">
              {[
                { value: 'student', label: 'Student', icon: GraduationCap },
                { value: 'club_organizer', label: 'Organizer', icon: Users },
                { value: 'admin', label: 'Admin', icon: ShieldCheck },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setRole(value); setError(''); }}
                  aria-pressed={role === value}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 border-2 uppercase font-bold text-xs transition-all neo-clickable focus-visible:ring-2 focus-visible:ring-black ${
                    role === value
                      ? 'bg-pastel-mint border-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-transparent border-transparent text-black/60 hover:text-black'
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold text-black/60 text-center mb-5 uppercase tracking-wider">
              {role === 'student' && 'Discover campus events and claim your tickets'}
              {role === 'club_organizer' && 'Manage your club events, drafts, and attendee rosters'}
              {role === 'admin' && 'Campus governance, event approvals, and venue administration'}
            </p>
          </>
        )}

        {viewMode === 'forgot' && (
          <div className="text-center mb-6">
            <h1 className="font-display font-black text-2xl uppercase mb-2">Reset Password</h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
              Enter your email to receive a password reset code
            </p>
          </div>
        )}

        {viewMode === 'resetConfirm' && (
          <div className="text-center mb-6">
            <h1 className="font-display font-black text-2xl uppercase mb-2">Set New Password</h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
              Enter the OTP code from your email and your new password
            </p>
          </div>
        )}

        {viewMode === 'verifyAccount' && (
          <div className="text-center mb-6">
            <h1 className="font-display font-black text-2xl uppercase mb-2">Verify Campus Email</h1>
            <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
              Enter the 6-digit confirmation code sent to your email
            </p>
          </div>
        )}

        {/* Feedback Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="bg-red-50 border-3 border-red-500 text-red-700 p-3 mb-6 text-xs font-bold shadow-[2px_2px_0px_0px_#ef4444]"
            >
              {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
              className="bg-green-50 border-3 border-green-600 text-green-800 p-3 mb-6 text-xs font-bold shadow-[2px_2px_0px_0px_#16a34a] flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW 1: Standard Login Form */}
        {viewMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'admin'
                      ? 'admin@campus.edu'
                      : (role === 'club_organizer' ? 'organizer@campus.edu' : 'student@campus.edu')
                  }
                  autoComplete="email"
                  className={inputClass}
                  required
                />
                <Mail size={18} className="absolute right-3.5 text-black/40 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-black uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setError('');
                    setSuccessMsg('');
                    setViewMode('forgot');
                  }}
                  className="text-xs font-bold text-black/60 hover:text-black underline uppercase focus-visible:ring-1 focus-visible:ring-black"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputClass} pr-10`}
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
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} strokeWidth={3} />
                </>
              )}
            </Button>
          </form>
        )}

        {/* VIEW 2: Forgot Password Request */}
        {viewMode === 'forgot' && (
          <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Registered Campus Email
              </label>
              <div className="relative flex items-center">
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="alex@campus.edu"
                  className={inputClass}
                  required
                />
                <Mail size={18} className="absolute right-3.5 text-black/40 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              variant="yellow"
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider border-3 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>

            <button
              type="button"
              onClick={() => { setError(''); setSuccessMsg(''); setViewMode('login'); }}
              className="w-full text-center text-xs font-black uppercase tracking-wider text-black/70 hover:text-black mt-2 underline"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* VIEW 3: Set New Password with Code */}
        {viewMode === 'resetConfirm' && (
          <form onSubmit={handlePasswordResetConfirm} className="space-y-4">
            <div>
              <label htmlFor="reset-code" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Verification Code (OTP)
              </label>
              <input
                id="reset-code"
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                New Password (min 8 characters)
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
            </div>

            <Button
              type="submit"
              variant="mint"
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider border-3 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              {loading ? 'Saving...' : 'Set New Password'}
            </Button>

            <button
              type="button"
              onClick={() => { setError(''); setSuccessMsg(''); setViewMode('login'); }}
              className="w-full text-center text-xs font-black uppercase tracking-wider text-black/70 hover:text-black mt-2 underline"
            >
              Cancel and Return
            </button>
          </form>
        )}

        {/* VIEW 4: Account Email Verification */}
        {viewMode === 'verifyAccount' && (
          <form onSubmit={handleVerifyAccountConfirm} className="space-y-4">
            <div>
              <label htmlFor="verify-code" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                id="verify-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                className={inputClass}
                required
              />
            </div>

            <Button
              type="submit"
              variant="mint"
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider border-3 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              {loading ? 'Verifying...' : 'Confirm Account'}
            </Button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendingCode}
                className="text-xs font-bold text-black/70 hover:text-black underline uppercase"
              >
                {resendingCode ? 'Sending...' : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => { setError(''); setSuccessMsg(''); setViewMode('login'); }}
                className="text-xs font-bold text-black/70 hover:text-black underline uppercase"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 5: Force New Password (First-Time Organizer / Admin Login) */}
        {viewMode === 'forceNewPassword' && (
          <form onSubmit={handleForceNewPasswordSubmit} className="space-y-4">
            <div className="p-3 bg-pastel-yellow border-2 border-black text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-1.5 font-black uppercase text-black mb-1">
                <Sparkles size={14} /> First-Time Account Setup
              </div>
              <p className="text-black/80">
                You are logging in with a temporary administrator invitation. Please establish your permanent account password now.
              </p>
            </div>

            <div>
              <label htmlFor="first-time-name" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Your Full Name (Optional)
              </label>
              <input
                id="first-time-name"
                type="text"
                value={firstTimeName}
                onChange={(e) => setFirstTimeName(e.target.value)}
                placeholder="Club Representative"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="first-time-password" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                New Permanent Password (min 8 chars)
              </label>
              <input
                id="first-time-password"
                type="password"
                value={firstTimePassword}
                onChange={(e) => setFirstTimePassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-first-time-password" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Confirm Permanent Password
              </label>
              <input
                id="confirm-first-time-password"
                type="password"
                value={confirmFirstTimePassword}
                onChange={(e) => setConfirmFirstTimePassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                required
              />
            </div>

            <Button
              type="submit"
              variant="mint"
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider border-3 border-black shadow-[3px_3px_0px_0px_#000]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                'Set Password & Sign In'
              )}
            </Button>
          </form>
        )}

        {/* Bottom Context Footer */}
        <div className="mt-8 pt-6 border-t-3 border-black text-center">
          {role === 'student' ? (
            <>
              <p className="text-xs font-bold text-black/70 uppercase tracking-wider mb-2">
                New student to EventTrail?
              </p>
              <Link
                to="/signup"
                className="inline-block w-full py-2.5 bg-pastel-yellow border-2 border-black font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-y-px transition-all"
              >
                Create Student Account
              </Link>
            </>
          ) : (
            <div className="p-3 bg-neutral-100 border-2 border-black text-xs font-bold text-black/70">
              <span className="font-black uppercase text-black block mb-1">
                {role === 'club_organizer' ? 'Organizer Notice' : 'Platform Administrator Notice'}
              </span>
              Organizer and administrator accounts are provisioned exclusively by Campus Administration. Check your invitation email or contact IT Administration.
            </div>
          )}
        </div>

        {/* Development Quick Role Switcher */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-3 bg-pastel-mint/30 border-2 border-black text-left text-xs space-y-2">
            <span className="font-black uppercase tracking-wider block text-black/80">
              ⚡ Local Dev Quick Sign In:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                id="dev-login-student"
                onClick={() => {
                  const user = {
                    id: 'student-dev',
                    email: 'student@campus.edu',
                    name: 'Alex Student',
                    role: 'student',
                    avatar: '/images/avatars/male1.jpg'
                  };
                  sessionStorage.setItem('cp_dev_mock_user', JSON.stringify(user));
                  window.location.hash = '#/student';
                  window.location.reload();
                }}
                className="flex-1 py-1.5 px-2 bg-white border-2 border-black font-bold text-[11px] uppercase hover:bg-pastel-yellow shadow-[1px_1px_0px_0px_#000]"
              >
                Student
              </button>
              <button
                type="button"
                id="dev-login-organizer"
                onClick={() => {
                  const user = {
                    id: 'organizer-dev',
                    email: 'organizer@campus.edu',
                    name: 'Taylor Club Rep',
                    role: 'club_admin',
                    clubId: 'club-tech',
                    avatar: '/images/avatars/female1.jpg'
                  };
                  sessionStorage.setItem('cp_dev_mock_user', JSON.stringify(user));
                  window.location.hash = '#/organizer';
                  window.location.reload();
                }}
                className="flex-1 py-1.5 px-2 bg-pastel-yellow border-2 border-black font-bold text-[11px] uppercase hover:bg-yellow-300 shadow-[1px_1px_0px_0px_#000]"
              >
                Organizer
              </button>
              <button
                type="button"
                id="dev-login-admin"
                onClick={() => {
                  const user = {
                    id: 'admin-dev',
                    email: 'admin@campus.edu',
                    name: 'Admin Jordan',
                    role: 'admin',
                    avatar: '/images/avatars/male2.jpg'
                  };
                  sessionStorage.setItem('cp_dev_mock_user', JSON.stringify(user));
                  window.location.hash = '#/admin';
                  window.location.reload();
                }}
                className="flex-1 py-1.5 px-2 bg-pastel-mint border-2 border-black font-bold text-[11px] uppercase hover:bg-green-300 shadow-[1px_1px_0px_0px_#000]"
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;
