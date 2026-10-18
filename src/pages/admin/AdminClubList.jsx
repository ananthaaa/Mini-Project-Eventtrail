import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { fetchClubs, deleteClub, createOrganizer } from '../../services/apiService';
import { Plus, Users, Trash2, UserPlus, KeyRound, CheckCircle2, Copy, Sparkles, X } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminClubList = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Organizer Modal State
  const [selectedClub, setSelectedClub] = useState(null);
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(null);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchClubs();
        if (Array.isArray(data)) {
          setClubs(data);
        } else {
          setClubs([]);
        }
      } catch (error) {
        console.error('Failed to fetch clubs:', error.message);
        setClubs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = async (clubId) => {
    if (!window.confirm('WARNING: Are you sure you want to delete this club? All associated events and members will also be permanently deleted!')) {
      return;
    }
    
    try {
      await deleteClub(clubId);
      setClubs(prev => prev.filter(c => c.id !== clubId));
    } catch (err) {
      console.error('Failed to delete club:', err);
      alert('Failed to delete club. Please check the console.');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Campus#';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenInviteModal = (club) => {
    setSelectedClub(club);
    setOrganizerName('');
    setOrganizerEmail('');
    setTempPassword(generateRandomPassword());
    setProvisionSuccess(null);
    setInviteError('');
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!organizerEmail || !organizerName || !tempPassword) {
      setInviteError('All fields are required.');
      return;
    }

    setIsProvisioning(true);
    setInviteError('');
    try {
      const res = await createOrganizer({
        clubId: selectedClub.id,
        name: organizerName.trim(),
        email: organizerEmail.trim(),
        temporaryPassword: tempPassword
      });

      setProvisionSuccess({
        clubName: selectedClub.name,
        name: organizerName,
        email: organizerEmail,
        temporaryPassword: tempPassword,
        username: res?.username || organizerEmail
      });
    } catch (err) {
      console.error('Failed to provision organizer:', err);
      setInviteError(err.message || 'Failed to create organizer account. Ensure email is unique.');
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-10 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="mint" className="mb-3">Admin Portal</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Manage Clubs & Organizers
          </h1>
          <p className="text-xs font-bold text-black/60 mt-1 uppercase tracking-wider">
            Authorize campus organizations and provision official organizer credentials
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/admin/clubs/new')}
            variant="primary"
            className="py-2.5 px-5 bg-accent-yellow text-black border-2 border-black"
          >
            <Plus size={16} />
            Create Club
          </Button>
        </div>
      </div>

      <div className="space-y-6 select-none">
        {isLoading ? (
          <div className="text-center py-20 font-display font-black text-2xl uppercase">Loading...</div>
        ) : (
          <div className="border-3 border-black bg-white neo-shadow overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 border-b border-black">Club Identity</th>
                  <th className="py-4 px-6 border-b border-black">Category</th>
                  <th className="py-4 px-6 border-b border-black text-center">Members</th>
                  <th className="py-4 px-6 border-b border-black text-center">Join Policy</th>
                  <th className="py-4 px-6 border-b border-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-display font-bold text-xs uppercase tracking-wider text-black/80">
                {clubs.map((club) => (
                  <tr key={club.id} className="border-b-2 border-black/10 hover:bg-black/5 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-4">
                      <div className="w-12 h-12 border-2 border-black shrink-0 overflow-hidden bg-pastel-yellow flex items-center justify-center font-display font-black text-lg">
                        {club.logoUrl ? (
                          <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                          club.name?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-black text-sm text-black block leading-tight">{club.name}</span>
                        <span className="text-xxs text-black/50 block mt-1 line-clamp-1 max-w-[200px]">{club.description || 'No description'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="white">
                        {club.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-black">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={12} className="text-black/50" />
                        {(club.memberIds || []).length}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-mono">
                      <Badge variant={club.joinPolicy === 'open' ? 'mint' : 'peach'}>
                        {club.joinPolicy}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenInviteModal(club)}
                          className="py-1.5 px-3 border-2 border-black bg-pastel-mint hover:bg-green-300 transition-all font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1.5"
                          title="Invite Organizer"
                        >
                          <UserPlus size={13} />
                          Invite Organizer
                        </button>
                        <button
                          onClick={() => handleDelete(club.id)}
                          className="p-2 border-2 border-black bg-red-100 hover:bg-red-500 hover:text-white transition-all neo-shadow-sm active:translate-y-[1px] inline-flex items-center gap-1"
                          title="Delete Club"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clubs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 px-6 text-center font-display font-black text-black/50">
                      No clubs created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Organizer Modal */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full neo-shadow text-left space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h3 className="font-display font-black text-xl uppercase tracking-tight text-black flex items-center gap-2">
                  <UserPlus size={20} /> Provision Organizer
                </h3>
                <span className="text-xs font-bold text-black/60 uppercase">
                  Club: {selectedClub.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedClub(null)}
                className="p-1 hover:bg-neutral-100 border border-black"
              >
                <X size={16} />
              </button>
            </div>

            {provisionSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-pastel-mint border-2 border-black shadow-[2px_2px_0px_0px_#000] text-xs font-bold text-green-950 flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-green-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase block">Account Created in Amazon Cognito!</span>
                    The organizer has been provisioned with the <code>ClubAdmin</code> security group and linked to {provisionSuccess.clubName}.
                  </div>
                </div>

                <div className="bg-neutral-50 p-4 border-2 border-black space-y-2 text-xs font-mono">
                  <div><span className="font-bold text-black/60">Email:</span> {provisionSuccess.email}</div>
                  <div><span className="font-bold text-black/60">Temporary Password:</span> <span className="font-black bg-pastel-yellow px-1">{provisionSuccess.temporaryPassword}</span></div>
                  <div><span className="font-bold text-black/60">Next Step:</span> Mandatory password reset on first sign-in</div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    const text = `Hello ${provisionSuccess.name},\n\nYou have been invited as an EventTrail Club Organizer for ${provisionSuccess.clubName}.\n\nSign in here: ${window.location.origin}/#/login\nEmail: ${provisionSuccess.email}\nTemporary Password: ${provisionSuccess.temporaryPassword}\n\nYou will be prompted to set your personal permanent password upon your first login.`;
                    navigator.clipboard.writeText(text);
                    alert('Invitation details copied to clipboard!');
                  }}
                  variant="primary"
                  className="w-full py-2.5 bg-pastel-yellow border-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} /> Copy Invitation Text
                </Button>

                <Button
                  type="button"
                  onClick={() => setSelectedClub(null)}
                  variant="secondary"
                  className="w-full py-2 bg-white border-2 border-black text-xs font-bold uppercase"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="p-2.5 bg-neutral-100 border-2 border-black text-xs font-bold text-black/70">
                  Organizer accounts are provisioned via server-side Cognito administrator controls. First sign-in requires setting a permanent password.
                </div>

                {inviteError && (
                  <div className="p-2.5 bg-red-100 border-2 border-red-500 text-xs font-bold text-red-800">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">
                    Organizer Full Name *
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="w-full border-2 border-black p-2.5 text-xs font-bold outline-none focus:bg-pastel-yellow"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">
                    Campus Email Address *
                  </label>
                  <input
                    type="email"
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="e.g. organizer@campus.edu"
                    className="w-full border-2 border-black p-2.5 text-xs font-bold outline-none focus:bg-pastel-yellow"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black uppercase tracking-wider">
                      Temporary One-Time Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setTempPassword(generateRandomPassword())}
                      className="text-[10px] font-black uppercase underline hover:text-black"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full border-2 border-black p-2.5 text-xs font-mono font-bold outline-none focus:bg-pastel-yellow"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setSelectedClub(null)}
                    className="py-2 px-3 border-2 border-black text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isProvisioning}
                    variant="primary"
                    className="py-2 px-4 bg-pastel-mint border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                  >
                    {isProvisioning ? 'Provisioning...' : 'Provision Account'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminClubList;

