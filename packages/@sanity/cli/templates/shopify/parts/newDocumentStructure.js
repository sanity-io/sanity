import S from '@sanity/base/structure-builder'

import {LOCKED_DOCUMENT_TYPES, LOCKED_DOCUMENT_IDS} from '../constants'

export default [
  // Use default values, but filter out templates on certain document types
  ...S.defaultInitialValueTemplateItems().filter((template) => {
    const {spec} = template
    return ![
      // Hide locked documents from 'create new document' menu
      ...LOCKED_DOCUMENT_IDS,
      ...LOCKED_DOCUMENT_TYPES,
    ].includes(spec.id)
  }),
]
