/**
 * Where a query ran, from the `x-sanity-shard` header: `gcp-eu-w1-01-prod-1028` is a shard in
 * Google Cloud's `europe-west1` region. Coordinates are the regions' data center locations.
 */

export interface ApiRegion {
  /** `europe-west1` */
  id: string
  /** `St. Ghislain, Belgium` */
  location: string
  latitude: number
  longitude: number
}

const GCP_REGIONS: Record<string, Omit<ApiRegion, 'id'>> = {
  'asia-east1': {location: 'Changhua County, Taiwan', latitude: 24.07, longitude: 120.54},
  'asia-east2': {location: 'Hong Kong', latitude: 22.32, longitude: 114.17},
  'asia-northeast1': {location: 'Tokyo, Japan', latitude: 35.69, longitude: 139.69},
  'asia-south1': {location: 'Mumbai, India', latitude: 19.08, longitude: 72.88},
  'asia-southeast1': {location: 'Jurong West, Singapore', latitude: 1.35, longitude: 103.7},
  'australia-southeast1': {location: 'Sydney, Australia', latitude: -33.87, longitude: 151.21},
  'europe-north1': {location: 'Hamina, Finland', latitude: 60.57, longitude: 27.2},
  'europe-west1': {location: 'St. Ghislain, Belgium', latitude: 50.47, longitude: 3.82},
  'europe-west2': {location: 'London, United Kingdom', latitude: 51.51, longitude: -0.13},
  'europe-west3': {location: 'Frankfurt, Germany', latitude: 50.11, longitude: 8.68},
  'europe-west4': {location: 'Eemshaven, Netherlands', latitude: 53.44, longitude: 6.83},
  'northamerica-northeast1': {location: 'Montréal, Canada', latitude: 45.5, longitude: -73.57},
  'southamerica-east1': {location: 'São Paulo, Brazil', latitude: -23.55, longitude: -46.63},
  'us-central1': {location: 'Council Bluffs, Iowa, USA', latitude: 41.26, longitude: -95.86},
  'us-east1': {location: 'Moncks Corner, South Carolina, USA', latitude: 33.2, longitude: -80.01},
  'us-east4': {location: 'Ashburn, Virginia, USA', latitude: 39.04, longitude: -77.49},
  'us-west1': {location: 'The Dalles, Oregon, USA', latitude: 45.6, longitude: -121.18},
  'us-west2': {location: 'Los Angeles, California, USA', latitude: 34.05, longitude: -118.24},
}

const CONTINENTS: Record<string, string> = {
  as: 'asia',
  au: 'australia',
  eu: 'europe',
  na: 'northamerica',
  sa: 'southamerica',
  us: 'us',
}

const DIRECTIONS: Record<string, string> = {
  c: 'central',
  e: 'east',
  n: 'north',
  ne: 'northeast',
  nw: 'northwest',
  s: 'south',
  se: 'southeast',
  sw: 'southwest',
  w: 'west',
}

const SHARD = /^gcp-([a-z]+)-([a-z]+?)(\d+)-/

/** The Google Cloud region of a shard, `europe-west1` for `gcp-eu-w1-01-prod-1028` */
export function regionOfShard(shard: string | undefined): ApiRegion | undefined {
  const match = shard ? SHARD.exec(shard) : null
  if (!match) return undefined
  const [, continent, direction, number] = match
  if (!CONTINENTS[continent] || !DIRECTIONS[direction]) return undefined
  const id = `${CONTINENTS[continent]}-${DIRECTIONS[direction]}${number}`
  const region = GCP_REGIONS[id]
  return region ? {id, ...region} : undefined
}
