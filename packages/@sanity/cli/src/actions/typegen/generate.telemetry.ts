import {defineTrace} from '@sanity/telemetry'

interface TypesGeneratedTraceAttributes {
  outputSize: number
  queriesCount: number
  documentProjectionsCount: number
  schemaTypesCount: number
  queryFilesCount: number
  documentProjectionFilesCount: number
  filesWithErrors: number
  typeNodesGenerated: number
  unknownTypeNodesGenerated: number
  unknownTypeNodesRatio: number
  emptyUnionTypeNodesGenerated: number
  configOverloadClientMethods: boolean
  configAugmentGroqModule: boolean
}

export const TypesGeneratedTrace = defineTrace<TypesGeneratedTraceAttributes>({
  name: 'Types Generated',
  version: 0,
  description: 'Trace emitted when generating TypeScript types for queries',
})
