// Campus building metadata keyed by graph node ID
export const BUILDING_INFO = {
  'gate-main': {
    label: 'Entrance - main gate', subtitle: 'College Road Entrance', tag: 'Entrance - main gate', color: '#FFDB58',
    description: 'Primary vehicle and pedestrian entrance to ASIET campus from College Road. Security checkpoint stationed here 24/7.',
    floors: 1, departments: ['Campus Security', 'Visitor Management'],
    facilities: ['Parking', 'Security Post', 'Visitor Log'], venueId: null, nodeId: 'gate-main',
  },
  'btech-block': {
    label: 'B.Tech Academic Block', subtitle: 'Main Teaching Building', tag: 'Academic', color: '#DAF5F0',
    description: 'Primary academic block for B.Tech programmes. Houses lecture theatres, tutorial rooms, and faculty offices for Engineering departments.',
    floors: 4, departments: ['Computer Science', 'Electronics', 'Electrical', 'Mechanical'],
    facilities: ['Lecture Theatres', 'Seminar Halls', 'Faculty Offices', 'Lift'], venueId: null, nodeId: 'btech-block',
  },
  'entrance-cs-block': {
    label: 'CS Block', subtitle: 'Computer Science Wing', tag: 'CS/IT', color: '#DAF5F0',
    description: 'Computer Science and IT wing of the B.Tech block. Dedicated labs for Programming, Networks, AI/ML, and Cybersecurity research.',
    floors: 3, departments: ['Computer Science Engineering', 'Information Technology', 'AI and Data Science'],
    facilities: ['Computing Labs', 'Server Room', 'Seminar Room 101', 'CTF Arena'], venueId: 'science-hall-a', nodeId: 'entrance-cs-block',
  },
  'mech-block': {
    label: 'Mechanical Engineering Block', subtitle: 'Engineering Department', tag: 'Mech', color: '#F8D6B3',
    description: 'Home to Mechanical, Civil, and Automobile Engineering departments. Houses design studios and advanced manufacturing facilities.',
    floors: 3, departments: ['Mechanical Engineering', 'Automobile Engineering', 'Industrial Design'],
    facilities: ['CAD Lab', 'CNC Lab', 'Design Studio', 'Workshop Annex'], venueId: null, nodeId: 'mech-block',
  },
  'mba-block': {
    label: 'MBA Block', subtitle: 'Business School', tag: 'MBA', color: '#FDFD96',
    description: 'School of Management with MBA and BBA programmes. Bloomberg Terminal Lab and executive boardroom facilities.',
    floors: 4, departments: ['Business Administration', 'Finance', 'Marketing', 'HR Management'],
    facilities: ['Bloomberg Lab', 'Boardroom', 'Case Study Hall', 'Library Wing'], venueId: null, nodeId: 'mba-block',
  },
  'civil-block': {
    label: 'Civil Engineering Block', subtitle: 'Infrastructure Department', tag: 'Civil', color: '#F8D6B3',
    description: 'Civil Engineering and Architecture building with a dedicated surveying lab, soil testing facility, and architecture design studio.',
    floors: 3, departments: ['Civil Engineering', 'Architecture', 'Environmental Engineering'],
    facilities: ['Surveying Lab', 'Soil Testing', 'Drawing Hall', 'Materials Lab'], venueId: null, nodeId: 'civil-block',
  },
  'pg-block': {
    label: 'PG Block Research Labs', subtitle: 'Postgraduate Wing', tag: 'Research', color: '#DAF5F0',
    description: 'Postgraduate and doctoral research centre with M.Tech and Ph.D. laboratories, research offices, and the Innovation Hub.',
    floors: 5, departments: ['M.Tech Research', 'PhD Programmes', 'Innovation Hub'],
    facilities: ['Research Labs', 'PhD Cubicles', 'Seminar Hall PG', 'High-Performance Computing'], venueId: 'science-hall-a', nodeId: 'pg-block',
  },
  'entrance-science': {
    label: 'Science Building Block B', subtitle: 'Applied Sciences Department', tag: 'Science', color: '#DAF5F0',
    description: 'Applied Sciences block featuring Chemistry, Physics, and Biotechnology labs. Home to the Science Auditorium for large-scale events.',
    floors: 3, departments: ['Applied Chemistry', 'Applied Physics', 'Biotechnology'],
    facilities: ['Chemistry Lab', 'Physics Lab', 'Science Auditorium A', 'Biotech Research Room'], venueId: 'science-hall-a', nodeId: 'entrance-science',
  },
  'ctf-lab': {
    label: 'CTF Cyber Security Lab', subtitle: 'Cyber Operations Centre', tag: 'Cyber', color: '#FDFD96',
    description: 'Capture-The-Flag and Cyber Security research lab with penetration testing rigs, network simulators, and SIEM platform.',
    floors: 1, departments: ['Cyber Security', 'Ethical Hacking', 'Digital Forensics'],
    facilities: ['CTF Arena', 'Pen-Test Rigs', 'Network Simulation', 'SIEM Dashboard'], venueId: null, nodeId: 'ctf-lab',
  },
  'workshop-block': {
    label: 'Central Workshop Smithy', subtitle: 'Fabrication Centre', tag: 'Workshop', color: '#F8D6B3',
    description: 'Campus fabrication centre for hands-on engineering training with smithy, welding bays, lathe machines, and 3D printing farm.',
    floors: 1, departments: ['Workshop Training', 'Fabrication', 'Manufacturing Lab'],
    facilities: ['Smithy', 'Welding Bays', 'Lathe Machines', '3D Printing Farm'], venueId: null, nodeId: 'workshop-block',
  },
  'entrance-hub': {
    label: 'Student Activity Hub', subtitle: 'Campus Life Centre', tag: 'Hub', color: '#DAF5F0',
    description: 'Heart of campus student life. Club rooms, event halls, media studio, maker space, and Creative Hub workshop rooms.',
    floors: 3, departments: ['Student Council', 'Cultural Activities', 'Media Productions'],
    facilities: ['Creative Hub Room 202', 'Club Rooms', 'Maker Space', 'Auditorium Stage', 'Media Studio'], venueId: 'hub-room-202', nodeId: 'entrance-hub',
  },
  'union-cafe': {
    label: 'Student Union Cafe Canteen', subtitle: 'Dining Social Space', tag: 'Canteen', color: '#FDFD96',
    description: 'Main student canteen and cafe. Serves meals and snacks. Doubles as an informal social and study lounge with WiFi.',
    floors: 1, departments: ['Dining Services', 'Student Union'],
    facilities: ['Cafeteria', 'Coffee Bar', 'Social Lounge', 'Free WiFi', 'Vending Zone'], venueId: null, nodeId: 'union-cafe',
  },
  'entrance-stadium': {
    label: 'Campus Sports Ground', subtitle: 'Athletics Recreation', tag: 'Sports', color: '#DAF5F0',
    description: 'ASIET sports complex with full-size football field, 400m athletics track, basketball court, and cricket nets.',
    floors: 1, departments: ['Physical Education', 'Athletics Club', 'Sports Council'],
    facilities: ['Football Field', '400m Track', 'Basketball Court', 'Cricket Nets', 'Bleachers'], venueId: 'stadium-field-1', nodeId: 'entrance-stadium',
  },
};

// Map venueId to the nearest routing nodeId on the campus road network
export const VENUE_TO_NODE = {
  'science-hall-a': 'entrance-science',
  'hub-room-202': 'entrance-hub',
  'stadium-field-1': 'entrance-stadium',
};
