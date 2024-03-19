import {defineTrace} from '@sanity/telemetry'

interface TypesGeneratedTraceAttrubutes {
  outputSize: number
  queryTypes: number
  schemaTypes: number
  files: number
  filesWithErrors: number
  unknownTypes: number
}

export const TypesGeneratedTrace = defineTrace<TypesGeneratedTraceAttrubutes>({
  name: 'Types Generated',
  version: 0,
  description: 'Trace emitted when generating TypeScript types for queries',
})
