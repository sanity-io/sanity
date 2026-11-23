#!/usr/bin/env tsx
/**
 * Seeds the `pokemon` workspace with every Pokémon, type, ability and generation in PokéAPI.
 * See `../README.md` for how to run it.
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'

import {createClient, type SanityClient} from '@sanity/client'

import {
  EVOLUTION_TRIGGERS,
  POKEMON_ID_PREFIX,
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_NAMES,
  type PokemonTypeName,
} from '../constants'
import {readPng} from './png'

const {values: args} = parseArgs({
  options: {
    'project-id': {type: 'string', default: 'ppsg7ml5'},
    'dataset': {type: 'string', default: 'pokedex'},
    'limit': {type: 'string'},
    'concurrency': {type: 'string', default: '8'},
    'dry-run': {type: 'boolean', default: false},
    'no-prune': {type: 'boolean', default: false},
  },
})

const API = 'https://pokeapi.co/api/v2'
const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.cache')
const CONCURRENCY = Number(args.concurrency)
const LIMIT = args.limit ? Number(args.limit) : undefined

const ids = {
  pokemon: (name: string) => `${POKEMON_ID_PREFIX}species.${name}`,
  type: (name: string) => `${POKEMON_ID_PREFIX}type.${name}`,
  ability: (name: string) => `${POKEMON_ID_PREFIX}ability.${name}`,
  generation: (number: number) => `${POKEMON_ID_PREFIX}generation.${number}`,
}

/* -------------------------------------------------------------------------------------------- */
/* PokéAPI                                                                                       */
/* -------------------------------------------------------------------------------------------- */

interface NamedResource {
  name: string
  url: string
}

interface LocalizedName {
  name: string
  language: NamedResource
}

interface Species {
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
  growth_rate: NamedResource | null
  egg_groups: NamedResource[]
  color: NamedResource | null
  shape: NamedResource | null
  habitat: NamedResource | null
  evolves_from_species: NamedResource | null
  evolution_chain: {url: string} | null
  flavor_text_entries: {flavor_text: string; language: NamedResource; version: NamedResource}[]
  varieties: {is_default: boolean; pokemon: NamedResource}[]
}

interface Pokemon {
  height: number
  weight: number
  types: {slot: number; type: NamedResource}[]
  abilities: {is_hidden: boolean; slot: number; ability: NamedResource}[]
  stats: {base_stat: number; stat: NamedResource}[]
  cries: {latest: string | null; legacy: string | null}
  sprites: {
    front_default: string | null
    other: {
      'official-artwork': {front_default: string | null}
      'home': {front_default: string | null}
    }
  }
}

interface EvolutionDetail {
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
}

interface ChainLink {
  species: NamedResource
  evolution_details: EvolutionDetail[]
  evolves_to: ChainLink[]
}

interface Ability {
  name: string
  names: LocalizedName[]
  generation: NamedResource
  effect_entries: {effect: string; short_effect: string; language: NamedResource}[]
  flavor_text_entries: {flavor_text: string; language: NamedResource}[]
}

interface TypeResource {
  name: string
  names: LocalizedName[]
  damage_relations: Record<
    | 'double_damage_to'
    | 'half_damage_to'
    | 'no_damage_to'
    | 'double_damage_from'
    | 'half_damage_from'
    | 'no_damage_from',
    NamedResource[]
  >
  sprites: Record<string, Record<string, {symbol_icon?: string | null} | undefined> | undefined>
}

interface Generation {
  id: number
  names: LocalizedName[]
  main_region: NamedResource
  version_groups: NamedResource[]
}

