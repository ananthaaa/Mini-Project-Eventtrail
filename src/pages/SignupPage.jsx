import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleContext } from '../context/RoleContext';
import { Zap, User, Mail, Lock, Hash, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';

const SignupPage = () => {
  const { signup } = useContext(RoleContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', studentId: '' });
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
    else if (form.password.length < 6) errs.password = 'Min 6 chars';
    if (!form.studentId.trim()) errs.studentId = 'Required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    // Simulate async signup
    await new Promise(r => setTimeout(r, 800));
    signup({ name: form.name, email: form.email, studentId: form.studentId });
    navigate('/student', { replace: true });
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

        <h1 className="font-display font-black text-3xl uppercase text-center mb-2">
          Create Account
        </h1>
        <p className="text-center text-sm font-bold text-black/60 mb-8 uppercase tracking-wider">
          Join thousands of students
        </p>

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
                placeholder="Min. 6 characters"
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
            className="w-full py-4 text-base mt-4 bg-pastel-mint"
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
