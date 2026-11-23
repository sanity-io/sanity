import {RELEASE_DOCUMENT_TYPE} from '../releases/store/constants'
import {VARIANT_DOCUMENT_TYPE} from '../variants/store/constants'
import {definePlugin} from './definePlugin'

const SYSTEM_DOCUMENT_TYPES = new Set<string>([RELEASE_DOCUMENT_TYPE, VARIANT_DOCUMENT_TYPE])

/**
 * Release and variant definitions are written through their actions APIs, never through document
 * actions. Listed last in the default plugins, so it runs after every plugin that adds actions.
 *
 * @internal
 */
export const systemDocuments = definePlugin({
  name: 'sanity/system-documents',
  document: {
    actions: (prev, context) => (SYSTEM_DOCUMENT_TYPES.has(context.schemaType) ? [] : prev),
  },
})
