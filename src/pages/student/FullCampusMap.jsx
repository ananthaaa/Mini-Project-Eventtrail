import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate as useRNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import CampusMap, { Marker, Popup } from '../../components/ui/CampusMap';
import RouteLayer from '../../components/ui/RouteLayer';
import { fetchPathNodes, fetchPathEdges } from '../../services/mapService';
import { buildAdjacencyList, findPathAStar } from '../../utils/pathfinding';
import { BUILDING_INFO } from '../../data/buildings';
import { RsvpContext } from '../../context/RsvpContext';
import {
  Map as MapIcon, Compass, Navigation, AlertTriangle, CheckCircle,
  Info, ArrowRight, ShieldAlert, X, Building2, Layers, Users, Wrench,
  ChevronRight, ExternalLink,
} from 'lucide-react';

const FullCampusMap = () => {
  const [searchParams] = useSearchParams();
  const rNavigate = useRNavigate();
  const { venues } = useContext(RsvpContext);

  const [baseNodes, setBaseNodes] = useState(null);
  const [baseEdges, setBaseEdges] = useState(null);

  const [startNode, setStartNode] = useState('gate-main');
  const [destNode, setDestNode] = useState('entrance-cs-block');
  const [computedPath, setComputedPath] = useState(null);
  const [pathError, setPathError] = useState('');
  const [totalDistance, setTotalDistance] = useState(0);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // Support ?dest=<nodeId> deep-link from EventDetail or Admin venue list
  useEffect(() => {
    const destParam = searchParams.get('dest');
    if (destParam) setDestNode(destParam);
  }, [searchParams]);

  useEffect(() => {
    async function loadGraph() {
      try {
        const fetchedNodes = await fetchPathNodes();
        const fetchedEdges = await fetchPathEdges();
        setBaseNodes(fetchedNodes);
        setBaseEdges(fetchedEdges);
      } catch (e) {
        console.error('Failed to load map graph data', e);
      }
    }
    loadGraph();
  }, []);

  // Dynamically merge admin added/removed buildings and venues with the campus road network
  const { nodes, adjacency, dynamicBuildingInfo } = useMemo(() => {
    if (!baseNodes || !baseEdges) {
      return { nodes: baseNodes, adjacency: null, dynamicBuildingInfo: BUILDING_INFO };
    }

    const nMap = { ...baseNodes };
    const adj = buildAdjacencyList(baseEdges);
    const infoMap = { ...BUILDING_INFO };

    // Find road junction nodes in the base road network to connect newly added buildings
    const roadNodes = Object.values(baseNodes).filter(
      (n) => n.type === 'junction' || /^\d/.test(n.nodeId)
    );

    (venues || []).forEach((venue) => {
      const vLat = venue.lat != null ? venue.lat : venue.outdoorCoordinates?.lat;
      const vLng = venue.lng != null ? venue.lng : venue.outdoorCoordinates?.lng;
      const vId = venue.nodeId || venue.id;

      if (vLat != null && vLng != null) {
        if (!nMap[vId]) {
          nMap[vId] = {
            nodeId: vId,
            lat: vLat,
            lng: vLng,
            type: 'building',
            label: venue.name || venue.building,
            isDestination: true,
            fromAdmin: true,
          };

          // Find the nearest road junction node by Euclidean distance and add a bidirectional edge
          let nearestRoad = null;
          let minDist = Infinity;
          roadNodes.forEach((rn) => {
            const d = Math.hypot(rn.lat - vLat, rn.lng - vLng);
            if (d < minDist) {
              minDist = d;
              nearestRoad = rn;
            }
          });

          if (nearestRoad) {
            // Approx distance in meters
            const distMeters = Math.max(3, Math.round(minDist * 111000));
            if (!adj[vId]) adj[vId] = [];
            if (!adj[nearestRoad.nodeId]) adj[nearestRoad.nodeId] = [];
            adj[vId].push({ node: nearestRoad.nodeId, weight: distMeters });
            adj[nearestRoad.nodeId].push({ node: vId, weight: distMeters });
          }
        } else {
          nMap[vId] = {
            ...nMap[vId],
            label: venue.name || venue.building,
            isDestination: true,
          };
        }

        infoMap[vId] = {
          label: venue.name || venue.building,
          subtitle: venue.building || 'Campus Facility',
          tag: venue.category || 'Facility',
          color: '#DAF5F0',
          description:
            venue.description || `${venue.name || venue.building} is an active campus building and venue.`,
          floors: 2,
          departments: ['Campus Infrastructure', venue.category || 'General'],
          facilities:
            venue.indoorSteps && venue.indoorSteps.length > 0
              ? venue.indoorSteps
              : ['Main Entrance', 'Student Access', 'Events & Workshops'],
          venueId: venue.id,
          nodeId: vId,
        };
      }
    });

    return { nodes: nMap, adjacency: adj, dynamicBuildingInfo: infoMap };
  }, [baseNodes, baseEdges, venues]);

  const calculateRoute = useCallback((start, dest) => {
    if (!nodes || !adjacency) return;
    if (start === dest) {
      setPathError('Start and Destination cannot be the same.');
      setComputedPath(null);
      setTotalDistance(0);
      return;
    }
    const path = findPathAStar(start, dest, adjacency, nodes);
    if (path && path.length > 0) {
      setComputedPath(path);
      setPathError('');
      let dist = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const edgeObj = (adjacency[path[i]] || []).find((e) => e.node === path[i + 1]);
        if (edgeObj) dist += edgeObj.weight;
      }
      setTotalDistance(Math.round(dist));
    } else {
      setComputedPath(null);
      setTotalDistance(0);
      setPathError('No valid walking route found between these locations.');
    }
  }, [nodes, adjacency]);

  useEffect(() => {
    if (nodes && adjacency) calculateRoute(startNode, destNode);
  }, [nodes, adjacency, startNode, destNode, calculateRoute]);

  const destinationList = useMemo(() => {
    if (!nodes) return [];
    return Object.entries(nodes)
      .filter(([id, node]) =>
        node.isDestination ||
        (node.type !== 'junction' &&
          !id.startsWith('road-') &&
          !/^\d/.test(id))
      )
      .map(([id, node]) => ({ id, ...node }));
  }, [nodes]);

  const handleBuildingClick = useCallback((nodeId) => {
    const info = dynamicBuildingInfo[nodeId] || BUILDING_INFO[nodeId];
    if (info) {
      setSelectedBuilding(info);
      setSelectedNodeInfo(null);
    }
  }, [dynamicBuildingInfo]);

  const handleNavigateHere = useCallback((nodeId) => {
    setDestNode(nodeId);
    setSelectedBuilding(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <PageShell>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-accent-yellow border-2 border-black text-black text-xs uppercase tracking-wider font-black shadow-[2px_2px_0px_0px_#000]">
              Road Network Routing
            </span>
            <span className="px-3 py-1 rounded-full bg-pastel-mint border-2 border-black text-black text-xs uppercase tracking-wider font-black shadow-[2px_2px_0px_0px_#000]">
              A* Algorithm
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-black tracking-tight uppercase">
            Full Campus Map
          </h1>
          <p className="text-black/70 font-bold mt-2 max-w-2xl">
            Explore the complete ASIET campus. Select any start and destination to compute the shortest walking path along verified campus roads. Click building markers for details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Panel ── */}
        <div className="space-y-6">

          {/* Route Finder */}
          <div className="bg-white border-3 border-black p-6 neo-shadow space-y-6">
            <div className="flex items-center gap-3 border-b-3 border-black pb-4">
              <Compass className="w-6 h-6 text-black animate-spin-slow" strokeWidth={3} />
              <h2 className="font-display font-black text-2xl text-black uppercase">Route Finder</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-2">
                  Start Location
                </label>
                <select
                  value={startNode}
                  onChange={(e) => setStartNode(e.target.value)}
                  className="w-full p-3 bg-[#F9F5F6] border-3 border-black font-bold text-black shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:bg-pastel-yellow transition-colors"
                >
                  {destinationList.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label || n.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 bg-pastel-peach border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000]">
                  <ArrowRight className="w-4 h-4 rotate-90" strokeWidth={3} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black/70 mb-2">
                  Destination
                </label>
                <select
                  value={destNode}
                  onChange={(e) => setDestNode(e.target.value)}
                  className="w-full p-3 bg-[#F9F5F6] border-3 border-black font-bold text-black shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:bg-pastel-yellow transition-colors"
                >
                  {destinationList.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label || n.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => calculateRoute(startNode, destNode)}
              className="w-full bg-accent-yellow border-3 border-black text-black font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" strokeWidth={3} />
              Compute Shortest Route
            </button>

            {/* Error */}
            {pathError && (
              <div className="bg-red-100 border-3 border-red-600 p-4 neo-shadow-sm flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <h4 className="font-black text-red-800 uppercase text-sm">Route Unreachable</h4>
                  <p className="text-xs font-bold text-red-700 mt-1">{pathError}</p>
                </div>
              </div>
            )}

            {/* Route Stats */}
            {computedPath && !pathError && (
              <div className="bg-pastel-mint border-3 border-black p-5 neo-shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                  <span className="text-xs font-black uppercase text-black/70">Total Distance</span>
                  <span className="font-black text-black text-lg">{totalDistance} m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black/70">Estimated Walk Time</span>
                  <span className="font-black text-black text-lg">{Math.ceil(totalDistance / 75)} mins</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase text-black/70">Verified Route:</span>
                    <span className="text-[10px] font-black uppercase bg-pastel-yellow border border-black px-1.5 py-0.5">
                      {computedPath.length} Waypoints
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {computedPath
                      .filter((id, idx) =>
                        idx === 0 || idx === computedPath.length - 1 ||
                        nodes[id]?.isDestination || nodes[id]?.type !== 'junction'
                      )
                      .map((id, idx, arr) => (
                        <span key={id} className="text-[10px] font-black bg-white border border-black px-2 py-1 uppercase shadow-[1px_1px_0px_0px_#000]">
                          {nodes[id]?.label || id}{idx < arr.length - 1 ? ' →' : ''}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Building Details Panel */}
          {selectedBuilding ? (
            <div className="bg-white border-3 border-black neo-shadow building-panel-enter overflow-hidden">
              {/* Header */}
              <div
                className="p-5 border-b-3 border-black flex items-start justify-between gap-3"
                style={{ backgroundColor: selectedBuilding.color }}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block mb-2">
                    {selectedBuilding.tag}
                  </span>
                  <h3 className="font-display font-black text-xl text-black uppercase leading-tight">
                    {selectedBuilding.label}
                  </h3>
                  <p className="text-xs font-black text-black/60 uppercase tracking-wide mt-1">
                    {selectedBuilding.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="bg-white border-2 border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:bg-red-100 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Description */}
                <p className="text-sm font-bold text-black/80 leading-relaxed">
                  {selectedBuilding.description}
                </p>

                {/* Floors */}
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-black shrink-0" strokeWidth={3} />
                  <span className="text-xs font-black uppercase text-black/70">
                    {selectedBuilding.floors} Floor{selectedBuilding.floors > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Departments */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-black shrink-0" strokeWidth={3} />
                    <span className="text-xs font-black uppercase text-black/70">Departments</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBuilding.departments.map((d) => (
                      <span key={d} className="text-[10px] font-black bg-pastel-yellow border border-black px-2 py-0.5 uppercase">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-black shrink-0" strokeWidth={3} />
                    <span className="text-xs font-black uppercase text-black/70">Facilities</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBuilding.facilities.map((f) => (
                      <span key={f} className="text-[10px] font-black bg-pastel-mint border border-black px-2 py-0.5 uppercase">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 space-y-2 border-t-2 border-black/10">
                  <button
                    onClick={() => handleNavigateHere(selectedBuilding.nodeId)}
                    className="w-full bg-accent-yellow border-3 border-black text-black font-black uppercase tracking-wider py-2.5 shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Navigation className="w-4 h-4" strokeWidth={3} />
                    Navigate Here
                  </button>
                  {selectedBuilding.venueId && (
                    <button
                      onClick={() => rNavigate('/student/events')}
                      className="w-full bg-pastel-mint border-3 border-black text-black font-black uppercase tracking-wider py-2.5 shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={3} />
                      View Events Here
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Geofence Bridge Points Info */
            <div className="bg-pastel-peach border-3 border-black p-6 neo-shadow space-y-4">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-black" strokeWidth={3} />
                <h3 className="font-display font-black text-lg text-black uppercase">Geofence Bridge Points</h3>
              </div>
              <p className="text-xs text-black font-bold leading-relaxed uppercase tracking-wide">
                Building entrance nodes act as bridge points between the outdoor road network and indoor navigation. Click any yellow dot on the map to see building details.
              </p>
              <div className="bg-white border-2 border-black p-3 space-y-2 max-h-36 overflow-y-auto">
                {destinationList
                  .filter(n => n.type === 'entrance' || n.type === 'building' || n.type === 'facility')
                  .map(bp => (
                    <button
                      key={bp.id}
                      onClick={() => handleBuildingClick(bp.id)}
                      className="w-full flex justify-between items-center text-xs font-bold border-b border-black/10 pb-1 last:border-none hover:bg-pastel-yellow/50 px-1 transition-colors text-left"
                    >
                      <span>{bp.label || bp.id}</span>
                      <span className="bg-pastel-yellow border border-black px-1.5 py-0.5 text-[9px] uppercase font-black">Info</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Map Area ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border-3 border-black h-[650px] relative z-0 neo-shadow-lg">
            <CampusMap center={[76.4302, 10.1780]} zoom={17.8} initialPitch={55} initialBearing={-25}>
              <RouteLayer path={computedPath} nodes={nodes} showBridgePoints={true} />

              {/* Named building markers */}
              {nodes && destinationList
                .filter(n => n.type === 'entrance' || n.type === 'building' || n.type === 'facility')
                .map(n => (
                  <Marker key={n.id} longitude={n.lng} latitude={n.lat} anchor="bottom"
                    onClick={() => handleBuildingClick(n.id)}
                  >
                    <div
                      className="flex flex-col items-center cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuildingClick(n.id);
                      }}
                    >
                      <div
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-0.5 max-w-[90px] text-center leading-tight group-hover:bg-pastel-yellow transition-colors"
                        style={{ backgroundColor: (dynamicBuildingInfo[n.id] || BUILDING_INFO[n.id])?.color || '#fff' }}
                      >
                        {(dynamicBuildingInfo[n.id] || BUILDING_INFO[n.id])?.tag || n.label}
                      </div>
                      <div className="w-3 h-3 bg-white border-2 border-black rounded-none shadow-[1px_1px_0px_0px_#000]" />
                    </div>
                  </Marker>
                ))}

              {/* Start Marker */}
              {nodes && nodes[startNode] && (
                <Marker longitude={nodes[startNode].lng} latitude={nodes[startNode].lat} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#00B67A] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      START
                    </div>
                    <div className="w-5 h-5 bg-[#00B67A] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-bounce" />
                  </div>
                </Marker>
              )}

              {/* Destination Marker */}
              {nodes && nodes[destNode] && destNode !== startNode && (
                <Marker longitude={nodes[destNode].lng} latitude={nodes[destNode].lat} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      DEST
                    </div>
                    <div className="w-5 h-5 bg-[#FF5A1F] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-pulse" />
                  </div>
                </Marker>
              )}

              {/* Node click popup */}
              {selectedNodeInfo && (
                <Popup
                  longitude={selectedNodeInfo.lng}
                  latitude={selectedNodeInfo.lat}
                  anchor="top"
                  offset={16}
                  onClose={() => setSelectedNodeInfo(null)}
                  className="neo-mapbox-popup"
                >
                  <div className="p-1">
                    <strong className="block font-black text-black text-sm uppercase">
                      {selectedNodeInfo.label || selectedNodeInfo.id}
                    </strong>
                    <span className="text-[10px] font-black bg-pastel-yellow border border-black px-1.5 py-0.5 inline-block mt-1 uppercase">
                      {selectedNodeInfo.type}
                    </span>
                  </div>
                </Popup>
              )}
            </CampusMap>

            {/* Map Legend */}
            <div className="absolute bottom-6 left-6 right-6 bg-white border-3 border-black p-3 flex flex-wrap justify-between items-center gap-3 z-10 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#00B67A] border-2 border-black inline-block" />
                <span className="text-[10px] font-black uppercase">Start</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#FF5A1F] border-2 border-black inline-block" />
                <span className="text-[10px] font-black uppercase">Destination</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#FFDB58] border-2 border-black rounded-full inline-block" />
                <span className="text-[10px] font-black uppercase">Bridge Point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-0 border-t-4 border-[#FF5A1F] border-dashed inline-block" />
                <span className="text-[10px] font-black uppercase">A* Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-3 bg-white border-2 border-black inline-block" />
                <span className="text-[10px] font-black uppercase">Click for Info</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default FullCampusMap;
