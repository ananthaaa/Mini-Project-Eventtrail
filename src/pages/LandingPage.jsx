import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { RsvpContext } from '../context/RsvpContext';
import { Calendar, MapPin, Compass, ArrowRight, ShieldCheck, Star, Users } from 'lucide-react';

const LandingPage = () => {
  const { events } = useContext(RsvpContext);
  const navigate = useNavigate();

  // Show top 3 events
  const featuredEvents = events.slice(0, 3);

  const featureTrio = [
    {
      title: "01 / Discover",
      desc: "Find events across all faculties. Filter by category, date, or faculty council easily.",
      icon: <Compass className="w-8 h-8 text-black" />,
      bg: "mint"
    },
    {
      title: "02 / RSVP Securely",
      desc: "Lock in your seat instantly. Dynamic capacity meters let you know if you are on the list or waitlist.",
      icon: <Calendar className="w-8 h-8 text-black" />,
      bg: "peach"
    },
    {
      title: "03 / Navigate Indoor",
      desc: "Arrive stress-free. Transition from outdoor GPS walking directions to inline SVG waypoint floor plans.",
      icon: <MapPin className="w-8 h-8 text-black" />,
      bg: "yellow"
    }
  ];

  return (
    <PageShell>
      {/* Header/Nav equivalent for Landing Page */}
      <div className="flex justify-between items-center mb-8 bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center gap-3">
          <div className="bg-accent-yellow border-2 border-black w-10 h-10 flex items-center justify-center font-display font-black text-xl shadow-[2px_2px_0px_0px_#000]">
            ET
          </div>
          <span className="font-display font-black text-2xl tracking-tight uppercase">
            Event<span className="text-accent-yellow drop-shadow-[1px_1px_0px_#000]">Trail</span>
          </span>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/login')} variant="outline" className="px-6">
            Log In
          </Button>
          <Button onClick={() => navigate('/signup')} variant="primary" className="px-6 hidden sm:block">
            Get Started
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center py-12 md:py-20 border-b-3 border-black bg-white neo-shadow-lg relative overflow-hidden neo-border px-6 mb-16">
        <div className="absolute top-4 left-4 rotate-[-6deg] hidden sm:block">
          <Badge variant="yellow">Welcome to Event Trail</Badge>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tighter leading-none mb-6">
          Your Campus Life,<br />
          <span className="bg-pastel-mint px-4 border-3 border-black inline-block rotate-[-2deg] my-2">
            Amplified
          </span>
        </h1>
        
        <p className="font-display font-bold text-lg md:text-xl text-black/70 max-w-2xl mx-auto mb-10 tracking-tight">
          Discover live campus happenings, book your tickets instantly, and get guided right to your seat with dual-phase indoor wayfinding.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            onClick={() => navigate('/signup')}
            variant="primary"
            className="w-full sm:w-auto text-base py-4 px-8"
          >
            Create Free Account
            <ArrowRight size={18} />
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="secondary"
            className="w-full sm:w-auto text-base py-4 px-8 bg-pastel-peach"
          >
            Sign In to Dashboard
          </Button>
        </div>

        {/* Hero Mini Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t-3 border-black pt-10">
          <div className="flex flex-col items-center">
            <span className="font-display font-black text-3xl md:text-4xl text-black">15+</span>
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Faculties</span>
          </div>
          <div className="flex flex-col items-center border-l-2 md:border-l-3 border-black">
            <span className="font-display font-black text-3xl md:text-4xl text-black">50+</span>
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Active Clubs</span>
          </div>
          <div className="flex flex-col items-center border-l-2 md:border-l-3 border-black">
            <span className="font-display font-black text-3xl md:text-4xl text-black">100%</span>
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Indoor Guided</span>
          </div>
          <div className="flex flex-col items-center border-l-2 md:border-l-3 border-black">
            <span className="font-display font-black text-3xl md:text-4xl text-black">15k+</span>
            <span className="text-xs font-bold uppercase tracking-wider text-black/60">Seat RSVPs</span>
          </div>
        </div>
      </div>

      {/* Feature Trio Section */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <Badge variant="mint" className="mb-3">How it works</Badge>
          <h2 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight">
            End-To-End Student Flow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featureTrio.map((feat, idx) => (
            <Card
              key={idx}
              variant={feat.bg}
              shadowSize="medium"
              hoverEffect={false}
              className="p-8 flex flex-col justify-between h-72"
            >
              <div className="bg-white p-3 border-3 border-black w-fit mb-6 shadow-[2px_2px_0px_0px_#000]">
                {feat.icon}
              </div>
              <div>
                <h3 className="font-display font-black text-xl uppercase mb-3">
                  {feat.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-black/80">
                  {feat.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer Area */}
      <div className="border-t-3 border-black py-8 mt-12 text-center flex flex-col items-center gap-4 bg-white neo-shadow-sm border-3 border-black mb-8 p-8">
        <div className="bg-accent-yellow border-2 border-black w-12 h-12 flex items-center justify-center font-display font-black text-2xl shadow-[2px_2px_0px_0px_#000]">
          ET
        </div>
        <p className="font-display font-bold uppercase text-sm text-black/60">
          © 2026 Event Trail. All rights reserved.
        </p>
      </div>
    </PageShell>
  );
};

export default LandingPage;
