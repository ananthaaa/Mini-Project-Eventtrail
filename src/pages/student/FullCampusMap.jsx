import React, { useState, useEffect } from 'react';
import PageShell from '../../components/layout/PageShell';
import CampusMap from '../../components/ui/CampusMap';
import RouteLayer from '../../components/ui/RouteLayer';
import { fetchPathNodes, fetchPathEdges } from '../../services/mapService';
import { buildAdjacencyList, findPathAStar } from '../../utils/pathfinding';
import { Map as MapIcon, Compass, Navigation, AlertTriangle, CheckCircle, Info, Layers, ArrowRight, ShieldAlert } from 'lucide-react';
import { Marker, Popup } from 'react-map-gl/mapbox';

const FullCampusMap = () => {
  const [nodes, setNodes] = useState(null);
  const [adjacency, setAdjacency] = useState(null);
  const [startNode, setStartNode] = useState('gate-main');
  const [destNode, setDestNode] = useState('entrance-cs-block');
  const [computedPath, setComputedPath] = useState(null);
  const [pathError, setPathError] = useState('');
  const [totalDistance, setTotalDistance] = useState(0);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);

  useEffect(() => {
    async function loadGraph() {
      try {
        const fetchedNodes = await fetchPathNodes();
        const fetchedEdges = await fetchPathEdges();
        setNodes(fetchedNodes);
        setAdjacency(buildAdjacencyList(fetchedEdges));
      } catch (e) {
        console.error("Failed to load map graph data", e);
      }
    }
    loadGraph();
  }, []);

  const calculateRoute = (start, dest) => {
    if (!nodes || !adjacency) return;

    if (start === dest) {
      setPathError('Start and Destination locations cannot be the same.');
      setComputedPath(null);
      setTotalDistance(0);
      return;
    }

    const path = findPathAStar(start, dest, adjacency, nodes);
    if (path && path.length > 0) {
      setComputedPath(path);
      setPathError('');

      // Calculate total walking distance
      let dist = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edgeObj = (adjacency[u] || []).find(e => e.node === v);
        if (edgeObj) {
          dist += edgeObj.weight;
        }
      }
      setTotalDistance(Math.round(dist));
    } else {
      setComputedPath(null);
      setTotalDistance(0);
      setPathError('No valid walking route found between these locations! The destination area may be disconnected in the walkway graph or under construction.');
    }
  };

  useEffect(() => {
    if (nodes && adjacency) {
      calculateRoute(startNode, destNode);
    }
  }, [nodes, adjacency, startNode, destNode]);

  const nodeList = nodes ? Object.entries(nodes).map(([id, node]) => ({ id, ...node })) : [];

  return (
    <PageShell>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-accent-yellow border-2 border-black text-black text-xs uppercase tracking-wider font-black shadow-[2px_2px_0px_0px_#000]">
              Mapbox GL Powered
            </span>
            <span className="px-3 py-1 rounded-full bg-pastel-mint border-2 border-black text-black text-xs uppercase tracking-wider font-black shadow-[2px_2px_0px_0px_#000]">
              A* Algorithm
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-black tracking-tight uppercase">
            Full Campus Map & Routing
          </h1>
          <p className="text-black/70 font-bold mt-2 max-w-2xl">
            Explore the complete digitized walkway network. Select any start and destination nodes to compute guaranteed shortest walking paths using client-side A* pathfinding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Control Panel / HUD */}
        <div className="space-y-6">
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
                  {nodeList.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label || n.id} ({n.type.toUpperCase()})
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
                  Destination Location
                </label>
                <select
                  value={destNode}
                  onChange={(e) => setDestNode(e.target.value)}
                  className="w-full p-3 bg-[#F9F5F6] border-3 border-black font-bold text-black shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:bg-pastel-yellow transition-colors"
                >
                  {nodeList.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label || n.id} ({n.type.toUpperCase()})
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

            {/* Error Display */}
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
                  <span className="text-xs font-black uppercase text-black/70">Total Walking Distance</span>
                  <span className="font-black text-black text-lg">{totalDistance} meters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black/70">Estimated Walk Time</span>
                  <span className="font-black text-black text-lg">{Math.ceil(totalDistance / 75)} mins</span>
                </div>
                <div className="pt-2">
                  <span className="text-xs font-black uppercase text-black/70 block mb-1">Path Sequence:</span>
                  <div className="flex flex-wrap gap-1">
                    {computedPath.map((id, idx) => (
                      <span key={id} className="text-[10px] font-black bg-white border border-black px-2 py-0.5 uppercase">
                        {nodes[id]?.label || id}{idx < computedPath.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bridge Points Info Card */}
          <div className="bg-pastel-peach border-3 border-black p-6 neo-shadow space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-black" strokeWidth={3} />
              <h3 className="font-display font-black text-lg text-black uppercase">Geofence Bridge Points</h3>
            </div>
            <p className="text-xs text-black font-bold leading-relaxed uppercase tracking-wide">
              Building entrance nodes act as bridge points between the outdoor Mapbox graph and indoor SVG navigation. When a student approaches these waypoints, the app automatically triggers indoor geofence handoff.
            </p>
            <div className="bg-white border-2 border-black p-3 space-y-2 max-h-36 overflow-y-auto">
              {nodeList.filter(n => n.type === 'entrance' || n.type === 'building').map(bp => (
                <div key={bp.id} className="flex justify-between items-center text-xs font-bold border-b border-black/10 pb-1 last:border-none">
                  <span>{bp.label || bp.id}</span>
                  <span className="bg-pastel-yellow border border-black px-1.5 py-0.5 text-[9px] uppercase font-black">Bridge Node</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Map Area */}
        <div className="lg:col-span-2">
          <div className="bg-white border-3 border-black h-[650px] relative z-0 neo-shadow-lg">
            <CampusMap center={[10.1782, 76.4305]} zoom={17}>
              {/* Render computed route polyline and bridge markers */}
              <RouteLayer path={computedPath} nodes={nodes} showBridgePoints={true} />

              {/* Start Marker */}
              {nodes && nodes[startNode] && (
                <Marker longitude={nodes[startNode].lng} latitude={nodes[startNode].lat} anchor="bottom">
                  <div className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedNodeInfo({ id: startNode, ...nodes[startNode] })}>
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
                  <div className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedNodeInfo({ id: destNode, ...nodes[destNode] })}>
                    <div className="bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      DESTINATION
                    </div>
                    <div className="w-5 h-5 bg-[#FF5A1F] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-pulse" />
                  </div>
                </Marker>
              )}

              {/* Popup for clicked node info */}
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
                    <strong className="block font-black text-black text-sm uppercase">{selectedNodeInfo.label || selectedNodeInfo.id}</strong>
                    <span className="text-[10px] font-black bg-pastel-yellow border border-black px-1.5 py-0.5 inline-block mt-1 uppercase">
                      Node Type: {selectedNodeInfo.type}
                    </span>
                    <p className="text-[11px] text-black/70 font-bold mt-2">Lat: {selectedNodeInfo.lat}, Lng: {selectedNodeInfo.lng}</p>
                  </div>
                </Popup>
              )}
            </CampusMap>

            {/* Map legend HUD footer */}
            <div className="absolute bottom-6 left-6 right-6 bg-white border-3 border-black p-4 flex flex-wrap justify-between items-center gap-4 z-10 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-[#00B67A] border-2 border-black inline-block"></span>
                <span className="text-xs font-black uppercase">Start Node</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-[#FF5A1F] border-2 border-black inline-block"></span>
                <span className="text-xs font-black uppercase">Destination</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-[#FFDB58] border-2 border-black rounded-full inline-block"></span>
                <span className="text-xs font-black uppercase">Bridge Point</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-0 border-t-4 border-[#FF5A1F] border-dashed inline-block"></span>
                <span className="text-xs font-black uppercase">A* Route Path</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default FullCampusMap;
