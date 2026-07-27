import React, { useContext, useState } from 'react';
import { RoleContext } from '../context/RoleContext';
import { RsvpContext } from '../context/RsvpContext';
import PageShell from '../components/layout/PageShell';
import RSVPTicket from '../components/ui/RSVPTicket';
import Badge from '../components/ui/Badge';
import { BookOpen, ShieldCheck, Key } from 'lucide-react';

const StudentProfile = () => {
  const { currentUser, testWhoAmI } = useContext(RoleContext);
  const { userRsvps, events } = useContext(RsvpContext);
  const [jwtStatus, setJwtStatus] = useState('');

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
              <Badge variant={currentUser?.token ? "mint" : "dark"} className="shadow-[2px_2px_0px_0px_#000]">
                {currentUser?.token ? "Cognito Verified" : "Offline Demo"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Cognito Auth & JWT Authorizer Test Section */}
        <div className="bg-white border-3 border-black p-6 md:p-8 neo-shadow">
          <div className="flex items-center justify-between mb-4 pb-4 border-b-3 border-black">
            <h2 className="text-xl md:text-2xl font-display font-black text-black uppercase tracking-tight m-0 flex items-center gap-2">
              <ShieldCheck size={24} className="text-accent" />
              Cognito JWT Verification
            </h2>
            <Badge variant={currentUser?.token ? "mint" : "yellow"} className="shadow-[2px_2px_0px_0px_#000]">
              {currentUser?.token ? "Session Active" : "Mock / Offline Mode"}
            </Badge>
          </div>
          <p className="font-bold text-sm text-black/70 mb-4">
            Verify your live AWS Cognito ID Token against the API Gateway HTTP API JWT Authorizer by calling the protected <code className="bg-bg-surface px-2 py-1 border border-black font-mono">/whoami</code> route.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={async () => {
                try {
                  setJwtStatus('Verifying token against AWS API Gateway...');
                  const res = await testWhoAmI();
                  setJwtStatus(JSON.stringify(res, null, 2));
                } catch (err) {
                  setJwtStatus('Error: ' + err.message + '\n(Make sure you logged in with real Cognito credentials to obtain an ID token!)');
                }
              }}
              className="bg-pastel-yellow hover:bg-pastel-mint border-3 border-black px-6 py-3 font-display font-black text-sm uppercase neo-shadow-sm transition-colors flex items-center gap-2"
            >
              <Key size={16} />
              Test /whoami Route
            </button>
            {currentUser?.token && (
              <span className="font-mono text-xs text-black/60 truncate max-w-xs">
                Token: {currentUser.token.substring(0, 24)}...
              </span>
            )}
          </div>
          {jwtStatus && (
            <pre className="mt-4 p-4 bg-bg-neobrutalist border-3 border-black font-mono text-xs overflow-x-auto text-black shadow-[2px_2px_0px_0px_#000] whitespace-pre-wrap">
              {jwtStatus}
            </pre>
          )}
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
