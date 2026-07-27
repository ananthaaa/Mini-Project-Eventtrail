import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { RsvpContext } from '../context/RsvpContext';
import { Calendar, MapPin, Compass, ArrowRight, ShieldCheck, Star, Users } from 'lucide-react';

const Home = () => {
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
      {/* Hero Section */}
      <div className="text-center py-12 md:py-20 border-b-3 border-black bg-white neo-shadow-lg relative overflow-hidden neo-border px-6 mb-16">
        <div className="absolute top-4 left-4 rotate-[-6deg] hidden sm:block">
          <Badge variant="accent">New Version 2.0</Badge>
        </div>
        <div className="absolute top-6 right-6 rotate-[8deg] hidden sm:block">
          <Badge variant="peach">Reference Build</Badge>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tighter leading-none mb-6">
          Campus Events,<br />
          <span className="bg-accent-yellow px-4 border-3 border-black inline-block rotate-[-2deg] my-2">
            Minus the Chaos
          </span>
        </h1>
        
        <p className="font-display font-bold text-lg md:text-xl text-black/70 max-w-2xl mx-auto mb-10 tracking-tight">
          Discover live campus happenings, book your tickets instantly, and get guided right to your seat with dual-phase indoor wayfinding.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            onClick={() => navigate('/discover')}
            variant="primary"
            className="w-full sm:w-auto text-base py-4 px-8"
          >
            Explore Live Events
            <ArrowRight size={18} />
          </Button>
          <Button
            onClick={() => navigate('/clubs')}
            variant="secondary"
            className="w-full sm:w-auto text-base py-4 px-8"
          >
            Browse Clubs
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

      {/* Featured Events List */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
          <div>
            <Badge variant="peach" className="mb-3">Happening soon</Badge>
            <h2 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight">
              Featured Events
            </h2>
          </div>
          <Button
            onClick={() => navigate('/discover')}
            variant="outline"
            className="group"
          >
            See All Events
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredEvents.map((evt) => (
            <Card
              key={evt.id}
              onClick={() => navigate(`/event/${evt.id}`)}
              variant="white"
              shadowSize="medium"
              className="flex flex-col h-full cursor-pointer"
            >
              {/* Event Cover Image */}
              <div className="h-48 border-b-3 border-black overflow-hidden relative">
                <img
                  src={evt.coverImage}
                  alt={evt.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <Badge
                  variant={evt.category === 'Tech' ? 'mint' : evt.category === 'Sports' ? 'peach' : 'yellow'}
                  className="absolute top-3 left-3 shadow-[1px_1px_0px_0px_#000]"
                >
                  {evt.category}
                </Badge>
              </div>

              {/* Event Content */}
              <div className="p-6 flex flex-col justify-between grow">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 mb-2">
                    <span>{evt.date}</span>
                    <span>•</span>
                    <span>{evt.faculty}</span>
                  </div>
                  <h3 className="font-display font-black text-lg uppercase leading-tight mb-3 hover:text-accent-yellow transition-colors line-clamp-2">
                    {evt.title}
                  </h3>
                  <p className="text-xs font-semibold text-black/70 mb-4 line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <div className="border-t-2 border-black/10 pt-4 mt-auto flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black/80">
                    {evt.organizerName}
                  </span>
                  
                  {evt.seatsAvailable > 0 ? (
                    <Badge variant="mint">
                      {evt.seatsAvailable} seats left
                    </Badge>
                  ) : (
                    <Badge variant="dark">
                      Waitlisted
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default Home;
