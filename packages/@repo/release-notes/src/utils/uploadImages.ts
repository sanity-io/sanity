import {Readable} from 'node:stream'

import {
  type SanityClient,
  type SanityImageAssetDocument,
  type UploadClientConfig,
} from '@sanity/client'
import pMap from 'p-map'

import {hoistInlineImages} from './hoistInlineImages'
import {type PortableTextMarkdownBlock} from './portabletext-markdown/types'

export type ClientLike = {assets: {upload: SanityClient['assets']['upload']}}

export async function uploadImages(
  client: ClientLike,
  blocks: PortableTextMarkdownBlock[],
  options: {dryRun?: boolean},
) {
  // The changelog schema has no inline images, so an image that markdown put
  // inside a paragraph becomes a block-level image before it is uploaded.
  const blockLevel = blocks.flatMap((block): PortableTextMarkdownBlock[] =>
    block._type === 'block' ? hoistInlineImages(block) : [block],
  )
  return pMap(blockLevel, async (block) => {
    if (block._type !== 'image') {
      return block
    }
    let asset = {_id: 'placeholder'}
    if (!options.dryRun) {
      asset = await uploadImage(client, block.src, {
        preserveFilename: false,
        tag: 'release-note-image',
        source: {
          id: block._key,
          name: 'studio-release-automation',
          url: block.src,
        },
      })
    }

    return {
      _type: 'image',
      alt: block.alt,
      asset: {_ref: asset._id, _type: 'reference'},
      _key: block._key,
    }
  })
}

async function uploadImage(
  client: ClientLike,
  url: string,
  metadata: UploadClientConfig,
): Promise<SanityImageAssetDocument> {
  const {body, status} = await fetch(url)
  if (status < 200 || status > 299) {
    throw new Error(`HTTP Error ${status} while fetching image from: ${url}`)
  }
  if (!body) {
    throw new Error(`No response while fetching image from: ${url}`)
  }
  return client.assets.upload('image', Readable.fromWeb(body), metadata)
}
