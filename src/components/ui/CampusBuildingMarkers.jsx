import React from 'react';
import { Marker } from './CampusMap';
import { BUILDING_INFO } from '../../data/buildings';

// Canonical list of primary campus buildings with verified coordinates matching graph.json
export const CAMPUS_BUILDING_NODES = [
  {
    id: 'entrance-cs-block',
    label: 'CS Block (B.Tech Building)',
    tag: 'CS Block (B.Tech Building)',
    color: '#FFDB58',
    lat: 10.178252304761903,
    lng: 76.43053197142856,
  },
  {
    id: 'btech-block',
    label: 'B.Tech Academic Block',
    tag: 'ACADEMIC',
    color: '#DAF5F0',
    lat: 10.17748302,
    lng: 76.42947042,
  },
  {
    id: 'civil-block',
    label: 'Civil Engineering Block',
    tag: 'CIVIL',
    color: '#F8D6B3',
    lat: 10.1771865,
    lng: 76.4294852,
  },
  {
    id: 'union-cafe',
    label: 'Student Union Cafe Canteen',
    tag: 'CANTEEN',
    color: '#FDFD96',
    lat: 10.1774514,
    lng: 76.4298325,
  },
  {
    id: 'ctf-lab',
    label: 'CTF Cyber Security Lab',
    tag: 'FACILITY',
    color: '#DAF5F0',
    lat: 10.17759638,
    lng: 76.43004264,
  },
  {
    id: 'entrance-stadium',
    label: 'Campus Sports Ground',
    tag: 'SPORTS',
    color: '#DAF5F0',
    lat: 10.1777,
    lng: 76.4305,
  },
  {
    id: 'workshop-block',
    label: 'Central Workshop Smithy',
    tag: 'WORKSHOP',
    color: '#F8D6B3',
    lat: 10.17832548,
    lng: 76.4310917,
  },
  {
    id: 'mba-block',
    label: 'MBA Block',
    tag: 'MBA',
    color: '#FDFD96',
    lat: 10.17806292,
    lng: 76.43132888,
  },
  {
    id: 'mech-block',
    label: 'Mechanical Engineering Block',
    tag: 'MECH',
    color: '#F8D6B3',
    lat: 10.17783458,
    lng: 76.43125798,
  },
];

/**
 * Standardized Campus Building Markers
 * Renders consistent neobrutalist yellow/mint building tags and pins
 * matching the FullCampusMap styling exactly.
 */
export default function CampusBuildingMarkers({
  nodes = null,
  dynamicBuildingInfo = null,
  onBuildingClick = null,
  activeBuildingId = null,
  hideIds = [],
}) {
  const buildingList = React.useMemo(() => {
    if (nodes) {
      return Object.entries(nodes)
        .filter(([id, n]) => 
          (n.type === 'entrance' || n.type === 'building' || n.type === 'facility') &&
          !id.startsWith('road-') &&
          !/^\d/.test(id) &&
          !hideIds.includes(id)
        )
        .map(([id, n]) => {
          const info = (dynamicBuildingInfo && dynamicBuildingInfo[id]) || BUILDING_INFO[id] || {};
          return {
            id,
            lat: n.lat,
            lng: n.lng,
            tag: info.tag || n.label || id,
            color: info.color || '#fff',
            label: info.label || n.label || id,
          };
        });
    }

    return CAMPUS_BUILDING_NODES.filter(b => !hideIds.includes(b.id));
  }, [nodes, dynamicBuildingInfo, hideIds]);

  return (
    <>
      {buildingList.map((b) => {
        const isActive = activeBuildingId === b.id;
        return (
          <Marker
            key={b.id}
            longitude={b.lng}
            latitude={b.lat}
            anchor="bottom"
            onClick={() => onBuildingClick && onBuildingClick(b.id)}
          >
            <div
              className="flex flex-col items-center cursor-pointer group select-none transition-transform hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                if (onBuildingClick) onBuildingClick(b.id);
              }}
            >
              <div
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-0.5 text-center leading-tight transition-colors ${
                  isActive ? 'bg-accent-yellow ring-2 ring-black scale-105' : 'group-hover:bg-pastel-yellow'
                }`}
                style={{ backgroundColor: isActive ? '#FFDB58' : b.color }}
              >
                {b.tag}
              </div>
              <div className="w-3 h-3 bg-white border-2 border-black rounded-none shadow-[1px_1px_0px_0px_#000]" />
            </div>
          </Marker>
        );
      })}
    </>
  );
}
