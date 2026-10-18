import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { RsvpContext } from '../context/RsvpContext';
import { Calendar, MapPin, Compass, ArrowRight, ShieldCheck, Star, Users, Building2, Navigation, Layers, CheckCircle, ExternalLink } from 'lucide-react';
import CampusMap, { Marker } from '../components/ui/CampusMap';
import RouteLayer from '../components/ui/RouteLayer';
import CampusBuildingMarkers from '../components/ui/CampusBuildingMarkers';
import { BUILDING_INFO } from '../data/buildings';
import logoImg from '../assets/logo.png';

const CANONICAL_PATH = [
  'gate-main',
  '13998069845',
  '13998069856',
  '13998065967',
  '13998056174',
  '13998056173',
  '14008132989',
  '13998078223',
  '13998078224',
  'entrance-cs-block'
];

const LandingPage = () => {
  const { events } = useContext(RsvpContext);
  const navigate = useNavigate();
  const [selectedBuilding, setSelectedBuilding] = useState(BUILDING_INFO['entrance-cs-block']);

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
        <Link to="/" className="flex items-center group">
          <img
            src={logoImg}
            alt="EventTrail"
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-1 select-none"
          />
        </Link>
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

      {/* ── Interactive 3D Campus Map Section (Main Landing Page) ── */}
      <div className="mb-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 bg-[#FFEB3B] border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
            <Navigation className="w-4 h-4 text-black" strokeWidth={3} />
            <span className="font-display font-black text-xs uppercase tracking-wider text-black">
              ASIET Live Campus Navigator
            </span>
          </div>
          <h2 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tight text-black mb-3">
            Interactive 3D Campus Map
          </h2>
          <p className="font-bold text-black/70 text-sm md:text-base max-w-2xl mx-auto">
            Explore verified 3D campus buildings, academic blocks, labs, and paved pedestrian road paths. Click any building marker to inspect facilities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Viewport */}
          <div className="lg:col-span-2 bg-white border-3 border-black neo-shadow-lg flex flex-col overflow-hidden">
            <div className="h-[520px] w-full relative z-0">
              <CampusMap center={[76.4302, 10.1780]} zoom={17.8} initialPitch={55} initialBearing={-25}>
                {/* Verified A* Walking Route from Main Gate to CS Block */}
                <RouteLayer path={CANONICAL_PATH} showBridgePoints={false} />

                {/* Same Canonical Campus Building Name Markers */}
                <CampusBuildingMarkers
                  onBuildingClick={(nodeId) => {
                    const info = BUILDING_INFO[nodeId];
                    if (info) setSelectedBuilding(info);
                  }}
                  activeBuildingId={selectedBuilding?.nodeId}
                />

                {/* Green START Marker at Main Gate */}
                <Marker longitude={76.4291012} latitude={10.177813} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#00B67A] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      START
                    </div>
                    <div className="w-5 h-5 bg-[#00B67A] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-bounce" />
                  </div>
                </Marker>

                {/* Orange DEST Marker at CS Block */}
                <Marker longitude={76.43053197142856} latitude={10.178252304761903} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      DEST
                    </div>
                    <div className="w-5 h-5 bg-[#FF5A1F] border-3 border-black rounded-none shadow-[2px_2px_0px_0px_#000]" />
                  </div>
                </Marker>
              </CampusMap>
            </div>

            {/* Map Legend Bar matching FullCampusMap style */}
            <div className="bg-white border-t-3 border-black p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-black uppercase tracking-wider">
              <div className="flex flex-wrap items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#00B67A] border-2 border-black inline-block"></span>
                  <span>Start</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#FF5A1F] border-2 border-black inline-block"></span>
                  <span>Destination</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-accent-yellow border-2 border-black rounded-full inline-block"></span>
                  <span>Bridge Point</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-1.5 bg-[#FF5A1F] border border-black inline-block"></span>
                  <span>A* Route</span>
                </span>
              </div>
              <span className="text-black/60 font-bold">164m • 3 mins walk</span>
            </div>
          </div>

          {/* Interactive Building Details Spotlight */}
          <div className="bg-white border-3 border-black p-6 neo-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-3 border-black pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-black" strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-wider text-black/60">Selected Building</span>
                </div>
                {selectedBuilding?.tag && (
                  <span
                    className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]"
                    style={{ backgroundColor: selectedBuilding.color || '#DAF5F0' }}
                  >
                    {selectedBuilding.tag}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-display font-black text-2xl uppercase text-black leading-tight">
                  {selectedBuilding?.label || 'Select a building'}
                </h3>
                <p className="text-xs font-bold uppercase text-black/60 mt-1">
                  {selectedBuilding?.subtitle || 'Campus Facility'}
                </p>
              </div>

              <p className="text-xs font-bold text-gray-700 leading-relaxed border-l-3 border-black pl-3 py-1 bg-yellow-50/50">
                {selectedBuilding?.description || 'Click any building label on the 3D map to view academic departments and facilities.'}
              </p>

              {/* Departments */}
              {selectedBuilding?.departments && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1.5">
                    Departments & Wings
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBuilding.departments.map((dept) => (
                      <span key={dept} className="text-[10px] font-black bg-pastel-yellow border border-black px-2 py-0.5 uppercase shadow-[1px_1px_0px_0px_#000]">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities */}
              {selectedBuilding?.facilities && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1.5">
                    Building Facilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBuilding.facilities.map((fac) => (
                      <span key={fac} className="text-[10px] font-black bg-pastel-mint border border-black px-2 py-0.5 uppercase shadow-[1px_1px_0px_0px_#000]">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t-2 border-black/20 space-y-3 mt-4">
              <button
                onClick={() => navigate(`/student/campus-map?dest=${selectedBuilding?.nodeId || 'entrance-cs-block'}`)}
                className="w-full bg-accent-yellow border-3 border-black text-black font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Navigation className="w-4 h-4" strokeWidth={3} />
                Find Walking Route
              </button>
              <Link
                to="/student/campus-map"
                className="w-full bg-white border-2 border-black text-black font-black uppercase tracking-wider py-2 text-center text-xs block hover:bg-black hover:text-white transition-colors"
              >
                View Full Campus Navigator →
              </Link>
            </div>
          </div>
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
