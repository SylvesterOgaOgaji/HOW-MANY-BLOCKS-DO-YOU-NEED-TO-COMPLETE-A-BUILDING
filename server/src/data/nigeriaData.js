export const NIGERIA_CITIES = {
  abuja: {
    id: 'abuja',
    name: 'Abuja (FCT)',
    soilProfile: 'Firm laterite / rocky terrain (most districts); pockets of clay in Lugbe/Kuje.',
    recommendedFoundation: {
      blocks: 'Strip Foundation + DPC + Oversite Concrete (German Floor) — 0.9m to 1.2m trench depth.',
      eps: 'Raised Reinforced Concrete Platform (150mm–200mm slab on edge beams) + Y10/Y12 starter pegs every 350mm.'
    },
    approvals: [
      { agency: 'AGIS (Abuja Geographic Information Systems)', step: 'Title verification, TDP (Title Deed Plan), and Certificate of Occupancy / Right of Occupancy check.' },
      { agency: 'FCDA Development Control Department', step: 'Submit stamped Architectural, Structural, Mechanical & Electrical (MEP) drawings for Building Plan Approval.' },
      { agency: 'Area Council / FCDA District Office', step: 'Setting-out clearance, stage inspections (foundation, lintel, decking, roof), and Completion Certificate.' }
    ],
    localSuppliers: [
      { name: 'Idu Industrial District (EPS Hub)', focus: 'Structural 3D EPS wire-mesh panels, Polyslab void formers & starter mesh (e.g. PIL / Polystyrene Int\'l)', tip: 'Confirm >= 15 kg/m3 EPS density, fire-retardant SE grade, and >= 2.0mm galvanized mesh — not naked insulation foam.' },
      { name: 'Dei-Dei Building Materials Market', focus: 'Iron rods (10mm/12mm/16mm TMT), binding wire, plumbing, tiles, roofing sheets', tip: 'Verify embossed bar markings (e.g. B500DWR) and SON stamp; measure bar thickness before offloading.' },
      { name: 'Kubwa / Lugbe / Karshi Block Yards & Quarries', focus: '6" & 9" vibrated hollow blocks, 20mm granite, sharp sand', tip: 'Ask how many blocks are moulded per 50kg cement bag (target <= 30 for 9", <= 38 for 6") or mould on-site.' }
    ],
    prices: {
      cement_bag: 11200,
      block_6_inch: 430,
      block_9_inch: 580,
      eps_panel_m2: 24500,
      eps_mesh_strip_m: 1800,
      binding_wire_roll: 18500,
      sharp_sand_tipper: 175000,
      plaster_sand_tipper: 155000,
      granite_20mm_tipper: 430000,
      rebar_8mm_12m: 5400,
      rebar_10mm_12m: 7600,
      rebar_12mm_12m: 10600,
      rebar_16mm_12m: 18900,
      roof_sheet_m2: 7600,
      timber_truss_m2: 4900,
      door_unit: 155000,
      window_unit: 98000,
      water_1000l: 6500,
      mason_day: 12000,
      labourer_day: 6500,
      ironbender_day: 13000,
      carpenter_day: 13000,
      eps_install_m2: 6500,
      mep_finish_m2: 46000
    }
  },
  lagos_mainland: {
    id: 'lagos_mainland',
    name: 'Lagos Mainland (Ikeja / Ikorodu / Alimosho)',
    soilProfile: 'Firm sandy-clay to loamy soil (Ikeja/Agege) to sandy-loam/high water table pockets (parts of Ikorodu/Badagry).',
    recommendedFoundation: {
      blocks: 'Reinforced Strip Foundation (1.0m depth) or Wide Strip where soil is soft; German Floor with damp-proof membrane.',
      eps: 'Raised Concrete Platform (150mm–200mm slab + perimeter edge beam) with anti-damp polythene sheet & starter pegs.'
    },
    approvals: [
      { agency: 'Lagos State Lands Bureau / e-GIS', step: 'Charting & Title search (Freehold, Excision, Gazette, or Governor\'s Consent) before paying for land.' },
      { agency: 'LASPPPA (Lagos State Physical Planning Permit Authority)', step: 'Planning Permit / Building Plan Approval with stamped Architectural, Structural & Survey plans.' },
      { agency: 'LASBCA (Lagos State Building Control Agency)', step: 'Green sticker authorization to commence, stage-by-stage structural inspections & Certificate of Completion.' }
    ],
    localSuppliers: [
      { name: 'Lagos–Ibadan / Ibafo / Ikeja EPS Factories', focus: 'EPS 3D panels, Polyslab void formers, polystrips (e.g. Hitech Polystyrene, Totalgreen, Emprego)', tip: 'Request factory structural guide & installer referral; avoid importing panels—local plants cut to your wall height.' },
      { name: 'Orile / Odunade / Berger Materials Markets', focus: 'TMT steel rods, cement, galvanized mesh, plumbing & electrical conduits', tip: 'Compare per-tonne vs per-piece rebar quotes and insist on 12m full lengths.' },
      { name: 'Ogun / Ikorodu Dredged Sand & Granite Depots', focus: 'Dredged sharp sand, stone dust, 20mm Ogun/Abeokuta granite', tip: 'Inspect tipper bucket depth and check sand is salt-free (avoid unwashed lagoon sand for structural concrete).' }
    ],
    prices: {
      cement_bag: 11000,
      block_6_inch: 410,
      block_9_inch: 550,
      eps_panel_m2: 23500,
      eps_mesh_strip_m: 1750,
      binding_wire_roll: 18000,
      sharp_sand_tipper: 165000,
      plaster_sand_tipper: 145000,
      granite_20mm_tipper: 410000,
      rebar_8mm_12m: 5300,
      rebar_10mm_12m: 7400,
      rebar_12mm_12m: 10300,
      rebar_16mm_12m: 18400,
      roof_sheet_m2: 7400,
      timber_truss_m2: 4700,
      door_unit: 150000,
      window_unit: 95000,
      water_1000l: 5500,
      mason_day: 13000,
      labourer_day: 7000,
      ironbender_day: 14000,
      carpenter_day: 14000,
      eps_install_m2: 6500,
      mep_finish_m2: 48000
    }
  },
  lagos_island: {
    id: 'lagos_island',
    name: 'Lagos Island / Lekki / Ajah',
    soilProfile: 'High water table, loose coastal sand, or peaty/swampy zones — foundation engineering is critical.',
    recommendedFoundation: {
      blocks: 'Reinforced Raft Foundation (or Pile + Ground Beams on peat). Standard shallow strip often cracks or settles!',
      eps: 'EPS 3D panels shine here: lighter walls dramatically cut dead load on your Reinforced Raft Platform + starter pegs.'
    },
    approvals: [
      { agency: 'Lagos State Lands Bureau + Surveyor-General', step: 'Verify land is NOT under Government Acquisition; confirm Excision/C of O/Governor\'s Consent.' },
      { agency: 'LASPPPA + Geotechnical Soil Test', step: 'Geotechnical report (CPT/borehole) + stamped structural drawings for Planning Permit.' },
      { agency: 'LASBCA (Eti-Osa District)', step: 'Mandatory foundation & reinforcement inspection before pouring concrete.' }
    ],
    localSuppliers: [
      { name: 'Lekki–Epe / Lagos EPS Suppliers', focus: 'Lightweight EPS 3D wall panels & Polyslab decking (reduces raft/pile load)', tip: 'Specify marine/corrosion-resistant galvanized wire mesh and anti-salt waterproofing admixtures in concrete.' },
      { name: 'Sangotedo / Ajah / Orile Steel & Cement Depots', focus: '42.5-grade cement, TMT rebar, waterproof cement additives', tip: 'Budget extra for sand filling / dewatering during rainy season (May–October).' }
    ],
    prices: {
      cement_bag: 11800,
      block_6_inch: 450,
      block_9_inch: 610,
      eps_panel_m2: 24500,
      eps_mesh_strip_m: 1850,
      binding_wire_roll: 19000,
      sharp_sand_tipper: 210000,
      plaster_sand_tipper: 185000,
      granite_20mm_tipper: 485000,
      rebar_8mm_12m: 5600,
      rebar_10mm_12m: 7800,
      rebar_12mm_12m: 10900,
      rebar_16mm_12m: 19400,
      roof_sheet_m2: 7900,
      timber_truss_m2: 5200,
      door_unit: 165000,
      window_unit: 105000,
      water_1000l: 7000,
      mason_day: 15000,
      labourer_day: 8000,
      ironbender_day: 16000,
      carpenter_day: 16000,
      eps_install_m2: 7200,
      mep_finish_m2: 55000
    }
  },
  port_harcourt: {
    id: 'port_harcourt',
    name: 'Port Harcourt (Rivers)',
    soilProfile: 'High rainfall, silty-clay to marshy coastal zones; requires good drainage & raised DPC.',
    recommendedFoundation: {
      blocks: 'Deep/Wide Strip or Raft Foundation with high plinth (4–6 courses) to stay above seasonal flood levels.',
      eps: 'Raised Concrete Raft/Platform (300mm+ above ground) + galvanized starter pegs + waterproof plaster coat.'
    },
    approvals: [
      { agency: 'Rivers State Ministry of Lands & Survey', step: 'Title verification, Deed of Conveyance registration, and Survey Charting.' },
      { agency: 'Rivers State Ministry of Physical Planning & Urban Development', step: 'Building plan submission & approval before site mobilization.' }
    ],
    localSuppliers: [
      { name: 'Trans-Amadi / Mile 3 / Eleme Building Hubs', focus: 'Cement, TMT iron rods, roofing sheets, drainage & plumbing materials', tip: 'Source EPS panels via Lagos/Abuja distributors or local PH prefab yards; factor transport per truckload.' }
    ],
    prices: {
      cement_bag: 11600,
      block_6_inch: 430,
      block_9_inch: 590,
      eps_panel_m2: 26000,
      eps_mesh_strip_m: 1900,
      binding_wire_roll: 19000,
      sharp_sand_tipper: 170000,
      plaster_sand_tipper: 150000,
      granite_20mm_tipper: 460000,
      rebar_8mm_12m: 5500,
      rebar_10mm_12m: 7700,
      rebar_12mm_12m: 10800,
      rebar_16mm_12m: 19200,
      roof_sheet_m2: 7700,
      timber_truss_m2: 4800,
      door_unit: 155000,
      window_unit: 98000,
      water_1000l: 5500,
      mason_day: 12500,
      labourer_day: 7000,
      ironbender_day: 13500,
      carpenter_day: 13500,
      eps_install_m2: 7000,
      mep_finish_m2: 47000
    }
  },
  enugu: {
    id: 'enugu',
    name: 'Enugu / South-East',
    soilProfile: 'Lateritic red earth and sandstone hills; watch for erosion gullies or coal-shale clay pockets.',
    recommendedFoundation: {
      blocks: 'Strip Foundation (0.9m–1.2m) stepped properly if plot is sloped; check clay expansion in valleys.',
      eps: 'Raised Concrete Platform with perimeter Retaining Edge Beam on sloped plots + starter pegs.'
    },
    approvals: [
      { agency: 'Enugu State Ministry of Lands & Urban Development', step: 'Survey & Title registration (C of O / Power of Attorney verification).' },
      { agency: 'ECTDA (Enugu Capital Territory Development Authority)', step: 'Building plan approval & setback compliance checks.' }
    ],
    localSuppliers: [
      { name: 'Kenyatta / Timber Shade / Abakpa Markets', focus: 'Hardwood roofing timber, cement, steel rods, zinc/aluminium roofing, stone dust', tip: 'Enugu has strong hardwood timber supply; treat all rafters/purlins with anti-termite chemical before roofing.' }
    ],
    prices: {
      cement_bag: 10900,
      block_6_inch: 390,
      block_9_inch: 530,
      eps_panel_m2: 26500,
      eps_mesh_strip_m: 1950,
      binding_wire_roll: 18000,
      sharp_sand_tipper: 145000,
      plaster_sand_tipper: 130000,
      granite_20mm_tipper: 395000,
      rebar_8mm_12m: 5200,
      rebar_10mm_12m: 7400,
      rebar_12mm_12m: 10300,
      rebar_16mm_12m: 18500,
      roof_sheet_m2: 7300,
      timber_truss_m2: 4100,
      door_unit: 145000,
      window_unit: 90000,
      water_1000l: 6000,
      mason_day: 11000,
      labourer_day: 6000,
      ironbender_day: 12000,
      carpenter_day: 12000,
      eps_install_m2: 6800,
      mep_finish_m2: 43000
    }
  },
  kano: {
    id: 'kano',
    name: 'Kano / North',
    soilProfile: 'Dry sandy-laterite & alluvial plains; extreme daytime heat makes EPS thermal insulation a major advantage.',
    recommendedFoundation: {
      blocks: 'Strip Foundation (0.9m–1.2m) with compacted laterite fill & German floor.',
      eps: 'Raised Concrete Platform + Y10/Y12 starter pegs; EPS core cuts indoor afternoon heat dramatically without heavy AC.'
    },
    approvals: [
      { agency: 'KANGIS (Kano State Geographic Information System)', step: 'Land title search, survey charting & C of O / Customary Right conversion.' },
      { agency: 'KNUPDA (Kano Urban Planning & Development Authority)', step: 'Building drawing submission, setback verification & construction permit.' }
    ],
    localSuppliers: [
      { name: 'Sabon Gari / Kofar Ruwa / Dakata Markets', focus: 'Cement, steel bars, roofing sheets, plumbing & finishing fittings', tip: 'Cure concrete and blocks twice daily with water in dry harmattan/hot weather so cement reaches full strength.' }
    ],
    prices: {
      cement_bag: 10800,
      block_6_inch: 380,
      block_9_inch: 520,
      eps_panel_m2: 26500,
      eps_mesh_strip_m: 1950,
      binding_wire_roll: 18000,
      sharp_sand_tipper: 135000,
      plaster_sand_tipper: 120000,
      granite_20mm_tipper: 380000,
      rebar_8mm_12m: 5200,
      rebar_10mm_12m: 7300,
      rebar_12mm_12m: 10200,
      rebar_16mm_12m: 18300,
      roof_sheet_m2: 7200,
      timber_truss_m2: 4500,
      door_unit: 142000,
      window_unit: 88000,
      water_1000l: 6000,
      mason_day: 10500,
      labourer_day: 5500,
      ironbender_day: 11500,
      carpenter_day: 11500,
      eps_install_m2: 6800,
      mep_finish_m2: 42000
    }
  }
};

