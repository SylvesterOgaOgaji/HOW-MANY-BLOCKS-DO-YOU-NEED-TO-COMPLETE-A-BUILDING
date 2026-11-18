/**
 * Nigerian Survey Beacon Geometry + Wind / Sun / Borehole-Septic Advisor
 * Pure JavaScript so both Node.js Express and Cloudflare Workers run identical math.
 */

const EARTH_RADIUS_M = 6378137;

export const CITY_COORDINATES = {
  abuja: { lat: 9.05785, lng: 7.49508, name: 'Abuja (FCT)' },
  lagos_mainland: { lat: 6.6018, lng: 3.3515, name: 'Lagos Mainland (Ikeja)' },
  lagos_island: { lat: 6.4474, lng: 3.5419, name: 'Lagos Island / Lekki' },
  portharcourt: { lat: 4.8156, lng: 7.0498, name: 'Port Harcourt' },
  enugu: { lat: 6.4584, lng: 7.5464, name: 'Enugu' },
  kano: { lat: 12.0022, lng: 8.592, name: 'Kano' }
};

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Parse Google Maps URLs (`@lat,lng`, `?q=lat,lng`) or raw `lat, lng` coordinates.
 */
export function parseGoogleMapsOrCoords(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();

  // Match @lat,lng or q=lat,lng or direct "lat, lng"
  const match = cleaned.match(/(-?\d{1,2}\.\d{3,})\s*[,;\s]\s*(-?\d{1,3}\.\d{3,})/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat: round2(lat * 1000) / 1000, lng: round2(lng * 1000) / 1000, rawLat: lat, rawLng: lng };
}

/**
 * Create a clean rectangular 4-beacon plot around a center GPS point.
 */
export function createBeaconsForLand(centerLat, centerLng, widthM = 15, depthM = 30) {
  const latRad = (centerLat * Math.PI) / 180;
  const dLat = (depthM / 2 / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLng = (widthM / 2 / (EARTH_RADIUS_M * Math.cos(latRad))) * (180 / Math.PI);

  return [
    { id: 'B1', label: 'Beacon 1 (NW)', lat: Number((centerLat + dLat).toFixed(6)), lng: Number((centerLng - dLng).toFixed(6)) },
    { id: 'B2', label: 'Beacon 2 (NE)', lat: Number((centerLat + dLat).toFixed(6)), lng: Number((centerLng + dLng).toFixed(6)) },
    { id: 'B3', label: 'Beacon 3 (SE)', lat: Number((centerLat - dLat).toFixed(6)), lng: Number((centerLng + dLng).toFixed(6)) },
    { id: 'B4', label: 'Beacon 4 (SW)', lat: Number((centerLat - dLat).toFixed(6)), lng: Number((centerLng - dLng).toFixed(6)) }
  ];
}

/**
 * Project GPS beacons to local flat meters and compute polygon area, perimeter, edge bearings, and bounding dimensions.
 */
export function analyzeBeaconPolygon(beacons = []) {
  if (!Array.isArray(beacons) || beacons.length < 3) {
    return {
      valid: false,
      error: 'At least 3 survey beacons are required to measure a land polygon.'
    };
  }

  const lat0 = beacons.reduce((s, b) => s + Number(b.lat || 0), 0) / beacons.length;
  const lng0 = beacons.reduce((s, b) => s + Number(b.lng || 0), 0) / beacons.length;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);

  const pts = beacons.map((b, idx) => {
    const dLat = ((Number(b.lat) - lat0) * Math.PI) / 180;
    const dLng = ((Number(b.lng) - lng0) * Math.PI) / 180;
    const x = dLng * EARTH_RADIUS_M * cosLat; // East (+X)
    const y = dLat * EARTH_RADIUS_M; // North (+Y)
    return {
      id: b.id || `B${idx + 1}`,
      lat: Number(b.lat),
      lng: Number(b.lng),
      x,
      y
    };
  });

  // Shoelace area formula
  let sum = 0;
  let perimeterM = 0;
  const edges = [];

  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    perimeterM += len;

    // Compass bearing (0° = North, 90° = East)
    let bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (bearing < 0) bearing += 360;

    edges.push({
      from: a.id,
      to: b.id,
      lengthM: round2(len),
      bearingDeg: Math.round(bearing)
    });
  }

  const areaM2 = round2(Math.abs(sum) / 2);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const widthM = Math.max(6, round2(maxX - minX));
  const depthM = Math.max(8, round2(maxY - minY));

  return {
    valid: true,
    center: { lat: Number(lat0.toFixed(6)), lng: Number(lng0.toFixed(6)) },
    areaM2,
    plots450Equivalent: round2(areaM2 / 450),
    perimeterM: round2(perimeterM),
    widthM,
    depthM,
    edges,
    localPoints: pts.map((p) => ({
      id: p.id,
      x: round2(p.x - minX),
      z: round2(maxY - p.y) // Z grows Southward in Three.js plot coordinates
    }))
  };
}

