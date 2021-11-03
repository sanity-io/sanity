/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
import slug from '@sanity/base/lib/schema/types/slug'
// @ts-ignore
import geopoint from '@sanity/base/lib/schema/types/geopoint'
// @ts-ignore
import imageCrop from '@sanity/base/lib/schema/types/imageCrop'
// @ts-ignore
import imageHotspot from '@sanity/base/lib/schema/types/imageHotspot'
// @ts-ignore
import assetSourceData from '@sanity/base/lib/schema/types/assetSourceData'
// @ts-ignore
import imageAsset from '@sanity/base/lib/schema/types/imageAsset'
// @ts-ignore
import imagePalette from '@sanity/base/lib/schema/types/imagePalette'
// @ts-ignore
import imagePaletteSwatch from '@sanity/base/lib/schema/types/imagePaletteSwatch'
// @ts-ignore
import imageDimensions from '@sanity/base/lib/schema/types/imageDimensions'
// @ts-ignore
import imageMetadata from '@sanity/base/lib/schema/types/imageMetadata'
// @ts-ignore
import fileAsset from '@sanity/base/lib/schema/types/fileAsset'

export const baseTypes = [
  slug,
  geopoint,
  imageCrop,
  imageHotspot,
  assetSourceData,
  imageAsset,
  imagePalette,
  imagePaletteSwatch,
  imageDimensions,
  imageMetadata,
  fileAsset,
]
