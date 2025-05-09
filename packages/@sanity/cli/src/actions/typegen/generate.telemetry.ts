import {defineTrace} from '@sanity/telemetry'

interface TypesGeneratedTraceAttributes {
  outputSize: number
  queriesCount: number
  projectionsCount: number
  schemaTypesCount: number
  schemaCount: number
  totalScannedFilesCount: number
  queryFilesCount: number
  projectionFilesCount: number
  filesWithErrors: number
  errorCount: number
  typeNodesGenerated: number
  unknownTypeNodesGenerated: number
  unknownTypeNodesRatio: number
  emptyUnionTypeNodesGenerated: number
  configOverloadClientMethods: boolean
  configAugmentGroqModule: boolean
}

export const TypesGeneratedTrace = defineTrace<TypesGeneratedTraceAttributes>({
  name: 'Types Generated',
  version: 1,
  description: 'Trace emitted when generating TypeScript types for queries',
})
