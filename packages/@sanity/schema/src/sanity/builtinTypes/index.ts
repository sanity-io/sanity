import assetSourceData from './assetSourceData'
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
]
