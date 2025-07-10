import {definePlugin} from '../../core/config/definePlugin'
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
})
