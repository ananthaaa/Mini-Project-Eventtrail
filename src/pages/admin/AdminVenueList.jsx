import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Badge from '../../components/ui/Badge';
import { RsvpContext } from '../../context/RsvpContext';
import { Map, Plus, Trash2, Edit2 } from 'lucide-react';

const AdminVenueList = () => {
  const { venues, deleteVenue, events } = useContext(RsvpContext);
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="mb-10 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="blue" className="mb-3">Campus Infrastructure</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Buildings & Venues
          </h1>
          <p className="text-black/70 font-bold mt-2">
            Manage campus buildings and venues. Additions and deletions automatically reflect live on the Student Campus Map.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/admin/venue-upload')}
            className="bg-pastel-peach border-3 border-black text-black px-6 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} strokeWidth={3} />
            Add Building / Venue
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map(venue => (
          <div key={venue.id} className="border-4 border-black bg-white p-6 shadow-neobrutalist flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-pastel-yellow border-2 border-black">
                  <Map size={24} className="text-black" />
                </div>
                <span className="text-[10px] font-black uppercase bg-pastel-mint border-2 border-black px-2 py-0.5 shadow-[1px_1px_0px_0px_#000]">
                  {venue.category || 'Campus'}
                </span>
              </div>
              <h3 className="font-display font-black text-2xl uppercase mb-1 leading-tight">{venue.name || venue.building}</h3>
              <p className="font-bold text-gray-600 text-sm mb-4">{venue.description || venue.building}</p>
              
              {venue.lat && venue.lng && (
                <div className="text-[11px] font-mono text-black/60 mb-4 bg-gray-50 p-2 border border-black/20">
                  Pin: {venue.lat.toFixed(5)}, {venue.lng.toFixed(5)}
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t-2 border-black/10 flex flex-col gap-2">
              <Link
                to={`/student/campus-map?dest=${venue.nodeId || venue.id}`}
                className="w-full py-2 px-3 border-2 border-black bg-pastel-mint text-black font-black uppercase text-xs tracking-wider text-center shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 transition-all"
              >
                View on Student Map →
              </Link>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete building "${venue.name || venue.building}"?`)) {
                      try {
                        deleteVenue(venue.id);
                      } catch (err) {
                        alert(err.message || 'Cannot delete venue.');
                      }
                    }
                  }}
                  className="w-full py-2 px-4 border-2 border-black bg-red-100 text-red-600 font-bold uppercase text-xs hover:bg-red-500 hover:text-white transition-colors flex justify-center items-center gap-1.5 shadow-[2px_2px_0px_0px_#000]"
                >
                  <Trash2 size={14} /> Remove Building
                </button>
              </div>
            </div>
          </div>
        ))}

        {venues.length === 0 && (
          <div className="col-span-full p-12 text-center border-4 border-black border-dashed bg-gray-50">
            <h3 className="font-display font-black text-2xl uppercase text-gray-400">No Buildings / Venues Configured</h3>
            <p className="text-sm font-bold text-gray-400 mt-2">Click "Add Building / Venue" above to place a new building on the campus map.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AdminVenueList;
