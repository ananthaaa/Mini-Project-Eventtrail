import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { fetchClubs, deleteClub } from '../../services/apiService';
import { Plus, Users, Trash2 } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const AdminClubList = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <PageShell>
      <div className="mb-10 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="mint" className="mb-3">Admin Portal</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Manage Clubs
          </h1>
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
                      <button
                        onClick={() => handleDelete(club.id)}
                        className="p-2 border-2 border-black bg-red-100 hover:bg-red-500 hover:text-white transition-all neo-shadow-sm active:translate-y-[1px] active:neo-shadow-sm inline-flex items-center gap-1"
                        title="Delete Club"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
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
    </PageShell>
  );
};

export default AdminClubList;
