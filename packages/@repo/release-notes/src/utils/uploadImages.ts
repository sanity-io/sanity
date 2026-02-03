import {Readable} from 'node:stream'

import {
  type SanityClient,
  type SanityImageAssetDocument,
  type UploadClientConfig,
} from '@sanity/client'
import pMap from 'p-map'

import {type PortableTextBlock, type PortableTextMarkdownBlock} from './portabletext-markdown/types'

export type ClientLike = {assets: {upload: SanityClient['assets']['upload']}}

export async function uploadImages(client: ClientLike, blocks: PortableTextMarkdownBlock[]) {
  return pMap(blocks, async (block) => {
    if (block._type === 'block') {
      return uploadInlineImages(client, block)
    }
    if (block._type !== 'image') {
      return block
    }
    const asset = await uploadImage(client, block.src, {
      preserveFilename: false,
      tag: 'release-note-image',
      source: {
        id: block._key,
        name: 'studio-release-automation',
        url: block.src,
      },
    })
    return {
      _type: 'image',
      alt: block.alt,
      asset: {_ref: asset._id, _type: 'reference'},
      _key: block._key,
    }
  })
}

async function uploadInlineImages(client: ClientLike, block: PortableTextBlock) {
  const children = await pMap(block.children, async (span) => {
    if (span._type === 'image') {
      const asset = await uploadImage(client, span.src, {
        preserveFilename: false,
        tag: 'release-note-image',
        source: {
          id: span._key,
          name: 'studio-release-automation',
          url: span.src,
        },
      })
      return {
        _type: 'image' as const,
        asset: {_ref: asset._id, _type: 'reference'},
        _key: span._key,
      }
    }
    return span
  })
  return {
    ...block,
    children,
  }
}

export async function uploadImage(
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
