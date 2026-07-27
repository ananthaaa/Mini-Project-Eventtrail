import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { Navigation, ChevronUp, ChevronDown, CheckCircle2, CornerUpLeft, CornerUpRight, ArrowUp } from 'lucide-react';

export function TurnByTurnPanel() {
  const routeData = useNavigationStore((s) => s.routeData);
  const destination = useNavigationStore((s) => s.destination);
  const [expanded, setExpanded] = useState(false);

  if (!routeData || !routeData.steps || routeData.steps.length === 0) {
    return (
      <div className="p-3 bg-primary-yellow border-2 border-black shadow-[4px_4px_0px_0px_#000] font-bold text-sm uppercase tracking-wide flex items-center gap-2">
        <Navigation className="w-5 h-5 animate-spin" />
        <span>Calculating campus route...</span>
      </div>
    );
  }

  const currentStep = routeData.steps[0] || {};
  const totalDistance = routeData.distance || 0;
  const etaMinutes = Math.max(1, Math.round(totalDistance / 80)); // ~80m per minute walking speed

  const getTurnIcon = (turn, isFinal) => {
    if (isFinal) return <CheckCircle2 className="w-5 h-5 text-black" />;
    if (turn === 'left') return <CornerUpLeft className="w-5 h-5 text-black" />;
    if (turn === 'right') return <CornerUpRight className="w-5 h-5 text-black" />;
    return <ArrowUp className="w-5 h-5 text-black" />;
  };

  return (
    <div className="w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
      {/* Top Banner / Current Instruction */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-3 bg-primary-yellow border-b-2 border-black flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center">
            {getTurnIcon(currentStep.turn, currentStep.isFinal)}
          </div>
          <div>
            <div className="font-black text-sm text-black uppercase tracking-wide leading-tight">
              {currentStep.instruction || 'Follow walkway'}
            </div>
            <div className="font-bold text-xs text-gray-800">
              {destination?.name ? `To ${destination.name}` : 'Campus Navigation'} • {totalDistance}m ({etaMinutes} min walk)
            </div>
          </div>
        </div>
        <button className="p-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          {expanded ? <ChevronDown className="w-4 h-4 text-black" /> : <ChevronUp className="w-4 h-4 text-black" />}
        </button>
      </div>

      {/* Expanded Step List */}
      {expanded && (
        <div className="max-h-60 overflow-y-auto p-2 space-y-2 bg-secondary-mint/20">
          <div className="font-bold text-xs uppercase text-gray-700 px-1">Route Steps:</div>
          {routeData.steps.map((step, idx) => (
            <div 
              key={step.id || idx}
              className={`p-2 rounded border-2 border-black flex items-center justify-between text-xs font-bold ${
                idx === 0 ? 'bg-secondary-mint shadow-[2px_2px_0px_0px_#000]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <span>{step.instruction}</span>
              </div>
              {step.distance > 0 && (
                <span className="px-1.5 py-0.5 bg-tertiary-peach border border-black rounded text-[10px]">
                  {step.distance}m
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