async function cached<T>(key: string, load: () => Promise<T>, encode: (value: T) => Buffer) {
  const file = join(CACHE_DIR, key)
  try {
    return await readFile(file)
  } catch {
    const value = await load()
    await mkdir(dirname(file), {recursive: true})
    const buffer = encode(value)
    await writeFile(file, buffer)
    return buffer
  }
}

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url)
    if (response.ok) return response
    if (attempt >= 4 || response.status === 404) {
      throw new Error(`GET ${url} failed with ${response.status}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt))
  }
}

async function getJson<T>(url: string): Promise<T> {
  const path = url.replace(API, '').replace(/^\/|\/$/g, '')
  const buffer = await cached(
    `api/${path.replace(/[/?=&]/g, '_')}.json`,
    async () => (await fetchWithRetry(url)).text(),
    (text) => Buffer.from(text),
  )
  return JSON.parse(buffer.toString()) as T
}

async function getImage(url: string): Promise<Buffer> {
  const key = createHash('sha1').update(url).digest('hex')
  return cached(
    `images/${key}.png`,
    async () => Buffer.from(await (await fetchWithRetry(url)).arrayBuffer()),
    (buffer) => buffer,
  )
}

async function mapConcurrent<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>) {
  const results: R[] = Array.from({length: items.length})
  let next = 0
  await Promise.all(
    Array.from({length: Math.min(CONCURRENCY, items.length)}, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await fn(items[index], index)
      }
    }),
  )
  return results
}

function english<T extends {language: NamedResource}>(entries: T[]): T | undefined {
  return entries.find((entry) => entry.language.name === 'en')
}

function latestEnglish<T extends {language: NamedResource}>(entries: T[]): T | undefined {
  return entries.findLast((entry) => entry.language.name === 'en')
}

function cleanText(text: string | undefined) {
  return text
    ?.replace(/\u00ad\n/g, '')
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(name: string) {
  return name
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

function idFromUrl(url: string) {
  return Number(url.replace(/\/$/, '').split('/').pop())
}

/* -------------------------------------------------------------------------------------------- */
/* Documents                                                                                     */
/* -------------------------------------------------------------------------------------------- */

interface ImageSource {
  url: string
  /** Crops the image to its visible pixels, for sprites that are mostly transparent padding. */
  cropToContent: boolean
}

type Doc = Record<string, unknown> & {_id: string; _type: string}

const reference = (_ref: string, _key?: string) => ({_type: 'reference', _ref, ...(_key && {_key})})

function describeEvolution(detail: EvolutionDetail, versionNames: Map<string, string>) {
  const named = (resource: NamedResource | null) =>
    resource ? (versionNames.get(resource.name) ?? titleCase(resource.name)) : undefined
  const conditions = [
    detail.gender === 1 && 'female',
    detail.gender === 2 && 'male',
    detail.held_item && `holding ${named(detail.held_item)}`,
    detail.known_move && `knowing ${named(detail.known_move)}`,
    detail.known_move_type && `knowing a ${named(detail.known_move_type)}-type move`,
    detail.location && `at ${named(detail.location)}`,
    detail.min_happiness && 'high friendship',
    detail.min_beauty && 'high beauty',
    detail.min_affection && 'high affection',
    detail.needs_overworld_rain && 'while raining',
    detail.party_species && `with ${named(detail.party_species)} in the party`,
    detail.party_type && `with a ${named(detail.party_type)}-type in the party`,
    detail.relative_physical_stats === 1 && 'Attack higher than Defense',
    detail.relative_physical_stats === -1 && 'Defense higher than Attack',
    detail.relative_physical_stats === 0 && 'Attack equal to Defense',
    detail.time_of_day && `during the ${detail.time_of_day}`,
    detail.trade_species && `traded for ${named(detail.trade_species)}`,
    detail.turn_upside_down && 'with the console upside down',
  ].filter((condition): condition is string => typeof condition === 'string' && condition !== '')
  const trigger = EVOLUTION_TRIGGERS.some((option) => option.value === detail.trigger.name)
    ? detail.trigger.name
    : 'other'
  return {
    trigger,
    ...(detail.min_level && {minLevel: detail.min_level}),
    ...(detail.item && {item: named(detail.item)}),
    ...(conditions.length > 0 && {condition: conditions.join(', ')}),
  }
}

async function buildDocuments() {
  const {results: generationList} = await getJson<{results: NamedResource[]}>(
    `${API}/generation?limit=100`,
  )
  const generations = await mapConcurrent(generationList, (g) => getJson<Generation>(g.url))
  const versionGroups = await mapConcurrent(
    generations.flatMap((generation) => generation.version_groups),
    (group) => getJson<{name: string; versions: NamedResource[]}>(group.url),
  )
  const versions = await mapConcurrent(
    versionGroups.flatMap((group) => group.versions),
    (version) => getJson<{name: string; names: LocalizedName[]}>(version.url),
  )
  const versionNames = new Map(
    versions.map((version) => [version.name, english(version.names)?.name ?? version.name]),
  )
  const generationIds = new Map(generations.map((g) => [g.id, ids.generation(g.id)]))

  const generationDocs: Doc[] = generations.map((generation) => ({
    _id: ids.generation(generation.id),
    _type: 'pokemonGeneration',
    name: english(generation.names)?.name ?? `Generation ${generation.id}`,
    number: generation.id,
    region: titleCase(generation.main_region.name),
    games: generation.version_groups.flatMap(
      (group) =>
        versionGroups
          .find((candidate) => candidate.name === group.name)
          ?.versions.map((version) => versionNames.get(version.name) ?? version.name) ?? [],
    ),
  }))

  const types = await mapConcurrent([...POKEMON_TYPE_NAMES], (name) =>
    getJson<TypeResource>(`${API}/type/${name}`),
  )
  const typeNames = new Set<string>(POKEMON_TYPE_NAMES)
  const typeRefs = (relations: NamedResource[]) =>
    relations
      .filter((relation) => typeNames.has(relation.name))
      .map((relation) => reference(ids.type(relation.name), relation.name))
  const images = new Map<string, ImageSource>()
  const typeDocs: Doc[] = types.map((type) => {
    const icon =
      type.sprites['generation-ix']?.['scarlet-violet']?.symbol_icon ??
      Object.values(type.sprites['generation-ix'] ?? {}).find((sprite) => sprite?.symbol_icon)
        ?.symbol_icon
    const id = ids.type(type.name)
    if (icon) images.set(`${id}:icon`, {url: icon, cropToContent: false})
    return {
      _id: id,
      _type: 'pokemonType',
      name: english(type.names)?.name ?? titleCase(type.name),
      slug: {_type: 'slug', current: type.name},
      color: POKEMON_TYPE_COLORS[type.name as PokemonTypeName],
      strongAgainst: typeRefs(type.damage_relations.double_damage_to),
      notVeryEffectiveAgainst: typeRefs(type.damage_relations.half_damage_to),
      noEffectAgainst: typeRefs(type.damage_relations.no_damage_to),
      weakTo: typeRefs(type.damage_relations.double_damage_from),
      resistantTo: typeRefs(type.damage_relations.half_damage_from),
      immuneTo: typeRefs(type.damage_relations.no_damage_from),
    }
  })

  const {results: speciesList} = await getJson<{results: NamedResource[]}>(
    `${API}/pokemon-species?limit=100000`,
  )
  const selectedSpecies = speciesList
    .toSorted((a, b) => idFromUrl(a.url) - idFromUrl(b.url))
    .slice(0, LIMIT)
  console.log(`Fetching ${selectedSpecies.length} Pokémon from PokéAPI…`)
  const species = await mapConcurrent(selectedSpecies, (s) => getJson<Species>(s.url))
  const pokemon = await mapConcurrent(species, (s) =>
    getJson<Pokemon>((s.varieties.find((v) => v.is_default) ?? s.varieties[0]).pokemon.url),
  )
  const speciesNames = new Set(species.map((s) => s.name))

  const abilityUrls = [
    ...new Map(pokemon.flatMap((p) => p.abilities.map((a) => [a.ability.name, a.ability.url]))),
  ]
  console.log(`Fetching ${abilityUrls.length} abilities…`)
  const abilities = await mapConcurrent(abilityUrls, ([, url]) => getJson<Ability>(url))
  const abilityDocs: Doc[] = abilities.map((ability) => {
    const effect = english(ability.effect_entries)
    return {
      _id: ids.ability(ability.name),
      _type: 'pokemonAbility',
      name: english(ability.names)?.name ?? titleCase(ability.name),
      slug: {_type: 'slug', current: ability.name},
      generation: reference(generationIds.get(idFromUrl(ability.generation.url))!),
      shortEffect: cleanText(effect?.short_effect),
      effect: cleanText(effect?.effect),
      flavorText: cleanText(latestEnglish(ability.flavor_text_entries)?.flavor_text),
    }
  })

  const chainUrls = [...new Set(species.flatMap((s) => s.evolution_chain?.url ?? []))]
  console.log(`Fetching ${chainUrls.length} evolution chains…`)
  const chains = await mapConcurrent(chainUrls, (url) => getJson<{chain: ChainLink}>(url))
  const evolutionsBySpecies = new Map<string, ChainLink[]>()
  const walk = (link: ChainLink) => {
    evolutionsBySpecies.set(link.species.name, link.evolves_to)
    link.evolves_to.forEach(walk)
  }
  chains.forEach((chain) => walk(chain.chain))

  const pokemonDocs: Doc[] = species.map((s, index) => {
    const p = pokemon[index]
    const id = ids.pokemon(s.name)
    const name = english(s.names)?.name ?? titleCase(s.name)
    const stat = (statName: string) =>
      p.stats.find((entry) => entry.stat.name === statName)?.base_stat
    const flavorText = latestEnglish(s.flavor_text_entries)
    const artwork =
      p.sprites.other['official-artwork'].front_default ?? p.sprites.other.home.front_default
    const icon = p.sprites.front_default ?? p.sprites.other.home.front_default ?? artwork
    if (artwork) images.set(`${id}:artwork`, {url: artwork, cropToContent: false})
    if (icon) images.set(`${id}:icon`, {url: icon, cropToContent: true})

    const evolutions = (evolutionsBySpecies.get(s.name) ?? [])
      .filter((link) => speciesNames.has(link.species.name))
      .map((link) => {
        const details =
          link.evolution_details.find((detail) => detail.is_default) ?? link.evolution_details[0]
        return {
          _type: 'pokemonEvolution',
          _key: link.species.name,
          pokemon: reference(ids.pokemon(link.species.name)),
          ...(details ? describeEvolution(details, versionNames) : {trigger: 'other'}),
        }
      })

    return {
      _id: id,
      _type: 'pokemon',
      name,
      slug: {_type: 'slug', current: s.name},
      nationalDexNumber: s.id,
      genus: english(s.genera)?.genus,
      types: p.types
        .toSorted((a, b) => a.slot - b.slot)
        .map((t) => reference(ids.type(t.type.name), t.type.name)),
      generation: reference(generationIds.get(idFromUrl(s.generation.url))!),
      isBaby: s.is_baby,
      isLegendary: s.is_legendary,
      isMythical: s.is_mythical,
      flavorText: cleanText(flavorText?.flavor_text),
      flavorTextGame: flavorText ? versionNames.get(flavorText.version.name) : undefined,
      height: p.height / 10,
      weight: p.weight / 10,
      color: s.color?.name,
      shape: s.shape?.name,
      habitat: s.habitat?.name,
      baseStats: {
        _type: 'pokemonBaseStats',
        hp: stat('hp'),
        attack: stat('attack'),
        defense: stat('defense'),
        specialAttack: stat('special-attack'),
        specialDefense: stat('special-defense'),
        speed: stat('speed'),
      },
      abilities: p.abilities
        .toSorted((a, b) => a.slot - b.slot)
        .map((a) => ({
          _type: 'pokemonAbilitySlot',
          _key: a.ability.name,
          ability: reference(ids.ability(a.ability.name)),
          isHidden: a.is_hidden,
        })),
      evolvesFrom:
        s.evolves_from_species && speciesNames.has(s.evolves_from_species.name)
          ? reference(ids.pokemon(s.evolves_from_species.name))
          : undefined,
      evolutions,
      captureRate: s.capture_rate,
      baseHappiness: s.base_happiness ?? undefined,
      growthRate: s.growth_rate?.name,
      eggGroups: s.egg_groups.map((group) => group.name),
      eggCycles: s.hatch_counter ?? undefined,
      genderless: s.gender_rate === -1,
      femaleRatio: s.gender_rate === -1 ? undefined : (s.gender_rate / 8) * 100,
      cry: p.cries.latest ?? p.cries.legacy ?? undefined,
      ...(artwork && {artwork: {_type: 'image', alt: `Official artwork of ${name}`}}),
      ...(icon && {icon: {_type: 'image'}}),
    }
  })

  return {generationDocs, typeDocs, abilityDocs, pokemonDocs, images}
}

/* -------------------------------------------------------------------------------------------- */
/* Images                                                                                        */
/* -------------------------------------------------------------------------------------------- */

interface ResolvedImage {
  url: string
  assetId: string
  buffer: Buffer
  filename: string
  crop?: {top: number; bottom: number; left: number; right: number}
  hotspot?: {x: number; y: number; width: number; height: number}
}

const round = (value: number) => Math.round(value * 10_000) / 10_000

async function resolveImage(key: string, source: ImageSource): Promise<ResolvedImage> {
  const buffer = await getImage(source.url)
  const {width, height, bounds} = readPng(buffer)
  const sha1 = createHash('sha1').update(buffer).digest('hex')
  const resolved: ResolvedImage = {
    url: source.url,
    assetId: `image-${sha1}-${width}x${height}-png`,
    buffer,
    filename: `${key.replace(POKEMON_ID_PREFIX, '').replace(/[.:]/g, '-')}.png`,
  }
  if (!source.cropToContent || !bounds) return resolved

  // A square around the visible pixels, with a little breathing room, so the sprite fills the
  // preview instead of sitting small in a mostly transparent canvas
  const contentWidth = bounds.right - bounds.left
  const contentHeight = bounds.bottom - bounds.top
  const size = Math.min(Math.max(contentWidth, contentHeight) * 1.1 + 2, width, height)
  const centerX = bounds.left + contentWidth / 2
  const centerY = bounds.top + contentHeight / 2
  const left = Math.min(Math.max(centerX - size / 2, 0), width - size)
  const top = Math.min(Math.max(centerY - size / 2, 0), height - size)
  resolved.crop = {
    left: round(left / width),
    top: round(top / height),
    right: round(1 - (left + size) / width),
    bottom: round(1 - (top + size) / height),
  }
  resolved.hotspot = {
    x: round(centerX / width),
    y: round(centerY / height),
    width: round(contentWidth / width),
    height: round(contentHeight / height),
  }
  return resolved
}

/**
 * Points every image field at its asset. With `assetUrls`, the fields carry the `_sanityAsset`
 * URLs that `sanity dataset import` downloads and uploads, instead of references to uploaded
 * assets.
 */
function applyImages(docs: Doc[], images: Map<string, ResolvedImage>, assetUrls: boolean) {
  for (const doc of docs) {
    for (const field of ['artwork', 'icon']) {
      const image = images.get(`${doc._id}:${field}`)
      if (!image) continue
      doc[field] = {
        ...(doc[field] as Record<string, unknown> | undefined),
        _type: 'image',
        ...(assetUrls ? {_sanityAsset: `image@${image.url}`} : {asset: reference(image.assetId)}),
        ...(image.crop && {crop: {_type: 'sanity.imageCrop', ...image.crop}}),
        ...(image.hotspot && {hotspot: {_type: 'sanity.imageHotspot', ...image.hotspot}}),
      }
    }
  }
}

/* -------------------------------------------------------------------------------------------- */
/* Writing                                                                                       */
/* -------------------------------------------------------------------------------------------- */

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({length: Math.ceil(items.length / size)}, (_, i) =>
    items.slice(i * size, i * size + size),
  )
}

async function uploadImages(client: SanityClient, images: ResolvedImage[]) {
  const unique = [...new Map(images.map((image) => [image.assetId, image])).values()]
  const existing = new Set<string>()
  for (const batch of chunk(unique, 500)) {
    const found = await client.fetch<string[]>('*[_id in $ids]._id', {
      ids: batch.map((image) => image.assetId),
    })
    found.forEach((id) => existing.add(id))
  }
  const missing = unique.filter((image) => !existing.has(image.assetId))
  console.log(`Uploading ${missing.length} images (${existing.size} already in the dataset)…`)
  let done = 0
  await mapConcurrent(missing, async (image) => {
    const asset = await client.assets.upload('image', image.buffer, {filename: image.filename})
    if (asset._id !== image.assetId) {
      throw new Error(`Expected asset ${image.assetId} for ${image.filename}, got ${asset._id}`)
    }
    if (++done % 100 === 0) console.log(`  ${done}/${missing.length}`)
  })
}

async function writeDocuments(client: SanityClient, label: string, docs: Doc[]) {
  console.log(`Writing ${docs.length} ${label}…`)
  for (const batch of chunk(docs, 100)) {
    const transaction = client.transaction()
    batch.forEach((doc) => transaction.createOrReplace(doc))
    await transaction.commit({visibility: 'async'})
  }
}

/** Removes `pokemon` documents that were not written by this script and would clash with it. */
async function pruneStaleDocuments(client: SanityClient) {
  const stale = await client.fetch<string[]>(
    `*[_type in ["pokemon", "pokemonType", "pokemonAbility", "pokemonGeneration"]
      && !(_id in path($prefix)) && !(_id in path($draftPrefix))]._id`,
    {prefix: `${POKEMON_ID_PREFIX}**`, draftPrefix: `drafts.${POKEMON_ID_PREFIX}**`},
  )
  if (stale.length === 0) return
  console.log(`Deleting ${stale.length} stale documents that were not created by this script…`)
  for (const batch of chunk(stale, 100)) {
    const transaction = client.transaction()
    batch.forEach((id) => transaction.delete(id))
    await transaction.commit({visibility: 'async'})
  }
}

async function main() {
  const {generationDocs, typeDocs, abilityDocs, pokemonDocs, images} = await buildDocuments()

  console.log(`Downloading ${images.size} images…`)
  const resolved = new Map(
    await mapConcurrent([...images], async ([key, source]) => {
      return [key, await resolveImage(key, source)] as const
    }),
  )

  if (args['dry-run']) {
    applyImages([...typeDocs, ...pokemonDocs], resolved, true)
    const file = join(CACHE_DIR, 'pokedex.ndjson')
    const docs = [...generationDocs, ...typeDocs, ...abilityDocs, ...pokemonDocs]
    await writeFile(file, `${docs.map((doc) => JSON.stringify(doc)).join('\n')}\n`)
    console.log(`Wrote ${docs.length} documents to ${file}`)
    return
  }

  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) {
    throw new Error('Set SANITY_AUTH_TOKEN to a token with write access to the dataset')
  }
  const client = createClient({
    projectId: args['project-id'],
    dataset: args.dataset,
    apiVersion: '2025-02-19',
    token,
    useCdn: false,
  })

  await uploadImages(client, [...resolved.values()])
  applyImages([...typeDocs, ...pokemonDocs], resolved, false)

  if (!args['no-prune']) await pruneStaleDocuments(client)

  await writeDocuments(client, 'generations', generationDocs)
  // Types reference each other, so they go in one transaction
  console.log(`Writing ${typeDocs.length} types…`)
  const typeTransaction = client.transaction()
  typeDocs.forEach((doc) => typeTransaction.createOrReplace(doc))
  await typeTransaction.commit({visibility: 'async'})
  await writeDocuments(client, 'abilities', abilityDocs)
  // Evolutions reference other Pokémon, so they're written once every Pokémon exists
  await writeDocuments(
    client,
    'Pokémon',
    pokemonDocs.map(({evolvesFrom: _evolvesFrom, evolutions: _evolutions, ...doc}) => doc),
  )
  await writeDocuments(client, 'Pokémon with their evolutions', pokemonDocs)

  console.log(
    `Done: ${pokemonDocs.length} Pokémon, ${typeDocs.length} types, ${abilityDocs.length} abilities and ${generationDocs.length} generations in ${args['project-id']}/${args.dataset}`,
  )
}

await main()
