import {defineTrace} from '@sanity/telemetry'

interface SchemaExtractedTraceAttrubutes {
  schemaAllTypesCount: number
  schemaDocumentTypesCount: number
  schemaTypesCount: number

  enforceRequiredFields: boolean
  schemaFormat: string
}

type SchemaExtractionWatchModeAttributes =
  | {
      step: 'started'
      enforceRequiredFields: boolean
      schemaFormat: string
    }
  | {step: 'extracted'; success: boolean}
  | {step: 'stopped'}

export const SchemaExtractedTrace = defineTrace<SchemaExtractedTraceAttrubutes>({
  name: 'Schema Extracted',
  version: 0,
  description: 'Trace emitted when extracting schema',
})

export const SchemaExtractionWatchModeTrace = defineTrace<SchemaExtractionWatchModeAttributes>({
  name: 'Schema Extraction Watch Mode Running',
  version: 0,
  description: 'Trace emitted when schema extraction watch mode is running',
})
