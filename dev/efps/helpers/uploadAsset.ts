import {createHash} from 'node:crypto'
import fs from 'node:fs'

import {
  type SanityAssetDocument,
  type SanityClient,
  type SanityImageAssetDocument,
} from '@sanity/client'

interface UploadEntry {
  filePath: string
  options?: {source?: {id: string; name: string}; contentType?: string; filename?: string}
}

/**
 * Uploads image assets, skipping any that already exist in the dataset.
 *
 * Computes SHA-1 hashes locally and does a single GROQ query to find all
 * existing assets at once. Only assets not already present are uploaded.
 * This avoids hitting the upload endpoint (and its rate limits) when assets
 * are already present - which is the common case for eFPS test runs since
 * assets persist between runs.
 */
export async function uploadImageAssets(
  client: SanityClient,
  entries: UploadEntry[],
): Promise<SanityImageAssetDocument[]> {
  const hashes = await Promise.all(entries.map((entry) => hashFile(entry.filePath)))

  const existing = await client.fetch<SanityImageAssetDocument[]>(
    '*[_type == "sanity.imageAsset" && sha1hash in $hashes]',
    {hashes},
  )
  const existingByHash = new Map(existing.map((asset) => [asset.sha1hash, asset]))

  return Promise.all(
    entries.map((entry, i) => {
      const found = existingByHash.get(hashes[i])
      if (found) return found
      return client.assets.upload('image', fs.createReadStream(entry.filePath), entry.options)
    }),
  )
}

/**
 * Uploads file assets, skipping any that already exist in the dataset.
 * Same dedup strategy as {@link uploadImageAssets}.
 */
export async function uploadFileAssets(
  client: SanityClient,
  entries: UploadEntry[],
): Promise<SanityAssetDocument[]> {
  const hashes = await Promise.all(entries.map((entry) => hashFile(entry.filePath)))

  const existing = await client.fetch<SanityAssetDocument[]>(
    '*[_type == "sanity.fileAsset" && sha1hash in $hashes]',
    {hashes},
  )
  const existingByHash = new Map(existing.map((asset) => [asset.sha1hash, asset]))

  return Promise.all(
    entries.map((entry, i) => {
      const found = existingByHash.get(hashes[i])
      if (found) return found
      return client.assets.upload('file', fs.createReadStream(entry.filePath), entry.options)
    }),
  )
}

function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha1')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}
