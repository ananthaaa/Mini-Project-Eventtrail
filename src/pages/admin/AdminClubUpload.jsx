import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClub } from '../../services/apiService';
import { NotificationContext } from '../../context/NotificationContext';
import ImageUploadZone from '../../components/ui/ImageUploadZone';
import PageShell from '../../components/layout/PageShell';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminClubUpload() {
  const navigate = useNavigate();
  const { addNotification: showNotification } = useContext(NotificationContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    logoUrl: '',
    joinPolicy: 'open'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.category) {
        throw new Error('Name and category are required');
      }

      await createClub(formData);
      showNotification('Club created successfully!', 'success');
      navigate('/admin/clubs');
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to create club', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUploaded = (url) => {
    setFormData(prev => ({ ...prev, logoUrl: url }));
  };

  return (
    <PageShell>
      <div className="mb-6 flex">
        <Link
          to="/admin/clubs"
          className="inline-flex items-center gap-2 text-sm font-black text-black uppercase tracking-wider hover:text-accent transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Clubs
        </Link>
      </div>

      <div className="mb-12 bg-white border-3 border-black p-8 shadow-[6px_6px_0px_0px_#000] max-w-4xl">
        <h1 className="font-display font-black text-4xl text-black tracking-tight uppercase mb-2">
          Create New Club
        </h1>
        <p className="text-black/70 font-bold uppercase tracking-wider text-sm">
          Set up a new campus club to start organizing events.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-3 border-black p-8 md:p-10 max-w-4xl shadow-[6px_6px_0px_0px_#000]"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Club Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Robotics Society"
                className="w-full bg-white border-3 border-black px-4 py-3 text-black font-medium focus:outline-none focus:bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-white border-3 border-black px-4 py-3 text-black font-medium focus:outline-none focus:bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] transition-colors"
                required
              >
                <option value="">Select a category</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Literary">Literary</option>
                <option value="Social">Social</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="What is this club about?"
              className="w-full bg-white border-3 border-black px-4 py-3 text-black font-medium focus:outline-none focus:bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Join Policy</label>
            <select
              name="joinPolicy"
              value={formData.joinPolicy}
              onChange={handleChange}
              className="w-full bg-white border-3 border-black px-4 py-3 text-black font-medium focus:outline-none focus:bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] transition-colors"
            >
              <option value="open">Open (Anyone can join instantly)</option>
              <option value="approval">Approval (Requires admin approval)</option>
            </select>
          </div>

          <div>
            <ImageUploadZone 
              onUploadComplete={handleImageUploaded}
              prefix="clubs"
              label="Club Logo (Optional)"
            />
            {formData.logoUrl && (
              <div className="mt-2 text-sm font-black text-black uppercase tracking-wider bg-pastel-mint border-2 border-black inline-block px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
                Logo uploaded successfully!
              </div>
            )}
          </div>

          <div className="border-t-3 border-black pt-8 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/clubs')}
              className="bg-white border-3 border-black text-black px-8 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all flex items-center justify-center gap-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 bg-pastel-peach border-3 border-black text-black px-8 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={18} />
              {isSubmitting ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </motion.div>
    </PageShell>
  );
}
