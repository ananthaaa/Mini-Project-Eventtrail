import { create } from 'zustand';

// Default ASIET College Gate coordinates for fallback/initial state
const DEFAULT_LAT = 10.5270;
const DEFAULT_LNG = 76.2144;

export const useNavigationStore = create((set, get) => ({
  // View mode: '2d-map' | 'route-overview' | 'turn-by-turn' | 'ar-simulation'
  viewMode: '2d-map',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Live location & orientation
  liveLocation: { lat: DEFAULT_LAT, lng: DEFAULT_LNG, heading: 0 },
  snappedLocation: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
  heading: 0,
  setLiveLocation: (lat, lng, heading = 0) => 
    set({ liveLocation: { lat, lng, heading } }),
  setSnappedLocation: (lat, lng) => 
    set({ snappedLocation: { lat, lng } }),
  setHeading: (heading) => set({ heading }),

  // Destination (event venue)
  destination: null, // { id, name, lat, lng, buildingId }
  setDestination: (dest) => set({ destination: dest }),

  // Active route geometry from A* algorithm
  routeData: {
    geometry: null, // GeoJSON LineString
    steps: [],      // Array of turn-by-turn steps
    distance: 0,    // Total walking distance in meters
  },
  setRouteData: (data) => set({ routeData: data }),

  // Geofence handoff flag
  isIndoor: false,
  setIsIndoor: (indoor) => set({ isIndoor: indoor }),

  // Reset store when leaving navigation
  resetNavigation: () => set({
    viewMode: '2d-map',
    destination: null,
    routeData: { geometry: null, steps: [], distance: 0 },
    isIndoor: false
  })
}));