export const LEARNING_VIDEOS = [
  {
    id: 'eps-3d-platform',
    title: 'EPS 3D Wall Panel Construction: Platform, Starter Pegs & Shotcrete',
    region: 'Global (Brazil / India / US) & Nigeria Adaptable',
    category: 'Polystyrene (EPS)',
    query: 'EPS 3D wire mesh panel house construction starter bars shotcrete',
    takeaway: 'Watch how vertical starter rebar pegs are anchored into the concrete platform, panels are tied with corner mesh, conduits chased, and mortar applied in 2 coats.'
  },
  {
    id: 'eps-nigeria-site',
    title: 'Building with Polystyrene Panels in Nigeria (Abuja & Lagos Sites)',
    region: 'Nigeria (Abuja / Lagos)',
    category: 'Polystyrene (EPS)',
    query: 'polystyrene building technology in Nigeria Abuja Lagos cost',
    takeaway: 'See real local sites using Idu/Lagos EPS panels and Polyslab decking without importing expensive kits.'
  },
  {
    id: 'diy-setting-out',
    title: 'DIY Foundation Setting Out & Water Hose Level Check (3-4-5 Triangle)',
    region: 'DIY / Site Audit',
    category: 'DIY & Foundation',
    query: 'building setting out 3 4 5 method water hose level construction',
    takeaway: 'How to verify your plot corners are 90 degrees square and check wall levels yourself using a simple transparent water hose.'
  },
  {
    id: 'block-quality-check',
    title: 'How to Check Sandcrete Block Quality & On-Site Moulding Ratios',
    region: 'Nigeria Construction',
    category: 'Blocks & Concrete',
    query: 'sandcrete block moulding ratio cement sand Nigeria quality test',
    takeaway: 'Why 28-30 blocks per bag (9-inch) beats cheap 50-blocks-per-bag commercial yards that crack before roofing.'
  }
];
