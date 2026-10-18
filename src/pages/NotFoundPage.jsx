import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calendar, MapPin, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-lg w-full bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <div className="inline-block p-4 bg-[#FFEB3B] border-4 border-black rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Compass className="w-12 h-12 text-black animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h1 className="text-6xl font-black tracking-tight text-black mb-2">404</h1>
        <h2 className="text-2xl font-black uppercase text-black mb-4">Trail Lost! Page Not Found</h2>
        
        <p className="font-bold text-gray-700 text-sm leading-relaxed mb-8">
          The trail you're following seems to have ended or moved. Don't worry, you can always navigate back to campus events.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            to="/student/events"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#A3FFD6] border-2 border-black font-black uppercase text-xs rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Calendar className="w-4 h-4" />
            Explore Events
          </Link>
          <Link
            to="/student/campus-map"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFEB3B] border-2 border-black font-black uppercase text-xs rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <MapPin className="w-4 h-4" />
            Campus Map
          </Link>
        </div>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}
