import {type BenchDocument} from '../../mock-api/types'

/**
 * Hermetic asset fixtures: instead of uploading real assets, scenarios seed
 * `sanity.imageAsset`/`sanity.fileAsset` documents whose URLs point at
 * cdn.sanity.io paths that the runner's route guard fulfills with constant
 * bytes (runner/browser.ts) — deterministic, no network, no asset pipeline.
 */

const WIDTH = 1200
const HEIGHT = 800

/** 1x1 gray PNG (67 bytes) used as lqip and as the served CDN bytes. */
export const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPMqmeoBwAEhAGEqOSyywAAAABJRU5ErkJggg=='

const TINY_PNG_DATA_URI = `data:image/png;base64,${TINY_PNG_BASE64}`

export function imageAsset(name: string, projectId: string): BenchDocument {
  const filename = `bench-${name}-${WIDTH}x${HEIGHT}.png`
  return {
    _id: `image-bench-${name}-${WIDTH}x${HEIGHT}-png`,
    _type: 'sanity.imageAsset',
    assetId: `bench-${name}`,
    extension: 'png',
    mimeType: 'image/png',
    originalFilename: filename,
    path: `images/${projectId}/bench/${filename}`,
    url: `https://cdn.sanity.io/images/${projectId}/bench/${filename}`,
    sha1hash: `benchsha-${name}`,
    size: 1024,
    uploadId: `bench-upload-${name}`,
    metadata: {
      dimensions: {
        _type: 'sanity.imageDimensions',
        width: WIDTH,
        height: HEIGHT,
        aspectRatio: WIDTH / HEIGHT,
      },
      isOpaque: true,
      blurHash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I',
      lqip: TINY_PNG_DATA_URI,
      palette: {
        _type: 'sanity.imagePalette',
        dominant: {
          _type: 'sanity.imagePaletteSwatch',
          background: '#cccccc',
          foreground: '#000000',
          population: 1,
          title: '#cccccc',
        },
      },
      hasAlpha: false,
      _type: 'sanity.imageMetadata',
    },
  }
}

export function fileAsset(name: string, projectId: string): BenchDocument {
  const filename = `bench-${name}.txt`
  return {
    _id: `file-bench-${name}-txt`,
    _type: 'sanity.fileAsset',
    assetId: `bench-file-${name}`,
    extension: 'txt',
    mimeType: 'text/plain',
    originalFilename: filename,
    path: `files/${projectId}/bench/${filename}`,
    url: `https://cdn.sanity.io/files/${projectId}/bench/${filename}`,
    sha1hash: `benchsha-file-${name}`,
    size: 64,
  }
}

export function imageRef(name: string): {
  _type: 'image'
  asset: {_type: 'reference'; _ref: string}
} {
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: `image-bench-${name}-${WIDTH}x${HEIGHT}-png`},
  }
}

export function fileRef(name: string): {_type: 'file'; asset: {_type: 'reference'; _ref: string}} {
  return {_type: 'file', asset: {_type: 'reference', _ref: `file-bench-${name}-txt`}}
}
