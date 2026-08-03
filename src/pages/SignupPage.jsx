import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleContext } from '../context/RoleContext';
import { User, Mail, Lock, Hash, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const SignupPage = () => {
  const { signup, confirmSignup } = useContext(RoleContext);
  const navigate = useNavigate();

  const [step, setStep] = useState('signup'); // 'signup' | 'confirm'
  const [form, setForm] = useState({ name: '', email: '', password: '', studentId: '', gender: '' });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [cognitoUsername, setCognitoUsername] = useState(''); // generated username from Cognito (not email)
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Required';
    else if (form.password.length < 8) errs.password = 'Min 8 chars';
    if (!form.studentId.trim()) errs.studentId = 'Required';
    if (!form.gender) errs.gender = 'Required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        studentId: form.studentId,
        gender: form.gender,
        role: 'student',
      });
      if (res.needsConfirmation) {
        setCognitoUsername(res.username || ''); // store the generated Cognito username for OTP confirmation
        setStep('confirm');
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      console.error('Cognito sign up error:', err);
      if (err.code === 'UsernameExistsException' || err.name === 'UsernameExistsException') {
        setErrors({ email: 'An account with this email already exists.' });
      } else {
        setErrors({ general: err.message || 'Failed to sign up.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!confirmationCode) {
      setErrors({ confirm: 'Please enter the verification code.' });
      return;
    }
    setLoading(true);
    try {
      await confirmSignup(cognitoUsername, confirmationCode);
      // Auto login after confirmation uses email (Cognito alias)
      await login(form.email, form.password);
      navigate('/student', { replace: true });
    } catch (err) {
      console.error('Confirmation error:', err);
      setErrors({ confirm: err.message || 'Invalid verification code.' });
    } finally {
      setLoading(false);
    }
  };



  const inputClass = (field) => 
    `w-full border-3 ${errors[field] ? 'border-red-500 bg-red-50' : 'border-black'} p-3 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors placeholder:text-black/40`;

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Alex Johnson' },
    { key: 'email', label: 'Campus Email', type: 'email', icon: Mail, placeholder: 'alex@campus.edu' },
    { key: 'studentId', label: 'Student ID', type: 'text', icon: Hash, placeholder: 'STU-2024-0001' },
  ];

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

        {step === 'signup' ? (
          <>
            <h1 className="font-display font-black text-3xl uppercase text-center mb-2">
              Create Account
            </h1>
            <p className="text-center text-sm font-bold text-black/60 mb-8 uppercase tracking-wider">
              Join thousands of students
            </p>

            {errors.general && (
              <div className="bg-pastel-peach border-3 border-black p-3 text-sm font-bold text-center text-black mb-4 neo-shadow-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {fields.map(({ key, label, type, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="block font-display font-black text-sm uppercase mb-2 flex justify-between">
                    {label}
                    {errors[key] && <span className="text-red-500">{errors[key]}</span>}
                  </label>
                  <div className="relative">
                    <Icon size={18} strokeWidth={2.5} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors[key] ? 'text-red-500' : 'text-black/40'}`} />
                    <input
                      id={`signup-${key}`}
                      type={type}
                      value={form[key]}
                      onChange={handleChange(key)}
                      placeholder={placeholder}
                      className={`${inputClass(key)} pl-10`}
                    />
                  </div>
                </div>
              ))}

              {/* Gender Selection */}
              <div>
                <label className="block font-display font-black text-sm uppercase mb-2 flex justify-between">
                  Gender
                  {errors.gender && <span className="text-red-500">{errors.gender}</span>}
                </label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center gap-2 border-3 border-black p-3 cursor-pointer hover:bg-pastel-yellow transition-colors">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={form.gender === 'male'}
                      onChange={handleChange('gender')}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="font-bold text-sm uppercase">Male</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 border-3 border-black p-3 cursor-pointer hover:bg-pastel-yellow transition-colors">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={form.gender === 'female'}
                      onChange={handleChange('gender')}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="font-bold text-sm uppercase">Female</span>
                  </label>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-display font-black text-sm uppercase mb-2 flex justify-between">
                  Password
                  {errors.password && <span className="text-red-500">{errors.password}</span>}
                </label>
                <div className="relative">
                  <Lock size={18} strokeWidth={2.5} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-500' : 'text-black/40'}`} />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="Min. 8 characters"
                    className={`${inputClass('password')} pl-10 pr-10`}
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

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full py-4 text-base mt-2 bg-pastel-mint"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} strokeWidth={3} />
                  </>
                )}
              </Button>


            </form>
          </>
        ) : (
          /* Confirmation Code Step */
          <>
            <div className="flex justify-center mb-4 text-green-600">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h1 className="font-display font-black text-2xl uppercase text-center mb-2">
              Verify Your Email
            </h1>
            <p className="text-center text-sm font-bold text-black/60 mb-6 uppercase tracking-wider">
              We sent a 6-digit confirmation code to <span className="text-black">{form.email}</span>
            </p>

            {errors.confirm && (
              <div className="bg-pastel-peach border-3 border-black p-3 text-sm font-bold text-center text-black mb-4 neo-shadow-sm">
                {errors.confirm}
              </div>
            )}

            <form onSubmit={handleConfirm} className="flex flex-col gap-5">
              <div>
                <label className="block font-display font-black text-sm uppercase mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => {
                    setConfirmationCode(e.target.value);
                    if (errors.confirm) setErrors({});
                  }}
                  placeholder="e.g. 123456"
                  className="w-full border-3 border-black p-3 font-bold text-center tracking-widest text-lg outline-none focus:bg-pastel-yellow transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full py-4 text-base bg-pastel-mint"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('signup')}
                className="text-center font-bold text-xs uppercase text-black/60 hover:text-black mt-2"
              >
                ← Back to sign up
              </button>
            </form>
          </>
        )}

        <p className="text-center mt-6 font-bold text-sm">
          <span className="text-black/60 uppercase">Already have an account? </span>
          <Link to="/login" className="text-black uppercase hover:bg-pastel-yellow px-1 transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
