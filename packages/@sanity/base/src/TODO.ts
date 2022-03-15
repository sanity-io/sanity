import {SchemaType} from '@sanity/types'

// this has to be deferred/lazy-loaded due to some weird dependency orderings
// const newDocumentStructure = getDefaultModule(
//   require('part:@sanity/base/new-document-structure?')
export const newDocumentStructure = undefined

/**
 * @todo
 * This used to be configurable by add the optional 'part:@sanity/base/preview-resolver' part
 */
export const customPreviewResolver: ((schemaType: SchemaType) => unknown) | undefined = undefined
