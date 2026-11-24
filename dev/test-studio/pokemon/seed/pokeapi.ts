/**
 * A cached, retrying PokéAPI client and the shapes of the responses the seed reads.
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

export const API = 'https://pokeapi.co/api/v2'
export const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.cache')

const MAX_ATTEMPTS = 5
const REQUEST_TIMEOUT = 30_000

export interface NamedResource {
  name: string
  url: string
}

export interface LocalizedName {
  name: string
  language: NamedResource
}

export interface FlavorTextEntry {
  flavor_text: string
  language: NamedResource
  version?: NamedResource
  version_group?: NamedResource
}

export interface EffectEntry {
  effect: string
  short_effect: string
  language: NamedResource
}

export interface Species {
  id: number
  name: string
  names: LocalizedName[]
  genera: {genus: string; language: NamedResource}[]
  generation: NamedResource
  is_baby: boolean
  is_legendary: boolean
  is_mythical: boolean
  gender_rate: number
  capture_rate: number
  base_happiness: number | null
  hatch_counter: number | null
  has_gender_differences: boolean
  forms_switchable: boolean
  growth_rate: NamedResource | null
  egg_groups: NamedResource[]
  color: NamedResource | null
  shape: NamedResource | null
  habitat: NamedResource | null
  evolves_from_species: NamedResource | null
  evolution_chain: {url: string} | null
  flavor_text_entries: FlavorTextEntry[]
  form_descriptions: {description: string; language: NamedResource}[]
  varieties: {is_default: boolean; pokemon: NamedResource}[]
}

export interface Pokemon {
  name: string
  is_default: boolean
  base_experience: number | null
  height: number
  weight: number
  species: NamedResource
  types: {slot: number; type: NamedResource}[]
  abilities: {is_hidden: boolean; slot: number; ability: NamedResource}[]
  stats: {base_stat: number; effort: number; stat: NamedResource}[]
  held_items: {item: NamedResource}[]
  moves: {
    move: NamedResource
    version_group_details: {
      level_learned_at: number
      move_learn_method: NamedResource
      version_group: NamedResource
    }[]
  }[]
  cries: {latest: string | null; legacy: string | null}
  sprites: {
    front_default: string | null
    other: {
      'official-artwork': {front_default: string | null}
      'home': {front_default: string | null}
    }
  }
}

export interface EvolutionDetail {
  trigger: NamedResource
  is_default?: boolean
  min_level: number | null
  item: NamedResource | null
  held_item: NamedResource | null
  gender: number | null
  known_move: NamedResource | null
  known_move_type: NamedResource | null
  location: NamedResource | null
  min_happiness: number | null
  min_beauty: number | null
  min_affection: number | null
  needs_overworld_rain: boolean
  party_species: NamedResource | null
  party_type: NamedResource | null
  relative_physical_stats: number | null
  time_of_day: string
  trade_species: NamedResource | null
  turn_upside_down: boolean
  near_special_rock?: boolean
  needs_multiplayer?: boolean
  region?: NamedResource | null
  used_move?: NamedResource | null
  min_move_count?: number | null
  min_steps?: number | null
  min_damage_taken?: number | null
}

export interface ChainLink {
  species: NamedResource
  evolution_details: EvolutionDetail[]
  evolves_to: ChainLink[]
}

export interface Ability {
  name: string
  names: LocalizedName[]
  is_main_series: boolean
  generation: NamedResource
  effect_entries: EffectEntry[]
  flavor_text_entries: FlavorTextEntry[]
}

export type DamageRelation =
  | 'double_damage_to'
  | 'half_damage_to'
  | 'no_damage_to'
  | 'double_damage_from'
  | 'half_damage_from'
  | 'no_damage_from'

export interface TypeResource {
  name: string
  names: LocalizedName[]
  generation: NamedResource
  move_damage_class: NamedResource | null
  damage_relations: Record<DamageRelation, NamedResource[]>
  sprites: Record<string, Record<string, {symbol_icon?: string | null} | undefined> | undefined>
}

export interface Move {
  id: number
  name: string
  names: LocalizedName[]
  accuracy: number | null
  effect_chance: number | null
  pp: number | null
  priority: number
  power: number | null
  damage_class: NamedResource | null
  type: NamedResource
  target: NamedResource
  generation: NamedResource
  effect_entries: EffectEntry[]
  flavor_text_entries: FlavorTextEntry[]
  stat_changes: {change: number; stat: NamedResource}[]
  learned_by_pokemon: NamedResource[]
  meta: {
    ailment: NamedResource
    category: NamedResource
    min_hits: number | null
    max_hits: number | null
    drain: number
    healing: number
    crit_rate: number
    ailment_chance: number
    flinch_chance: number
    stat_chance: number
  } | null
}

export interface Generation {
  id: number
  names: LocalizedName[]
  main_region: NamedResource
  version_groups: NamedResource[]
  pokemon_species: NamedResource[]
  moves: NamedResource[]
  abilities: NamedResource[]
  types: NamedResource[]
}

export interface VersionGroup {
  name: string
  order: number
  versions: NamedResource[]
}

export interface Version {
  name: string
  names: LocalizedName[]
}

/** Reads `key` from the cache, or loads, caches and returns it. */
async function cached(key: string, load: () => Promise<Buffer>): Promise<Buffer> {
  const file = join(CACHE_DIR, key)
  try {
    return await readFile(file)
  } catch {
    const buffer = await load()
    await mkdir(dirname(file), {recursive: true})
    // Written to a temporary file first, so an interrupted run never leaves a truncated entry
    const temporary = `${file}.${process.pid}.tmp`
    await writeFile(temporary, buffer)
    await rename(temporary, file)
    return buffer
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    let response: Response | undefined
    let error: unknown
    try {
      response = await fetch(url, {signal: AbortSignal.timeout(REQUEST_TIMEOUT)})
    } catch (err) {
      error = err
    }
    if (response?.ok) return response
    if (response?.status === 404 || attempt >= MAX_ATTEMPTS) {
      throw new Error(
        `GET ${url} failed ${response ? `with ${response.status}` : `(${String(error)})`}`,
      )
    }
    const retryAfter = Number(response?.headers.get('retry-after'))
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt)
  }
}

export async function getJson<T>(url: string): Promise<T> {
  const path = url.replace(API, '').replace(/^\/|\/$/g, '')
  const buffer = await cached(`api/${path.replace(/[/?=&]/g, '_')}.json`, async () =>
    Buffer.from(await (await fetchWithRetry(url)).text()),
  )
  return JSON.parse(buffer.toString()) as T
}

export async function getImage(url: string): Promise<Buffer> {
  const key = createHash('sha1').update(url).digest('hex')
  return cached(`images/${key}.png`, async () =>
    Buffer.from(await (await fetchWithRetry(url)).arrayBuffer()),
  )
}

/** Maps `items` with at most `concurrency` calls of `fn` in flight, keeping the order. */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = Array.from({length: items.length})
  let next = 0
  await Promise.all(
    Array.from({length: Math.min(concurrency, items.length)}, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await fn(items[index], index)
      }
    }),
  )
  return results
}

export function idFromUrl(url: string): number {
  return Number(url.replace(/\/$/, '').split('/').pop())
}
