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
  | {
      step: 'stopped'
      extractionSuccessfulCount: number
      extractionFailedCount: number
      averageExtractionDuration: number
      watcherDuration: number
    }

export const SchemaExtractedTrace = defineTrace<SchemaExtractedTraceAttrubutes>({
  name: 'Schema Extracted',
  version: 0,
  description: 'Trace emitted when extracting schema',
})

export const SchemaExtractionWatchModeTrace = defineTrace<SchemaExtractionWatchModeAttributes>({
  name: 'Schema Extraction Watch Mode Started',
  version: 0,
  description: 'Trace emitted when schema extraction watch mode is run',
})
