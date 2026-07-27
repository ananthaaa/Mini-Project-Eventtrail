import React, { useContext } from 'react';
import { RoleContext } from '../context/RoleContext';
import { RsvpContext } from '../context/RsvpContext';
import PageShell from '../components/layout/PageShell';
import RSVPTicket from '../components/ui/RSVPTicket';
import Badge from '../components/ui/Badge';
import { BookOpen } from 'lucide-react';

const StudentProfile = () => {
  const { currentUser } = useContext(RoleContext);
  const { userRsvps, events } = useContext(RsvpContext);

  // Find actual event details for user's RSVPs
  const myTickets = Object.entries(userRsvps).map(([eventId, rsvpInfo]) => {
    const event = events.find(e => e.id === eventId);
    return { event, ...rsvpInfo };
  });

  return (
    <PageShell useGridPattern={false}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <div className="bg-pastel-peach border-3 border-black p-8 neo-shadow-lg flex flex-col md:flex-row items-center gap-6">
          {currentUser?.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-32 h-32 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_#000] object-cover bg-white shrink-0"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_#000] bg-white flex items-center justify-center shrink-0">
              <BookOpen size={40} className="text-black" />
            </div>
          )}
          
          <div className="text-center md:text-left flex-grow">
            <h1 className="text-4xl md:text-5xl font-display font-black text-black uppercase mb-3">
              {currentUser?.name || 'Alex Student'}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge variant="mint" className="shadow-[2px_2px_0px_0px_#000]">Computer Science</Badge>
              <Badge variant="yellow" className="shadow-[2px_2px_0px_0px_#000]">Class of 2026</Badge>
              <Badge variant="white" className="shadow-[2px_2px_0px_0px_#000]">{currentUser?.email || 'student@campus.edu'}</Badge>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white border-3 border-black p-6 md:p-8 neo-shadow">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-3 border-black">
            <h2 className="text-2xl md:text-3xl font-display font-black text-black uppercase tracking-tight m-0">
              My Tickets & RSVPs
            </h2>
            <Badge variant="dark" className="text-base px-4 shadow-[2px_2px_0px_0px_#FFDB58]">
              {myTickets.length} Total
            </Badge>
          </div>

          {myTickets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myTickets.map((ticket, index) => (
                <RSVPTicket 
                  key={index}
                  event={ticket.event} 
                  rsvpStatus={ticket.rsvpStatus} 
                  ticketNumber={ticket.ticketNumber} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-bg-neobrutalist border-3 border-black border-dashed">
              <div className="w-16 h-16 bg-white border-3 border-black flex items-center justify-center mx-auto mb-4 rotate-3 shadow-[2px_2px_0px_0px_#000]">
                <BookOpen size={32} />
              </div>
              <p className="font-bold text-lg text-black uppercase tracking-wide">You haven't RSVP'd to any events yet.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default StudentProfile;
