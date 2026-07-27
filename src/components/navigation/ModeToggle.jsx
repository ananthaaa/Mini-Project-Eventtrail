import React from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { Map, Route, Navigation, Sparkles } from 'lucide-react';

const MODES = [
  { id: '2d-map', label: '2D Map', icon: Map, color: 'bg-primary-yellow' },
  { id: 'route-overview', label: 'Overview', icon: Route, color: 'bg-secondary-mint' },
  { id: 'turn-by-turn', label: 'Turn-by-Turn', icon: Navigation, color: 'bg-tertiary-peach' },
  { id: 'ar-simulation', label: 'AR Sim', icon: Sparkles, color: 'bg-[#00f5d4]' },
];

export function ModeToggle() {
  const viewMode = useNavigationStore((s) => s.viewMode);
  const setViewMode = useNavigationStore((s) => s.setViewMode);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000]">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition-transform active:translate-x-0.5 active:translate-y-0.5 border-2 border-black ${
              isActive
                ? `${mode.color} shadow-[2px_2px_0px_0px_#000] translate-x-0 translate-y-0 text-black`
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-none'
            }`}
          >
            <Icon className="w-4 h-4 text-black stroke-[2.5]" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
