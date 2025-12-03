import {defineTrace} from '@sanity/telemetry'

interface TypesGeneratedTraceAttributes {
  outputSize: number
  queriesCount: number
  schemaTypesCount: number
  queryFilesCount: number
  filesWithErrors: number
  typeNodesGenerated: number
  unknownTypeNodesGenerated: number
  unknownTypeNodesRatio: number
  emptyUnionTypeNodesGenerated: number
  configOverloadClientMethods: boolean
  configMethod: 'legacy' | 'cli'
}

export const TypesGeneratedTrace = defineTrace<TypesGeneratedTraceAttributes>({
  name: 'Types Generated',
  version: 0,
  description: 'Trace emitted when generating TypeScript types for queries',
})
