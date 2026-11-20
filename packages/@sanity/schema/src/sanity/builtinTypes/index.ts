import assetSourceData from './assetSourceData'
import {extendableTypes} from './extendableTypes'
import fileAsset from './fileAsset'
import geopoint from './geopoint'
import imageAsset from './imageAsset'
import imageCrop from './imageCrop'
import imageDimensions from './imageDimensions'
import imageHotspot from './imageHotspot'
import imageMetadata from './imageMetadata'
import imagePalette from './imagePalette'
import imagePaletteSwatch from './imagePaletteSwatch'
import slug from './slug'
import {systemDocumentTypes} from './systemTypes'

export const builtinTypes = [
  assetSourceData,
  slug,
  geopoint,
  // legacyRichDate,
  imageAsset,
  fileAsset,
  imageCrop,
  imageHotspot,
  imageMetadata,
  imageDimensions,
  imagePalette,
  imagePaletteSwatch,
  ...extendableTypes,
  ...systemDocumentTypes,
]
