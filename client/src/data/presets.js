export const PLOT_PRESETS = [
  { id: 'half', label: 'Half Plot (9m × 30m / 270m²)', width: 9, depth: 30 },
  { id: 'compact_216', label: 'Quarter / Mini Plot (12m × 18m / 216m²)', width: 12, depth: 18 },
  { id: 'full_450', label: 'Standard Plot (15m × 30m / 450m²)', width: 15, depth: 30 },
  { id: 'full_600', label: 'Full Plot (18m × 36m / 600m²)', width: 18, depth: 36 },
  { id: 'custom', label: 'Custom Land Size (Enter Width × Depth)', width: 15, depth: 25 }
];

export const ROOM_PALETTE = [
  { type: 'lounge', name: 'Parlour / Lounge', width: 4.5, depth: 4.0, color: '#e9d8a6' },
  { type: 'bedroom', name: 'Bedroom', width: 3.6, depth: 3.6, color: '#cbd5e1' },
  { type: 'kitchen', name: 'Kitchen', width: 3.0, depth: 3.0, color: '#fed7aa' },
  { type: 'bath', name: 'Toilet / Bath', width: 2.0, depth: 2.5, color: '#bae6fd' },
  { type: 'dining', name: 'Dining', width: 3.0, depth: 3.5, color: '#fde68a' },
  { type: 'verandah', name: 'Entrance Portico', width: 3.0, depth: 2.0, color: '#d9f99d' }
];

export const HOUSE_TEMPLATES = [
  {
    id: 'starter_core',
    name: '1-Bed Starter Core (Stop Rent First)',
    subtitle: 'Build fast on half/full plot, move in, then expand later',
    floors: 1,
    doorsCount: 4,
    windowsCount: 5,
    rooms: [
      { id: 'r1', type: 'lounge', name: 'Parlour', x: 2, z: 6, width: 4, depth: 4, color: '#e9d8a6' },
      { id: 'r2', type: 'bedroom', name: 'Bedroom', x: 6, z: 6, width: 3.5, depth: 4, color: '#cbd5e1' },
      { id: 'r3', type: 'kitchen', name: 'Kitchen', x: 2, z: 10, width: 3, depth: 3, color: '#fed7aa' },
      { id: 'r4', type: 'bath', name: 'Toilet/Bath', x: 5, z: 10, width: 2, depth: 3, color: '#bae6fd' }
    ]
  },
  {
    id: 'two_bed',
    name: '2-Bedroom Compact Bungalow',
    subtitle: 'Ideal for a young family or civil servant cooperative build',
    floors: 1,
    doorsCount: 6,
    windowsCount: 9,
    rooms: [
      { id: 'r1', type: 'lounge', name: 'Parlour', x: 2, z: 6, width: 5, depth: 4.5, color: '#e9d8a6' },
      { id: 'r2', type: 'kitchen', name: 'Kitchen', x: 2, z: 10.5, width: 3, depth: 3.5, color: '#fed7aa' },
      { id: 'r3', type: 'bedroom', name: 'Bedroom 1', x: 7, z: 6, width: 3.5, depth: 4, color: '#cbd5e1' },
      { id: 'r4', type: 'bath', name: 'Shared Bath', x: 7, z: 10, width: 2, depth: 2.5, color: '#bae6fd' },
      { id: 'r5', type: 'bedroom', name: 'Master Suite', x: 9, z: 10, width: 4, depth: 4, color: '#d8b4fe' },
      { id: 'r6', type: 'verandah', name: 'Portico', x: 5, z: 10.5, width: 2, depth: 2, color: '#d9f99d' }
    ]
  },
  {
    id: 'three_bed',
    name: '3-Bedroom Family Bungalow',
    subtitle: 'Standard Nigerian 3-bedroom layout with portico & service wing',
    floors: 1,
    doorsCount: 8,
    windowsCount: 12,
    rooms: [
      { id: 'r1', type: 'lounge', name: 'Family Lounge', x: 2, z: 5, width: 5, depth: 5, color: '#e9d8a6' },
      { id: 'r2', type: 'dining', name: 'Dining', x: 2, z: 10, width: 3, depth: 3.5, color: '#fde68a' },
      { id: 'r3', type: 'kitchen', name: 'Kitchen', x: 5, z: 10, width: 3, depth: 3.5, color: '#fed7aa' },
      { id: 'r4', type: 'bedroom', name: 'Guest Bed 1', x: 7, z: 5, width: 3.5, depth: 3.5, color: '#cbd5e1' },
      { id: 'r5', type: 'bedroom', name: 'Guest Bed 2', x: 7, z: 8.5, width: 3.5, depth: 3.5, color: '#cbd5e1' },
      { id: 'r6', type: 'bath', name: 'Bathrooms', x: 10.5, z: 5, width: 2, depth: 3.5, color: '#bae6fd' },
      { id: 'r7', type: 'bedroom', name: 'Master Suite', x: 10.5, z: 8.5, width: 4, depth: 4.5, color: '#d8b4fe' }
    ]
  },
  {
    id: 'four_bed_duplex',
    name: '4-Bedroom G+1 Duplex',
    subtitle: 'Includes suspended concrete decking & RCC staircase',
    floors: 2,
    doorsCount: 7,
    windowsCount: 10,
    rooms: [
      { id: 'r1', type: 'lounge', name: 'Main Lounge', x: 2, z: 5, width: 5.5, depth: 5, color: '#e9d8a6' },
      { id: 'r2', type: 'dining', name: 'Dining / Stair', x: 7.5, z: 5, width: 3.5, depth: 5, color: '#fde68a' },
      { id: 'r3', type: 'kitchen', name: 'Kitchen', x: 2, z: 10, width: 4, depth: 3.5, color: '#fed7aa' },
      { id: 'r4', type: 'bedroom', name: 'Guest Room', x: 6, z: 10, width: 3.5, depth: 3.5, color: '#cbd5e1' },
      { id: 'r5', type: 'bath', name: 'Guest Bath', x: 9.5, z: 10, width: 1.5, depth: 3.5, color: '#bae6fd' }
    ]
  }
];

