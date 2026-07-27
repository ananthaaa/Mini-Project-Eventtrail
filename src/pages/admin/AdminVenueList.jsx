import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Badge from '../../components/ui/Badge';
import { RsvpContext } from '../../context/RsvpContext';
import { Map, Plus, Trash2, Edit2 } from 'lucide-react';

const AdminVenueList = () => {
  const { venues, deleteVenue } = useContext(RsvpContext);
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="mb-10 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="blue" className="mb-3">Venue Management</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Venues
          </h1>
        </div>
        <div>
          <button
            onClick={() => navigate('/admin/venue-upload')}
            className="bg-pastel-peach border-3 border-black text-black px-6 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} strokeWidth={3} />
            Add Venue
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map(venue => (
          <div key={venue.id} className="border-4 border-black bg-white p-6 shadow-neobrutalist flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-pastel-blue border-2 border-black rounded-full">
                <Map size={24} className="text-accent-blue" />
              </div>
              <Badge variant="dark">{venue.distance}</Badge>
            </div>
            <h3 className="font-display font-black text-2xl uppercase mb-1">{venue.name}</h3>
            <p className="font-bold text-gray-500 mb-6">{venue.building}</p>
            
            <div className="mt-auto flex gap-3 pt-4 border-t-2 border-black/10">
              <button 
                onClick={() => alert('Edit flow not implemented in mock')}
                className="flex-1 py-2 px-4 border-2 border-black font-bold uppercase hover:bg-gray-100 transition-colors flex justify-center items-center gap-2"
              >
                <Edit2 size={16} /> Edit
              </button>
              <button 
                onClick={() => {
                  if(window.confirm(`Delete venue ${venue.name}?`)) {
                    deleteVenue(venue.id);
                  }
                }}
                className="py-2 px-4 border-2 border-black bg-red-100 text-red-600 font-bold uppercase hover:bg-red-500 hover:text-white transition-colors flex justify-center items-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {venues.length === 0 && (
          <div className="col-span-full p-12 text-center border-4 border-black border-dashed bg-gray-50">
            <h3 className="font-display font-black text-2xl uppercase text-gray-400">No Venues Found</h3>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AdminVenueList;
