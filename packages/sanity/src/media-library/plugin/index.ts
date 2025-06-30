import {definePlugin} from '../../core/config/definePlugin'
import {mediaLibrarySchemas} from './schemas'
// import {releasesUsEnglishLocaleBundle} from '../i18n'

/**
 * @internal
 */
export const MEDIA_LIBRARY_NAME = 'sanity/media-library'

/**
 * @internal
 */
export const MEDIA_LIBRARY_TOOL_NAME = 'media-library'

/**
 * @internal
 */
export const MEDIA_LIBRARY_INTENT = 'media-library'

/**
 * @internal
 */
export const mediaLibrary = definePlugin({
  name: MEDIA_LIBRARY_NAME,
  i18n: {
    //bundles: [mediaLibraryUsEnglishLocaleBundle],
  },
  schema: {
    types: mediaLibrarySchemas,
  },
  // form: {
  //   file: {
  //     assetSources: [fileAssetSource],
  //   },
  //   image: {
  //     assetSources: [imageAssetSource],
  //   },
  // }
})
