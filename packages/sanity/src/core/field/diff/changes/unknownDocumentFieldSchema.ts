import {type ObjectSchemaType} from '@sanity/types'

import {JsonFieldDiff} from '../components/JsonFieldDiff'

export const UNKNOWN_DOCUMENT_FIELD_SCHEMA_TYPE: ObjectSchemaType = {
  name: '__sanity.unknownDocumentField',
  fields: [],
  jsonType: 'object',
  components: {diff: JsonFieldDiff},
}
