import {definePlugin} from '../../core/config/definePlugin'
import {mediaLibraryUsEnglishLocaleBundle} from './i18n'
import {mediaLibrarySchemas} from './schemas'

/**
 * @internal
 */
export const MEDIA_LIBRARY_NAME = 'sanity/media-library'

/**
 * @internal
 */
export const mediaLibrary = definePlugin({
  name: MEDIA_LIBRARY_NAME,
  schema: {
    types: mediaLibrarySchemas,
  },
  i18n: {
    bundles: [mediaLibraryUsEnglishLocaleBundle],
  },
})
