/**
 * Roughly where the browser is, from its time zone: the zone's city for the common ones, the
 * middle of its continent otherwise. Good enough to draw the query's way on a globe without
 * asking for the user's location.
 */

export interface ApproximateLocation {
  latitude: number
  longitude: number
}

const ZONES: Record<string, [number, number]> = {
  'Africa/Cairo': [30.04, 31.24],
  'Africa/Johannesburg': [-26.2, 28.05],
  'Africa/Lagos': [6.52, 3.38],
  'Africa/Nairobi': [-1.29, 36.82],
  'America/Argentina/Buenos_Aires': [-34.6, -58.38],
  'America/Bogota': [4.71, -74.07],
  'America/Chicago': [41.88, -87.63],
  'America/Denver': [39.74, -104.99],
  'America/Halifax': [44.65, -63.58],
  'America/Los_Angeles': [34.05, -118.24],
  'America/Mexico_City': [19.43, -99.13],
  'America/New_York': [40.71, -74.01],
  'America/Phoenix': [33.45, -112.07],
  'America/Santiago': [-33.45, -70.67],
  'America/Sao_Paulo': [-23.55, -46.63],
  'America/Toronto': [43.65, -79.38],
  'America/Vancouver': [49.28, -123.12],
  'Asia/Bangkok': [13.76, 100.5],
  'Asia/Dubai': [25.2, 55.27],
  'Asia/Hong_Kong': [22.32, 114.17],
  'Asia/Jakarta': [-6.21, 106.85],
  'Asia/Jerusalem': [31.77, 35.21],
  'Asia/Kolkata': [22.57, 88.36],
  'Asia/Manila': [14.6, 120.98],
  'Asia/Seoul': [37.57, 126.98],
  'Asia/Shanghai': [31.23, 121.47],
  'Asia/Singapore': [1.35, 103.82],
  'Asia/Taipei': [25.03, 121.57],
  'Asia/Tokyo': [35.69, 139.69],
  'Atlantic/Reykjavik': [64.15, -21.94],
  'Australia/Brisbane': [-27.47, 153.03],
  'Australia/Melbourne': [-37.81, 144.96],
  'Australia/Perth': [-31.95, 115.86],
  'Australia/Sydney': [-33.87, 151.21],
  'Europe/Amsterdam': [52.37, 4.9],
  'Europe/Athens': [37.98, 23.73],
  'Europe/Berlin': [52.52, 13.41],
  'Europe/Brussels': [50.85, 4.35],
  'Europe/Copenhagen': [55.68, 12.57],
  'Europe/Dublin': [53.35, -6.26],
  'Europe/Helsinki': [60.17, 24.94],
  'Europe/Istanbul': [41.01, 28.98],
  'Europe/Lisbon': [38.72, -9.14],
  'Europe/London': [51.51, -0.13],
  'Europe/Madrid': [40.42, -3.7],
  'Europe/Oslo': [59.91, 10.75],
  'Europe/Paris': [48.86, 2.35],
  'Europe/Prague': [50.08, 14.44],
  'Europe/Rome': [41.9, 12.5],
  'Europe/Stockholm': [59.33, 18.07],
  'Europe/Vienna': [48.21, 16.37],
  'Europe/Warsaw': [52.23, 21.01],
  'Europe/Zurich': [47.38, 8.54],
  'Pacific/Auckland': [-36.85, 174.76],
  'Pacific/Honolulu': [21.31, -157.86],
}

const CONTINENTS: Record<string, [number, number]> = {
  Africa: [2, 20],
  America: [39, -98],
  Antarctica: [-75, 0],
  Asia: [30, 100],
  Atlantic: [40, -30],
  Australia: [-25, 134],
  Europe: [50, 10],
  Indian: [-20, 75],
  Pacific: [-15, -150],
}

export function locationOfTimeZone(timeZone: string | undefined): ApproximateLocation | undefined {
  if (!timeZone) return undefined
  const [latitude, longitude] = ZONES[timeZone] ?? CONTINENTS[timeZone.split('/')[0]] ?? []
  return latitude === undefined ? undefined : {latitude, longitude}
}

export function browserLocation(): ApproximateLocation | undefined {
  try {
    return locationOfTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return undefined
  }
}
