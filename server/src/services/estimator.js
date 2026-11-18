import { NIGERIA_CITIES } from '../data/nigeriaData.js';

/**
 * Deduplicate shared wall edges across snapped rooms so interior partition walls
 * aren't double-counted when rooms touch on the 3D Lego grid.
 */
export function computeWallSegmentsFromRooms(rooms = []) {
  const edgeMap = new Map();

  for (const room of rooms) {
    const x1 = Number(room.x) || 0;
    const z1 = Number(room.z) || 0;
    const x2 = x1 + (Number(room.width) || 3);
    const z2 = z1 + (Number(room.depth) || 3);

    const edges = [
      { ax: x1, az: z1, bx: x2, bz: z1, dir: 'h' },
      { ax: x1, az: z2, bx: x2, bz: z2, dir: 'h' },
      { ax: x1, az: z1, bx: x1, bz: z2, dir: 'v' },
      { ax: x2, az: z1, bx: x2, bz: z2, dir: 'v' }
    ];

    for (const e of edges) {
      // Break edges at 0.5m grid resolution or exact segment overlap via interval merging
      const fixed = e.dir === 'h' ? e.az.toFixed(2) : e.ax.toFixed(2);
      const start = e.dir === 'h' ? Math.min(e.ax, e.bx) : Math.min(e.az, e.bz);
      const end = e.dir === 'h' ? Math.max(e.ax, e.bx) : Math.max(e.az, e.bz);
      const key = `${e.dir}:${fixed}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key).push([start, end]);
    }
  }

  let totalWallLengthM = 0;
  let exteriorWallLengthM = 0;
  let interiorWallLengthM = 0;
  const mergedSegments = [];

  for (const [key, intervals] of edgeMap.entries()) {
    const [dir, coordStr] = key.split(':');
    const coord = Number(coordStr);
    // Collect all boundary points to detect shared vs single-sided walls
    const points = Array.from(new Set(intervals.flat())).sort((a, b) => a - b);

    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const len = b - a;
      if (len <= 0.01) continue;

      let coverCount = 0;
      for (const [s, e] of intervals) {
        if (s <= a + 0.001 && e >= b - 0.001) coverCount += 1;
      }

      if (coverCount > 0) {
        totalWallLengthM += len;
        const isInterior = coverCount >= 2;
        if (isInterior) interiorWallLengthM += len;
        else exteriorWallLengthM += len;

        mergedSegments.push({
          dir,
          coord,
          start: a,
          end: b,
          length: len,
          isInterior
        });
      }
    }
  }

  const floorAreaM2 = rooms.reduce(
    (sum, r) => sum + (Number(r.width) || 0) * (Number(r.depth) || 0),
    0
  );

  // Bounding box footprint for roof sizing
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const r of rooms) {
    const x1 = Number(r.x) || 0;
    const z1 = Number(r.z) || 0;
    const x2 = x1 + (Number(r.width) || 3);
    const z2 = z1 + (Number(r.depth) || 3);
    minX = Math.min(minX, x1);
    maxX = Math.max(maxX, x2);
    minZ = Math.min(minZ, z1);
    maxZ = Math.max(maxZ, z2);
  }

  const boundingWidthM = rooms.length ? maxX - minX : 0;
  const boundingDepthM = rooms.length ? maxZ - minZ : 0;

  return {
    totalWallLengthM: round2(totalWallLengthM),
    exteriorWallLengthM: round2(exteriorWallLengthM),
    interiorWallLengthM: round2(interiorWallLengthM),
    floorAreaM2: round2(floorAreaM2),
    boundingWidthM: round2(boundingWidthM),
    boundingDepthM: round2(boundingDepthM),
    mergedSegments
  };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function roundUp(n) {
  return Math.ceil(Number(n) || 0);
}

export function computeGeometryFromPlacedPieces(placedPieces = [], fallbackFloorAreaM2 = 0) {
  let epsPanelsPlaced = 0;
  let blockBaysPlaced = 0;
  let singleBlocksPlaced = 0;
  let starterPegsPlaced = 0;
  let doorsPlaced = 0;
  let windowsPlaced = 0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  let totalWallLengthM = 0;
  let singleBlockAreaM2 = 0;

  for (const p of placedPieces) {
    const x = Number(p.x) || 0;
    const z = Number(p.z) || 0;
    const dir = p.dir === 'v' ? 'v' : 'h';

    if (p.type === 'eps_panel') {
      epsPanelsPlaced += 1;
      totalWallLengthM += 1.2;
      const ex = dir === 'h' ? x + 1.2 : x + 0.15;
      const ez = dir === 'v' ? z + 1.2 : z + 0.15;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, ex);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, ez);
    } else if (p.type === 'block_9_bay' || p.type === 'block_6_bay') {
      blockBaysPlaced += 1;
      totalWallLengthM += 0.9;
      const ex = dir === 'h' ? x + 0.9 : x + 0.23;
      const ez = dir === 'v' ? z + 0.9 : z + 0.23;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, ex);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, ez);
    } else if (p.type === 'block_9_single' || p.type === 'block_6_single') {
      singleBlocksPlaced += 1;
      singleBlockAreaM2 += 0.46 * 0.235;
      totalWallLengthM += 0.45;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + 0.45);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z + 0.45);
    } else if (p.type === 'starter_peg') {
      starterPegsPlaced += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + 0.2);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z + 0.2);
    } else if (p.type === 'door') {
      doorsPlaced += 1;
    } else if (p.type === 'window') {
      windowsPlaced += 1;
    }
  }

  const boundingWidthM = Number.isFinite(minX) ? Math.max(1.2, round2(maxX - minX)) : 0;
  const boundingDepthM = Number.isFinite(minZ) ? Math.max(1.2, round2(maxZ - minZ)) : 0;
  const boxArea = boundingWidthM * boundingDepthM;
  const floorAreaM2 = round2(Math.max(fallbackFloorAreaM2 || 0, boxArea));

  return {
    geometry: {
      totalWallLengthM: round2(totalWallLengthM),
      exteriorWallLengthM: round2(totalWallLengthM),
      interiorWallLengthM: 0,
      floorAreaM2,
      boundingWidthM,
      boundingDepthM,
      mergedSegments: []
    },
    counts: {
      epsPanelsPlaced,
      blockBaysPlaced,
      singleBlocksPlaced,
      starterPegsPlaced,
      doorsPlaced,
      windowsPlaced,
      singleBlockAreaM2: round2(singleBlockAreaM2)
    }
  };
}

export function calculateProjectEstimate(input = {}) {
  const cityId = input.city && NIGERIA_CITIES[input.city] ? input.city : 'abuja';
  const cityData = NIGERIA_CITIES[cityId];
  const prices = { ...cityData.prices, ...(input.priceOverrides || {}) };

  const buildMode = input.buildMode === 'piece_by_piece' ? 'piece_by_piece' : 'room_snap';
  const rooms = Array.isArray(input.rooms) ? input.rooms : [];
  const placedPieces = Array.isArray(input.placedPieces) ? input.placedPieces : [];
  const floors = Number(input.floors) === 2 ? 2 : 1;
  const wallHeightM = Math.max(2.4, Math.min(4.2, Number(input.wallHeightM) || 3.0));
  const wallSystem = ['block_6', 'block_9', 'eps_panel'].includes(input.wallSystem)
    ? input.wallSystem
    : 'block_9';
  const roofStyle = ['gable', 'monopitch', 'hip'].includes(input.roofStyle)
    ? input.roofStyle
    : 'gable';
  const wastagePct = Math.max(5, Math.min(20, Number(input.wastagePct) || 10));
  const foundationType =
    input.foundationType && input.foundationType !== 'auto'
      ? input.foundationType
      : wallSystem === 'eps_panel'
        ? 'raft_platform'
        : cityId === 'lagos_island'
          ? 'raft_platform'
          : 'strip';

  const doorAreaEach = 0.9 * 2.1; // 1.89 m2
  const windowAreaEach = 1.2 * 1.2; // 1.44 m2

  let geometry;
  let pieceCounts = null;
  let doorsCount = Math.max(1, Number(input.doorsCount) || Math.max(2, rooms.length + 1));
  let windowsCount = Math.max(1, Number(input.windowsCount) || Math.max(4, rooms.length * 2));
  let grossWallAreaM2;

  if (buildMode === 'piece_by_piece') {
    const pieceRes = computeGeometryFromPlacedPieces(placedPieces, Number(input.platformAreaM2) || 0);
    geometry = pieceRes.geometry;
    pieceCounts = pieceRes.counts;
    doorsCount = Math.max(0, pieceCounts.doorsPlaced || Number(input.doorsCount) || 0);
    windowsCount = Math.max(0, pieceCounts.windowsPlaced || Number(input.windowsCount) || 0);
    const fullModuleLen = pieceCounts.epsPanelsPlaced * 1.2 + pieceCounts.blockBaysPlaced * 0.9;
    grossWallAreaM2 = round2(
      fullModuleLen * wallHeightM * floors + pieceCounts.singleBlockAreaM2 * floors
    );
  } else {
    geometry = computeWallSegmentsFromRooms(rooms);
    grossWallAreaM2 = round2(geometry.totalWallLengthM * wallHeightM * floors);
  }

  const doorsAreaM2 = round2(doorsCount * doorAreaEach * floors);
  const windowsAreaM2 = round2(windowsCount * windowAreaEach * floors);
  const totalOpeningsM2 = round2(Math.min(grossWallAreaM2 * 0.45, doorsAreaM2 + windowsAreaM2));
  const netWallAreaM2 = round2(Math.max(0, grossWallAreaM2 - totalOpeningsM2));

  // Columns count estimate (~1 column every 3.5m of wall intersection/span)
  const columnsCount = Math.max(
    buildMode === 'piece_by_piece' ? 0 : 4,
    Math.ceil(geometry.totalWallLengthM / 3.4)
  );
  const columnWidthM = floors === 2 ? 0.225 : 0.225;
  const columnDepthM = floors === 2 ? 0.3 : 0.225; // 9x12 for G+1, 9x9 for bungalow

  // Compute both wall systems so user gets instant side-by-side comparison
  const block6System = computeBlockQuantities({
    wallType: 'block_6',
    geometry,
    netWallAreaM2,
    floors,
    wallHeightM,
    wastagePct,
    foundationType: input.foundationType === 'raft_platform' || cityId === 'lagos_island' ? 'raft_platform' : 'strip',
    columnsCount,
    columnWidthM,
    columnDepthM,
    prices
  });

  const block9System = computeBlockQuantities({
    wallType: 'block_9',
    geometry,
    netWallAreaM2,
    floors,
    wallHeightM,
    wastagePct,
    foundationType: input.foundationType === 'raft_platform' || cityId === 'lagos_island' ? 'raft_platform' : 'strip',
    columnsCount,
    columnWidthM,
    columnDepthM,
    prices
  });

  const epsSystem = computeEpsQuantities({
    geometry,
    netWallAreaM2,
    floors,
    wallHeightM,
    wastagePct,
    columnsCount,
    prices
  });

  const activeSystem =
    wallSystem === 'eps_panel'
      ? epsSystem
      : wallSystem === 'block_6'
        ? block6System
        : block9System;

  // Suspended decking slab if 2 floors
  const deckingVolumeM3 = floors === 2 ? round2(geometry.floorAreaM2 * 0.15) : 0;
  const deckingCementBags = floors === 2 ? roundUp(deckingVolumeM3 * 7.4) : 0; // 1:2:3 mix = ~7.4 bags/m3
  const deckingRebar12mmBars =
    floors === 2 ? roundUp((geometry.floorAreaM2 * 11.5) / 12) : 0;

  // Staircase (if 2 floors)
  const stairConcreteM3 = floors === 2 ? 1.75 : 0;
  const stairCementBags = floors === 2 ? roundUp(stairConcreteM3 * 7.4) : 0;

  // Roofing calculations (with 0.6m eaves overhang + pitch factor)
  const overhangM = 0.6;
  const roofPlanAreaM2 = round2(
    (geometry.boundingWidthM + overhangM * 2) * (geometry.boundingDepthM + overhangM * 2)
  );
  const pitchFactor = roofStyle === 'monopitch' ? 1.08 : roofStyle === 'hip' ? 1.24 : 1.18;
  const actualRoofAreaM2 = round2(roofPlanAreaM2 * pitchFactor);
  const roofSheetsWithOverlap = roundUp((actualRoofAreaM2 * 1.12) / 2.7); // 0.90m effective x 3.0m = 2.7 m2

  const roofSheetsCost = roundUp(actualRoofAreaM2 * 1.12 * prices.roof_sheet_m2);
  const roofTimberCost = roundUp(actualRoofAreaM2 * prices.timber_truss_m2);
  const carpenterDays = Math.max(3, roundUp(actualRoofAreaM2 / 22));
  const roofLabourCost = carpenterDays * prices.carpenter_day;

  // Fittings, doors, windows, MEP & basic finish allowance
  const totalDoors = doorsCount * floors;
  const totalWindows = windowsCount * floors;
  const doorsWindowsCost = totalDoors * prices.door_unit + totalWindows * prices.window_unit;
  const mepAndFinishCost = roundUp(geometry.floorAreaM2 * floors * prices.mep_finish_m2);

  // Totals for active selection
  const totalCementBags =
    activeSystem.foundationCementBags +
    activeSystem.wallAndPlasterCementBags +
    deckingCementBags +
    stairCementBags;

  // Water: 25L mixing per bag + ~45L curing/wetting per bag equivalent across slab/walls/plaster
  const mixingWaterLitres = totalCementBags * 25;
  const curingWaterLitres = totalCementBags * 45;
  const totalWaterLitres = roundUp(mixingWaterLitres + curingWaterLitres);
  const waterTanks1000L = Math.max(1, roundUp(totalWaterLitres / 1000));
  const waterCost = waterTanks1000L * prices.water_1000l;

  const superstructureDeckingCost =
    deckingCementBags * prices.cement_bag +
    deckingRebar12mmBars * prices.rebar_12mm_12m +
    stairCementBags * prices.cement_bag;

  const substructureCost = activeSystem.foundationCost;
  const wallingCost = activeSystem.wallingCost;
  const roofingCost = roofSheetsCost + roofTimberCost + roofLabourCost;
  const carcassTotal =
    substructureCost + wallingCost + superstructureDeckingCost + roofingCost + waterCost;
  const completeTurnkeyTotal = carcassTotal + doorsWindowsCost + mepAndFinishCost;

  // Thumb-rule sanity check (inspired by Quick Conversion Factors sheet)
  const totalBuiltAreaM2 = round2(geometry.floorAreaM2 * floors);
  const thumbRules = {
    builtAreaM2: totalBuiltAreaM2,
    preliminaryRebarKg: roundUp(totalBuiltAreaM2 * (floors === 2 ? 25 : 11)),
    preliminaryConcreteM3: round2(totalBuiltAreaM2 * (floors === 2 ? 0.23 : 0.14)),
    formworkPlywoodM2: round2(totalBuiltAreaM2 * (floors === 2 ? 2.3 : 0.45)),
    internalPlasterM2: round2(totalBuiltAreaM2 * 3.2),
    externalPlasterM2: round2(totalBuiltAreaM2 * 0.7),
    plasterSandM3: round2(totalBuiltAreaM2 * 3.9 * 0.025)
  };

  // Phased "Build-As-You-Earn" Savings Coach
  const monthlySavings = Math.max(20000, Number(input.monthlySavings) || 150000);
  const startingCash = Math.max(0, Number(input.startingCash) || 0);
  const phases = buildPhasedRoadmap({
    wallSystem,
    substructureCost,
    wallingCost,
    superstructureDeckingCost,
    roofingCost,
    waterCost,
    doorsWindowsCost,
    mepAndFinishCost,
    monthlySavings,
    startingCash
  });

  // Comparison summaries for side-by-side decision making
  const comparison = {
    block_6: summarizeOption(block6System, roofingCost, superstructureDeckingCost, waterCost, doorsWindowsCost, mepAndFinishCost),
    block_9: summarizeOption(block9System, roofingCost, superstructureDeckingCost, waterCost, doorsWindowsCost, mepAndFinishCost),
    eps_panel: summarizeOption(epsSystem, roofingCost, superstructureDeckingCost, waterCost, doorsWindowsCost, mepAndFinishCost)
  };

  return {
    meta: {
      buildMode,
      cityId,
      cityName: cityData.name,
      wallSystem,
      foundationType,
      roofStyle,
      floors,
      wallHeightM,
      wastagePct
    },
    geometry,
    notebookMath: {
      grossWallLengthM: geometry.totalWallLengthM,
      wallHeightM,
      floors,
      grossWallAreaM2,
      doorsCount: totalDoors,
      windowsCount: totalWindows,
      doorsAreaM2,
      windowsAreaM2,
      totalOpeningsM2,
      netWallAreaM2,
      effectiveBlockSizeMm: wallSystem === 'block_6' ? '460 × 235 × 150' : '460 × 235 × 225',
      blocksPerM2: 10,
      epsPanelSizeM: '1.20m × 3.00m (3.60 m²)',
      wastagePct
    },
    quantities: {
      pieceCounts,
      wallUnitsLabel: activeSystem.wallUnitsLabel,
      wallUnitsCount: activeSystem.wallUnitsCount,
      starterPegsCount:
        pieceCounts && pieceCounts.starterPegsPlaced > 0
          ? Math.max(activeSystem.starterPegsCount, pieceCounts.starterPegsPlaced)
          : activeSystem.starterPegsCount,
      meshStripsM: activeSystem.meshStripsM,
      bindingWireRolls: activeSystem.bindingWireRolls,
      cementBags: totalCementBags,
      foundationCementBags: activeSystem.foundationCementBags,
      wallAndPlasterCementBags: activeSystem.wallAndPlasterCementBags,
      sharpSandTippers: activeSystem.sharpSandTippers,
      plasterSandTippers: activeSystem.plasterSandTippers,
      graniteTippers: activeSystem.graniteTippers,
      excavationBankM3: activeSystem.excavationBankM3,
      excavationLooseM3: activeSystem.excavationLooseM3,
      rebar12mmBars: activeSystem.rebar12mmBars + deckingRebar12mmBars,
      rebar10mmBars: activeSystem.rebar10mmBars,
      rebar8mmBars: activeSystem.rebar8mmBars,
      roofPlanAreaM2,
      actualRoofAreaM2,
      roofSheets3m: roofSheetsWithOverlap,
      doorsCount: totalDoors,
      windowsCount: totalWindows,
      waterLitres: totalWaterLitres,
      waterTanks1000L,
      labour: {
        ...activeSystem.labour,
        carpenterDays,
        totalWorkerDays:
          activeSystem.labour.masonOrInstallerDays +
          activeSystem.labour.labourerDays +
          activeSystem.labour.ironbenderDays +
          carpenterDays
      }
    },
    costs: {
      substructureCost,
      wallingCost,
      superstructureDeckingCost,
      roofingCost,
      waterCost,
      carcassTotal,
      doorsWindowsCost,
      mepAndFinishCost,
      completeTurnkeyTotal
    },
    boqLines: [
      ...activeSystem.boqLines,
      ...(floors === 2
        ? [
            {
              stage: 'Decking & Staircase',
              item: 'Suspended Slab & RCC Staircase Concrete + Rebar',
              qty: `${deckingCementBags + stairCementBags} bags + ${deckingRebar12mmBars} bars (12mm)`,
              amount: superstructureDeckingCost
            }
          ]
        : []),
      {
        stage: 'Roofing',
        item: `${roofStyle.toUpperCase()} Roof Sheets (effective 2.7m²/sheet w/ overlaps)`,
        qty: `${roofSheetsWithOverlap} sheets (${actualRoofAreaM2} m²)`,
        amount: roofSheetsCost
      },
      {
        stage: 'Roofing',
        item: 'Treated Timber Trusses (Ridge, Rafters, Purlins, Fascia, Ties)',
        qty: `${actualRoofAreaM2} m² roof span`,
        amount: roofTimberCost
      },
      {
        stage: 'Roofing',
        item: 'Carpentry Roofing Labour',
        qty: `${carpenterDays} carpenter-days`,
        amount: roofLabourCost
      },
      {
        stage: 'Site Water',
        item: 'Mixing (25L/bag) & 7–14 Day Curing Water Supply',
        qty: `${totalWaterLitres.toLocaleString()} L (${waterTanks1000L} × 1,000L tanks)`,
        amount: waterCost
      },
      {
        stage: 'Doors & Windows',
        item: 'Doors & Sliding Aluminium Windows (installed)',
        qty: `${totalDoors} doors, ${totalWindows} windows`,
        amount: doorsWindowsCost
      },
      {
        stage: 'MEP & Finishing',
        item: 'Plumbing, Water Tank Piping, Septic, Wiring, Tiling & Painting',
        qty: `${totalBuiltAreaM2} m² built area`,
        amount: mepAndFinishCost
      }
    ],
    comparison,
    thumbRules,
    phases,
    cityGuide: {
      soilProfile: cityData.soilProfile,
      recommendedFoundation: cityData.recommendedFoundation,
      approvals: cityData.approvals,
      localSuppliers: cityData.localSuppliers
    },
    pricesUsed: prices
  };
}

function computeBlockQuantities({
  wallType,
  geometry,
  netWallAreaM2,
  floors,
  wallHeightM,
  wastagePct,
  foundationType,
  columnsCount,
  columnWidthM,
  columnDepthM,
  prices
}) {
  const is9 = wallType === 'block_9';
  const blockPrice = is9 ? prices.block_9_inch : prices.block_6_inch;
  const label = is9 ? '9-inch Hollow Sandcrete Blocks' : '6-inch Hollow Sandcrete Blocks';

  // Substructure: excavation + strip footing + 4 courses plinth + 125mm German floor
  const trenchLen = geometry.totalWallLengthM;
  const trenchWidth = foundationType === 'raft_platform' ? 0.5 : 0.45;
  const trenchDepth = foundationType === 'raft_platform' ? 0.6 : 1.0;
  const excavationBankM3 = round2(trenchLen * trenchWidth * trenchDepth);
  const excavationLooseM3 = round2(excavationBankM3 * 1.3);

  const footingConcreteM3 =
    foundationType === 'raft_platform'
      ? round2(geometry.floorAreaM2 * 0.2 + trenchLen * 0.3 * 0.3)
      : round2(trenchLen * trenchWidth * 0.2 + geometry.floorAreaM2 * 0.125);
  const foundationCementBags = roundUp(footingConcreteM3 * 7.0); // 1:2:4 / 1:2:3 blend
  const plinthBlocks = roundUp(trenchLen * 0.9 * 10 * 1.05); // 4 courses = ~0.9m high

  // Superstructure blocks
  const basicWallBlocks = roundUp(netWallAreaM2 * 10);
  const wallBlocksWithWastage = roundUp(basicWallBlocks * (1 + wastagePct / 100));
  const totalBlocks = plinthBlocks + wallBlocksWithWastage;

  // Mortar + Columns + Lintels + Plastering cement
  const mortarCementBags = roundUp((totalBlocks / 65) * 1.05);
  const columnsConcreteM3 = round2(columnsCount * columnWidthM * columnDepthM * wallHeightM * floors);
  const lintelConcreteM3 = round2(geometry.totalWallLengthM * 0.225 * 0.225 * floors);
  const rcCementBags = roundUp((columnsConcreteM3 + lintelConcreteM3) * 7.4);
  const plasterAreaM2 = round2(netWallAreaM2 * 2); // inside + outside faces
  const plasterCementBags = roundUp(plasterAreaM2 * 0.19);
  const wallAndPlasterCementBags = mortarCementBags + rcCementBags + plasterCementBags;

  // Aggregates
  const totalConcreteM3 = footingConcreteM3 + columnsConcreteM3 + lintelConcreteM3;
  const sharpSandM3 = round2(totalConcreteM3 * 0.52 + totalBlocks * 0.0025);
  const plasterSandM3 = round2(plasterAreaM2 * 0.025);
  const graniteM3 = round2(totalConcreteM3 * 0.78);
  const sharpSandTippers = Math.max(1, roundUp(sharpSandM3 / 12)); // ~12 m3 per 20T tipper
  const plasterSandTippers = Math.max(1, roundUp(plasterSandM3 / 12));
  const graniteTippers = Math.max(1, roundUp(graniteM3 / 12));

  // Rebar (columns, lintels, foundation)
  const rebar12mmBars = roundUp(
    (columnsCount * 4 * (wallHeightM * floors + 0.8)) / 12 +
      (geometry.totalWallLengthM * 4 * floors) / 12 +
      (foundationType === 'raft_platform' ? (geometry.floorAreaM2 * 8) / 12 : (trenchLen * 3) / 12)
  );
  const rebar10mmBars = roundUp((geometry.floorAreaM2 * 3.5) / 12);
  const rebar8mmBars = roundUp(((columnsCount * 22 * floors + trenchLen * 4) * 0.9) / 12);

  // Labour
  const masonOrInstallerDays = Math.max(6, roundUp(totalBlocks / 95 + plasterAreaM2 / 24));
  const labourerDays = Math.max(8, roundUp(masonOrInstallerDays * 1.4));
  const ironbenderDays = Math.max(3, roundUp((rebar12mmBars + rebar8mmBars) / 22));

  const foundationCost =
    foundationCementBags * prices.cement_bag +
    plinthBlocks * prices.block_9_inch +
    roundUp(excavationBankM3 * 3500) +
    roundUp(sharpSandTippers * 0.5 * prices.sharp_sand_tipper) +
    roundUp(graniteTippers * 0.7 * prices.granite_20mm_tipper);

  const wallingMaterialsCost =
    wallBlocksWithWastage * blockPrice +
    wallAndPlasterCementBags * prices.cement_bag +
    roundUp(sharpSandTippers * 0.5 * prices.sharp_sand_tipper) +
    plasterSandTippers * prices.plaster_sand_tipper +
    roundUp(graniteTippers * 0.3 * prices.granite_20mm_tipper) +
    rebar12mmBars * prices.rebar_12mm_12m +
    rebar10mmBars * prices.rebar_10mm_12m +
    rebar8mmBars * prices.rebar_8mm_12m;

  const labourCost =
    masonOrInstallerDays * prices.mason_day +
    labourerDays * prices.labourer_day +
    ironbenderDays * prices.ironbender_day;

  const wallingCost = wallingMaterialsCost + labourCost;

  return {
    wallUnitsLabel: label,
    wallUnitsCount: totalBlocks,
    starterPegsCount: 0,
    meshStripsM: 0,
    bindingWireRolls: Math.max(1, roundUp((rebar12mmBars + rebar8mmBars) / 45)),
    foundationCementBags,
    wallAndPlasterCementBags,
    sharpSandTippers,
    plasterSandTippers,
    graniteTippers,
    excavationBankM3,
    excavationLooseM3,
    rebar12mmBars,
    rebar10mmBars,
    rebar8mmBars,
    estimatedDays: Math.max(18, roundUp(masonOrInstallerDays * 1.5)),
    labour: {
      masonOrInstallerDays,
      labourerDays,
      ironbenderDays
    },
    foundationCost,
    wallingCost,
    boqLines: [
      {
        stage: 'Substructure / Foundation',
        item: `Excavation (${excavationBankM3}m³ bank / ${excavationLooseM3}m³ loose), Footing, Plinth & German Floor`,
        qty: `${foundationCementBags} bags cement + ${plinthBlocks} plinth blocks`,
        amount: foundationCost
      },
      {
        stage: 'Walls & Structural Frame',
        item: `${label} (incl. ${wastagePct}% wastage)`,
        qty: `${wallBlocksWithWastage.toLocaleString()} blocks`,
        amount: wallBlocksWithWastage * blockPrice
      },
      {
        stage: 'Walls & Structural Frame',
        item: 'Mortar, Columns, Lintels & Two-Side Plastering Cement',
        qty: `${wallAndPlasterCementBags} bags (50kg)`,
        amount: wallAndPlasterCementBags * prices.cement_bag
      },
      {
        stage: 'Aggregates & Rebar',
        item: 'Sharp Sand, Plaster Sand, 20mm Granite & TMT Iron Rods',
        qty: `${rebar12mmBars + rebar10mmBars + rebar8mmBars} rods (12m) + tippers`,
        amount:
          roundUp(sharpSandTippers * 0.5 * prices.sharp_sand_tipper) +
          plasterSandTippers * prices.plaster_sand_tipper +
          roundUp(graniteTippers * 0.3 * prices.granite_20mm_tipper) +
          rebar12mmBars * prices.rebar_12mm_12m +
          rebar10mmBars * prices.rebar_10mm_12m +
          rebar8mmBars * prices.rebar_8mm_12m
      },
      {
        stage: 'Masonry & Steel Labour',
        item: 'Masons, Site Labourers & Iron Benders',
        qty: `${masonOrInstallerDays}m / ${labourerDays}l / ${ironbenderDays}ib days`,
        amount: labourCost
      }
    ]
  };
}

function computeEpsQuantities({
  geometry,
  netWallAreaM2,
  floors,
  wallHeightM,
  wastagePct,
  prices
}) {
  const trenchLen = geometry.totalWallLengthM;
  // Raised concrete foundation platform (175mm slab + edge beam)
  const excavationBankM3 = round2(trenchLen * 0.35 * 0.45);
  const excavationLooseM3 = round2(excavationBankM3 * 1.3);
  const platformConcreteM3 = round2(geometry.floorAreaM2 * 0.175 + trenchLen * 0.3 * 0.3);
  const foundationCementBags = roundUp(platformConcreteM3 * 7.4); // 1:2:3 structural platform

  // Starter iron pegs inserted/anchored along every wall centreline (@ 350mm c/c, 0.65m peg length)
  const starterPegsCount = roundUp(trenchLen / 0.35);
  const pegRebar10mmBars = roundUp((starterPegsCount * 0.65) / 12);
  const platformRebar12mmBars = roundUp((geometry.floorAreaM2 * 6.5) / 12);
  const platformRebar8mmBars = roundUp((trenchLen * 2.5) / 12);

  // EPS 3D panels (1.2m x 3.0m = 3.6 m2)
  const epsAreaWithWasteM2 = round2(netWallAreaM2 * (1 + Math.min(wastagePct, 8) / 100));
  const epsPanelsCount = roundUp(epsAreaWithWasteM2 / 3.6);
  const meshStripsM = roundUp(trenchLen * 2 + wallHeightM * floors * 14);
  const bindingWireRolls = Math.max(2, roundUp(epsAreaWithWasteM2 / 90));

  // Shotcrete / two-coat cement-sand plaster (~35mm each face = 70mm total thickness)
  const shotcreteMortarM3 = round2(netWallAreaM2 * 0.07);
  const wallAndPlasterCementBags = roundUp(shotcreteMortarM3 * 8.5); // 1:4 cement/sharp sand rich mortar

  const sharpSandM3 = round2(platformConcreteM3 * 0.51 + shotcreteMortarM3 * 1.05);
  const graniteM3 = round2(platformConcreteM3 * 0.77);
  const sharpSandTippers = Math.max(1, roundUp(sharpSandM3 / 12));
  const plasterSandTippers = 1; // Finishing skim coat
  const graniteTippers = Math.max(1, roundUp(graniteM3 / 12));

  // Faster installation labour (EPS mounts 2x-3x faster than block laying)
  const masonOrInstallerDays = Math.max(4, roundUp(netWallAreaM2 / 38));
  const labourerDays = Math.max(5, roundUp(masonOrInstallerDays * 1.25));
  const ironbenderDays = Math.max(2, roundUp((platformRebar12mmBars + pegRebar10mmBars) / 24));

  const foundationCost =
    foundationCementBags * prices.cement_bag +
    roundUp(excavationBankM3 * 3500) +
    platformRebar12mmBars * prices.rebar_12mm_12m +
    pegRebar10mmBars * prices.rebar_10mm_12m +
    platformRebar8mmBars * prices.rebar_8mm_12m +
    roundUp(sharpSandTippers * 0.45 * prices.sharp_sand_tipper) +
    graniteTippers * prices.granite_20mm_tipper;

  const panelsCost = roundUp(epsAreaWithWasteM2 * prices.eps_panel_m2);
  const accessoriesCost =
    meshStripsM * prices.eps_mesh_strip_m + bindingWireRolls * prices.binding_wire_roll;
  const shotcreteCost =
    wallAndPlasterCementBags * prices.cement_bag +
    roundUp(sharpSandTippers * 0.55 * prices.sharp_sand_tipper) +
    plasterSandTippers * prices.plaster_sand_tipper;
  const labourCost =
    roundUp(epsAreaWithWasteM2 * prices.eps_install_m2) +
    labourerDays * prices.labourer_day +
    ironbenderDays * prices.ironbender_day;

  const wallingCost = panelsCost + accessoriesCost + shotcreteCost + labourCost;

  return {
    wallUnitsLabel: '3D Wire-Mesh EPS Panels (1.2m × 3.0m)',
    wallUnitsCount: epsPanelsCount,
    starterPegsCount,
    meshStripsM,
    bindingWireRolls,
    foundationCementBags,
    wallAndPlasterCementBags,
    sharpSandTippers,
    plasterSandTippers,
    graniteTippers,
    excavationBankM3,
    excavationLooseM3,
    rebar12mmBars: platformRebar12mmBars,
    rebar10mmBars: pegRebar10mmBars,
    rebar8mmBars: platformRebar8mmBars,
    estimatedDays: Math.max(10, roundUp(masonOrInstallerDays * 1.3)),
    labour: {
      masonOrInstallerDays,
      labourerDays,
      ironbenderDays
    },
    foundationCost,
    wallingCost,
    boqLines: [
      {
        stage: 'EPS Concrete Platform & Starter Pegs',
        item: `Raised 175mm RC Platform + ${starterPegsCount} Starter Iron Pegs (@350mm c/c)`,
        qty: `${foundationCementBags} bags cement + ${platformRebar12mmBars + pegRebar10mmBars} rods`,
        amount: foundationCost
      },
      {
        stage: 'EPS Polystyrene Wall System',
        item: 'Structural 3D EPS Wire-Mesh Panels (local factory cut)',
        qty: `${epsPanelsCount} panels (${epsAreaWithWasteM2} m²)`,
        amount: panelsCost
      },
      {
        stage: 'EPS Polystyrene Wall System',
        item: 'Corner/Splice U-Mesh Strips & Galvanized Binding Wire',
        qty: `${meshStripsM}m mesh + ${bindingWireRolls} rolls wire`,
        amount: accessoriesCost
      },
      {
        stage: 'Shotcrete & Plastering',
        item: 'Two-Coat Cement + Sharp Sand Shotcrete Mortar & Skim Sand',
        qty: `${wallAndPlasterCementBags} bags cement + sand tippers`,
        amount: shotcreteCost
      },
      {
        stage: 'EPS Installation Labour',
        item: 'Trained EPS Installers, Shotcrete Crew & Platform Steel Fixers',
        qty: `${masonOrInstallerDays} crew-days (${epsAreaWithWasteM2} m²)`,
        amount: labourCost
      }
    ]
  };
}

function summarizeOption(sys, roofingCost, deckingCost, waterCost, doorsWindowsCost, mepCost) {
  const carcassTotal =
    sys.foundationCost + sys.wallingCost + deckingCost + roofingCost + waterCost;
  return {
    wallUnitsLabel: sys.wallUnitsLabel,
    wallUnitsCount: sys.wallUnitsCount,
    foundationCost: sys.foundationCost,
    wallingCost: sys.wallingCost,
    carcassTotal,
    completeTurnkeyTotal: carcassTotal + doorsWindowsCost + mepCost,
    estimatedDays: sys.estimatedDays
  };
}

function buildPhasedRoadmap({
  wallSystem,
  substructureCost,
  wallingCost,
  superstructureDeckingCost,
  roofingCost,
  waterCost,
  doorsWindowsCost,
  mepAndFinishCost,
  monthlySavings,
  startingCash
}) {
  const isEps = wallSystem === 'eps_panel';
  const rawPhases = [
    {
      step: 1,
      title: isEps
        ? 'Cast Foundation Platform & Insert Starter Iron Pegs'
        : 'Setting Out, Trenching, Strip Footing & German Floor',
      cost: substructureCost + Math.round(waterCost * 0.35),
      pauseSafe:
        'SAFE TO PAUSE HERE: Water/cure concrete for 7 days. Coat exposed starter pegs/rebar with neat cement slurry or anti-rust primer so rain will not corrode them while you save for the walls.',
      diyTip:
        'DIY Savings: Do plot clearing, mark corners with the 3-4-5 rope method, check trench levels with a ₦3,000 transparent water hose, and handle daily concrete watering yourself.'
    },
    {
      step: 2,
      title: isEps
        ? 'Mount EPS Wire-Mesh Panels, Conduits & Shotcrete Plaster'
        : 'Raise Block Walls, Columns, Lintels & Plaster',
      cost: wallingCost + superstructureDeckingCost + Math.round(waterCost * 0.45),
      pauseSafe:
        'Keep mortar/cement dry; do NOT stockpile bags of cement early (cement cakes in 6–8 weeks). Buy iron rods or mould blocks on-site instead of holding cash in damp storage.',
      diyTip:
        'DIY Savings: Use the 180° Spirit Level reversal check on every course, count bags per block batch (max 30 blocks/bag for 9"), and run PVC electrical conduits before EPS shotcreting.'
    },
    {
      step: 3,
      title: 'Roofing Trusses & Sheet Lock-Up (Weather-Tight Milestone)',
      cost: roofingCost + Math.round(waterCost * 0.2),
      pauseSafe:
        'CRITICAL MILESTONE: Once roofed, rain can no longer wash away mortar or soak EPS/blocks. Treat all timber rafters with anti-termite solution before sheeting.',
      diyTip:
        'DIY Savings: Measure roof slope area yourself (`Effective Width × Length`) and check rubber-washer roofing screws are fastened on sheet crests, not valleys.'
    },
    {
      step: 4,
      title: 'Security Doors & Windows (Move-In Ready Shell)',
      cost: doorsWindowsCost,
      pauseSafe:
        'Once exterior doors and windows are fixed, your site is secure against theft—you can install a toilet + sink and even move in while finishing room-by-room to stop paying rent!',
      diyTip:
        'DIY Savings: Paint priming, burglar-proof measurements, and basic site cleanup can be done yourself.'
    },
    {
      step: 5,
      title: 'Plumbing, Water Tank, Septic, Wiring, Tiling & Paint',
      cost: mepAndFinishCost,
      pauseSafe:
        'Finish one bedroom + bathroom + kitchen first ("Starter-Home Mode") so you stop paying annual rent immediately and redirect rent money into finishing the remaining rooms.',
      diyTip:
        'DIY Savings: Verify tank pipe layout (Air Vent, Overflow with insect mesh, Inlet, Outlet), and handle interior wall painting yourself.'
    }
  ];

  let cashPool = startingCash;
  let cumulativeMonths = 0;

  return rawPhases.map((p) => {
    const netNeeded = Math.max(0, p.cost - cashPool);
    cashPool = Math.max(0, cashPool - p.cost);
    const monthsToSave = Math.ceil(netNeeded / monthlySavings);
    cumulativeMonths += monthsToSave;
    return {
      ...p,
      netNeededFromSavings: netNeeded,
      monthsToSave,
      cumulativeMonths
    };
  });
}