/**
 * Nigeria-specific Wind, Sun & Water/Soakaway Placement Advisor.
 * - SW Monsoon (April–October): Cool humid breeze coming from ~225° (South-West -> North-East)
 * - NE Harmattan (November–March): Dusty dry wind coming from ~45° (North-East -> South-West)
 * - Hygiene rule: Borehole upwind/high side, Septic Soakaway downwind >= 15m away.
 */
export function computeWindSunSiteAdvice({
  lat = 9.05785,
  landWidthM = 15,
  landDepthM = 30,
  slopeHighEdge = 'south'
}) {
  const isNorthernDryBelt = Number(lat) >= 8.5; // Abuja / Kano experience heavier Harmattan dust

  // Place Borehole on West / South-West upwind corner; Septic on North-East downwind corner
  const boreholePos = {
    x: round2(Math.min(landWidthM - 1.5, 2.0)),
    z: round2(Math.max(2.5, landDepthM - 2.5)),
    zoneLabel: 'South-West / Front Upwind Corner'
  };

  const septicPos = {
    x: round2(Math.max(2.0, landWidthM - 2.2)),
    z: round2(Math.min(landDepthM - 2.5, 2.4)),
    zoneLabel: 'North-East / Rear Downwind Corner'
  };

  const separationM = round2(
    Math.hypot(septicPos.x - boreholePos.x, septicPos.z - boreholePos.z)
  );
  const safeSeparation = separationM >= 15;

  // Optimal facing rotates front lounge slightly South-South-East (~15°–20°) to capture SW cross-breeze
  // while reducing harsh late-afternoon West sun heat on long living-room glazing.
  const recommendedHouseRotationDeg = isNorthernDryBelt ? 15 : 10;

  return {
    climateRegion: isNorthernDryBelt
      ? 'Guinea / Sudan Savanna (Strong Harmattan + High Afternoon Sun)'
      : 'Humid Tropical Belt (Strong South-West Monsoon Breeze)',
    winds: {
      monsoon: {
        name: 'South-West Monsoon (Cool Wet Season Wind)',
        fromCompass: 'SW (225°)',
        months: 'April – October',
        advice: 'Open large casement/sliding parlour & bedroom windows toward South/South-West for natural cross-ventilation.'
      },
      harmattan: {
        name: 'North-East Harmattan (Dry Dusty Wind)',
        fromCompass: 'NE (45°)',
        months: 'November – March',
        advice: isNorthernDryBelt
          ? 'Keep fewer/smaller windows on the North-East wall and use toilets/store as a dust buffer zone.'
          : 'Moderate Harmattan dust in Dec–Feb; orient service rooms or blank staircase walls toward NE.'
      }
    },
    sunPath: {
      morning: 'East (90°) — pleasant morning light for Kitchen & Breakfast dining.',
      afternoon: 'West (270°) — intense afternoon thermal heat; minimize huge unshaded West glazing or use 650mm roof overhang / EPS insulation!'
    },
    recommendedHouseRotationDeg,
    slopeHighEdge,
    boreholePos,
    septicPos,
    separationM,
    safeSeparation,
    hygieneNote: safeSeparation
      ? `Safe ${separationM}m separation between Borehole (${boreholePos.zoneLabel}) and Soakaway (${septicPos.zoneLabel}) exceeds the 15m WHO/Nigerian minimum!`
      : `Plot span gives ${separationM}m separation (< 15m). Use a sealed bio-digester septic tank + deep grout-cased borehole (>40m) to prevent groundwater contamination.`
  };
}

export function analyzeSiteLocation(input = {}) {
  const cityId = input.city && CITY_COORDINATES[input.city] ? input.city : 'abuja';
  const defaultCoord = CITY_COORDINATES[cityId];

  const parsed = input.coordQuery ? parseGoogleMapsOrCoords(input.coordQuery) : null;
  const centerLat = Number(input.lat) || parsed?.rawLat || defaultCoord.lat;
  const centerLng = Number(input.lng) || parsed?.rawLng || defaultCoord.lng;

  const beacons =
    Array.isArray(input.beacons) && input.beacons.length >= 3
      ? input.beacons
      : createBeaconsForLand(centerLat, centerLng, Number(input.widthM) || 15, Number(input.depthM) || 30);

  const polygon = analyzeBeaconPolygon(beacons);
  const advice = computeWindSunSiteAdvice({
    lat: polygon.valid ? polygon.center.lat : centerLat,
    landWidthM: polygon.valid ? polygon.widthM : 15,
    landDepthM: polygon.valid ? polygon.depthM : 30,
    slopeHighEdge: input.slopeHighEdge || 'south'
  });

  return {
    cityId,
    beacons,
    polygon,
    advice
  };
}