export const REBAR_STAMP_PARTS = [
  { code: 'B', title: 'Reinforcing Steel', detail: 'Confirms steel is manufactured specifically for reinforced concrete.' },
  { code: '500', title: 'Yield Strength (500 MPa)', detail: 'High-tensile TMT strength grade (minimum 500 N/mm² yield).' },
  { code: 'D', title: 'Ductility Class', detail: 'High ductility — bends cleanly without snapping during stirrup/column forming.' },
  { code: 'W', title: 'Weldable Steel', detail: 'Safe for controlled welding/tacking if required by structural design.' },
  { code: 'R', title: 'Ribbed (Deformed) Bar', detail: 'Surface ribs lock tightly into concrete so bars do not slip under tension.' },
  { code: '16', title: 'Nominal Diameter (16 mm)', detail: 'Match this stamped diameter against your structural drawing before paying.' }
];

export const FIELD_QUIZZES = [
  {
    id: 'tank-pipes',
    title: 'Water Storage Tank: Which pipe prevents overflow flooding?',
    prompt: 'On a compound Geepee/overhead water tank, four pipes connect at different heights: (1) Top vertical vent, (2) Upper side pipe sloping to drainage, (3) Upper supply inlet, (4) Bottom valve pipe to house taps. Which is Pipe #2?',
    options: [
      { id: 'a', label: 'Air Vent Pipe (maintains atmospheric pressure)', correct: false },
      { id: 'b', label: 'Overflow Pipe (discharges excess water safely with an insect screen)', correct: true },
      { id: 'c', label: 'Inlet Pipe (fills the tank from borehole/mains)', correct: false },
      { id: 'd', label: 'Outlet Pipe (feeds bathrooms & kitchen taps)', correct: false }
    ],
    explanation: 'Pipe #2 is the Overflow Pipe—installed near the maximum water level with a downward slope and insect mesh screen so an unattended pump never floods your slab or roof.'
  },
  {
    id: 'trench-safety',
    title: 'Foundation Excavation: Where should the excavator sit?',
    prompt: 'When digging a deep soakaway or foundation trench on soft clay/sand, where is the safest position for a heavy excavator?',
    options: [
      { id: 'a', label: 'Right at the trench edge for maximum reach', correct: false },
      { id: 'b', label: 'Inside the designated Safe Setback Zone away from the edge', correct: true },
      { id: 'c', label: 'Straddling the excavated wall corner', correct: false }
    ],
    explanation: 'Heavy machine load right next to an unshored trench edge triggers soil shear failure and trench collapse. Keep equipment outside the safe setback zone.'
  },
  {
    id: 'concrete-mix',
    title: 'Concrete Mixing: Your mason asks for extra water to make pouring easier',
    prompt: 'The concrete in the wheelbarrow looks stiff and cohesive, and your mason wants to pour two extra buckets of water so it flows faster. What should you do?',
    options: [
      { id: 'a', label: 'Allow it — more water makes concrete cure faster', correct: false },
      { id: 'b', label: 'Refuse — stick to ~25L per 50kg bag (w/c = 0.50) and compact properly', correct: true },
      { id: 'c', label: 'Add extra sand instead of gravel', correct: false }
    ],
    explanation: 'Excess water weakens concrete compressive strength, causes aggregate segregation, shrinkage cracks, and porous honeycombing. Use 25L per 50kg bag (1:1.5:3 or 1:2:3) and compact properly.'
  },
  {
    id: 'eps-vs-foam',
    title: 'Polystyrene (EPS) Buying Check: What must you ask in Abuja/Lagos?',
    prompt: 'You visit a polystyrene supplier in Idu (Abuja) or Lagos to buy panels for house walls. What is the #1 mistake beginners make?',
    options: [
      { id: 'a', label: 'Buying naked insulation foam instead of 3D galvanized wire-mesh structural panels', correct: true },
      { id: 'b', label: 'Casting starter iron pegs into the concrete platform first', correct: false },
      { id: 'c', label: 'Running electrical conduits before plastering/shotcreting', correct: false }
    ],
    explanation: 'Naked EPS foam boards have no structural wire mesh and are only for insulation/void filling! House walls require 3D EPS panels (>=15 kg/m³ SE foam + double-sided galvanized truss wire mesh) mounted onto starter iron pegs.'
  }
];
