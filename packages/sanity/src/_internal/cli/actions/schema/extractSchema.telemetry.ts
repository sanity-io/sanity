import {defineTrace} from '@sanity/telemetry'

interface SchemaExtractedTraceAttrubutes {
  schemaAllTypesCount: number
  schemaDocumentTypesCount: number
  schemaTypesCount: number

  enforceRequiredFields: boolean
  schemaFormat: string
}

export const SchemaExtractedTrace = defineTrace<SchemaExtractedTraceAttrubutes>({
  name: 'Schema Extracted',
  version: 0,
  description: 'Trace emitted when extracting schema',
})
