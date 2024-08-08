import {defineTrace} from '@sanity/telemetry'

interface TypesGeneratedTraceAttrubutes {
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
}

export const TypesGeneratedTrace = defineTrace<TypesGeneratedTraceAttrubutes>({
  name: 'Types Generated',
  version: 0,
  description: 'Trace emitted when generating TypeScript types for queries',
})
