#!/usr/bin/env tsx
/**
 * Seeds the `pokemon` workspace with every Pokémon, type, ability, move and generation in PokéAPI.
 * See `../README.md` for how to run it.
 */
import {createHash} from 'node:crypto'
import {writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {parseArgs} from 'node:util'

import {createClient, type SanityClient} from '@sanity/client'

import {POKEMON_ID_PREFIX} from '../constants'
import {buildDocuments, type ImageSource} from './build'
import {type Doc, reference, STALE_TIERS, validateDocuments} from './integrity'
import {readPng} from './png'
import {CACHE_DIR, getImage, mapConcurrent} from './pokeapi'

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

const CONCURRENCY = Number(args.concurrency)
const LIMIT = args.limit ? Number(args.limit) : undefined
/** Keeps every transaction well below the API's request size limit. */
const MAX_TRANSACTION_BYTES = 2_000_000

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
    filename: `${key.replace(POKEMON_ID_PREFIX, '').replace(/[._:]/g, '-')}.png`,
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

/** Splits documents into batches of at most 100 documents and `MAX_TRANSACTION_BYTES`. */
function batchBySize(docs: Doc[]): Doc[][] {
  const batches: Doc[][] = []
  let current: Doc[] = []
  let bytes = 0
  for (const doc of docs) {
    const size = Buffer.byteLength(JSON.stringify(doc))
    if (current.length > 0 && (current.length >= 100 || bytes + size > MAX_TRANSACTION_BYTES)) {
      batches.push(current)
      current = []
      bytes = 0
    }
    current.push(doc)
    bytes += size
  }
  if (current.length > 0) batches.push(current)
  return batches
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
  await mapConcurrent(missing, CONCURRENCY, async (image) => {
    const asset = await client.assets.upload('image', image.buffer, {filename: image.filename})
    if (asset._id !== image.assetId) {
      throw new Error(`Expected asset ${image.assetId} for ${image.filename}, got ${asset._id}`)
    }
    if (++done % 100 === 0) console.log(`  ${done}/${missing.length}`)
  })
}

async function writeDocuments(client: SanityClient, label: string, docs: Doc[]) {
  console.log(`Writing ${docs.length} ${label}…`)
  for (const batch of batchBySize(docs)) {
    const transaction = client.transaction()
    batch.forEach((doc) => transaction.createOrReplace(doc))
    await transaction.commit({visibility: 'async'})
  }
}

/**
 * Removes documents of the Pokédex types that were not written by this script and would clash
 * with it, such as the ones an earlier version of it wrote under ids that contained dots. Deletes
 * in the order of `STALE_TIERS`.
 */
async function pruneStaleDocuments(client: SanityClient) {
  const stale = await client.fetch<{_id: string; _type: string}[]>(
    `*[_type in $types
      && !string::startsWith(_id, $prefix) && !string::startsWith(_id, $draftPrefix)]{_id, _type}`,
    {
      types: STALE_TIERS.map((tier) => tier.type),
      prefix: POKEMON_ID_PREFIX,
      draftPrefix: `drafts.${POKEMON_ID_PREFIX}`,
    },
  )
  if (stale.length === 0) return
  console.log(`Deleting ${stale.length} stale documents that were not created by this script…`)
  for (const tier of STALE_TIERS) {
    const tierIds = stale.filter((doc) => doc._type === tier.type).map((doc) => doc._id)
    if (tier.unset.length > 0) {
      for (const batch of chunk(tierIds, 100)) {
        const transaction = client.transaction()
        batch.forEach((id) => transaction.patch(id, {unset: tier.unset}))
        await transaction.commit({visibility: 'sync'})
      }
    }
    for (const batch of chunk(tierIds, 100)) {
      const transaction = client.transaction()
      batch.forEach((id) => transaction.delete(id))
      await transaction.commit({visibility: 'sync'})
    }
  }
}

async function main() {
  const started = Date.now()
  const {generationDocs, typeDocs, abilityDocs, moveDocs, pokemonDocs, images} =
    await buildDocuments({limit: LIMIT, concurrency: CONCURRENCY})
  const docs = [...generationDocs, ...typeDocs, ...abilityDocs, ...moveDocs, ...pokemonDocs]

  const {references} = validateDocuments(docs)
  console.log(
    `Checked ${docs.length} documents and ${references} references: no dotted ids, every reference resolves and agrees with the prune order`,
  )

  console.log(`Downloading ${images.size} images…`)
  const resolved = new Map(
    await mapConcurrent([...images], CONCURRENCY, async ([key, source]) => {
      return [key, await resolveImage(key, source)] as const
    }),
  )

  const counts = `${pokemonDocs.length} Pokémon, ${moveDocs.length} moves, ${abilityDocs.length} abilities, ${typeDocs.length} types and ${generationDocs.length} generations`

  if (args['dry-run']) {
    applyImages([...typeDocs, ...pokemonDocs], resolved, true)
    const file = join(CACHE_DIR, 'pokedex.ndjson')
    const ndjson = `${docs.map((doc) => JSON.stringify(doc)).join('\n')}\n`
    await writeFile(file, ndjson)
    console.log(
      `Wrote ${counts} (${(Buffer.byteLength(ndjson) / 1e6).toFixed(1)} MB) to ${file} in ${((Date.now() - started) / 1000).toFixed(1)}s`,
    )
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
  await writeDocuments(client, 'moves', moveDocs)
  // Evolutions reference other Pokémon, so they're written once every Pokémon exists
  await writeDocuments(
    client,
    'Pokémon',
    pokemonDocs.map(({evolvesFrom: _evolvesFrom, evolutions: _evolutions, ...doc}) => doc),
  )
  await writeDocuments(client, 'Pokémon with their evolutions', pokemonDocs)

  console.log(
    `Done: ${counts} in ${args['project-id']}/${args.dataset} in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  )
}

await main()
