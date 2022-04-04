import {SchemaType} from '@sanity/types'

/**
 * @todo
 * This used to be configurable by add the optional 'part:@sanity/base/preview-resolver' part
 */
export const customPreviewResolver: ((schemaType: SchemaType) => unknown) | undefined = undefined
