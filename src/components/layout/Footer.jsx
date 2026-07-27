import React, { useState } from 'react';
import Marquee from '../ui/Marquee';
import Button from '../ui/Button';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const footerMarqueeItems = [
    "Discover Live Events",
    "RSVP Instantly",
    "Indoor Navigation Active",
    "Campus Club Showcases",
    "Tech · Arts · Sports · Academic",
    "Never Get Lost On Campus"
  ];

  return (
    <footer className="bg-black text-white border-t-3 border-black w-full select-none">
      {/* Footer Marquee */}
      <Marquee items={footerMarqueeItems} speed="normal" bgClass="bg-accent-yellow text-black py-4 border-b-3 border-black" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Newsletter block */}
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight uppercase mb-4 text-white">
              Stay in the loop
            </h3>
            <p className="text-white/60 text-sm max-w-md mb-6 font-medium">
              Subscribe to get notified about the hottest hackathons, workshops, events, and campus showcases.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR.EMAIL@CAMPUS.EDU"
              className="bg-white text-black border-3 border-white py-3 px-4 outline-none font-display font-bold text-xs uppercase tracking-wider placeholder:text-black/40 grow focus:border-accent-yellow"
              required
            />
            <Button
              type="submit"
              variant="primary"
              className="sm:w-auto"
            >
              {subscribed ? "Subscribed!" : "Subscribe"}
            </Button>
          </form>
        </div>

        {/* Links and Contact */}
        <div className="grid grid-cols-2 gap-8 lg:justify-items-end">
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-wider mb-4 text-accent-yellow">
              Explore
            </h4>
            <ul className="space-y-2 font-medium text-sm text-white/60">
              <li><a href="#/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#/discover" className="hover:text-white transition-colors">Find Events</a></li>
              <li><a href="#/clubs" className="hover:text-white transition-colors">Campus Clubs</a></li>
              <li><a href="#/navigate" className="hover:text-white transition-colors">Campus Map</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-black text-sm uppercase tracking-wider mb-4 text-accent-yellow">
              Resources
            </h4>
            <ul className="space-y-2 font-medium text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Student Help Desk</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Venue Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Admin Manual</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer API</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Giant Wordmark */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 overflow-hidden select-none pointer-events-none opacity-5 border-t border-white/10 pt-4">
        <h1 className="font-display font-black text-center text-[7vw] tracking-tighter uppercase whitespace-nowrap leading-none">
          EVENTTRAIL
        </h1>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 bg-neutral-950/80 py-6 text-center text-xs font-semibold text-white/40 tracking-wider">
        &copy; {new Date().getFullYear()} EVENTTRAIL. BUILT IN DIDASKO ESTHETIC. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
};

export default Footer;
