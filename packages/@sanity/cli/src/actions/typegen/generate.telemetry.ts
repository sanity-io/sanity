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

/**
 * Attributes for typegen watch mode trace - tracks the start and stop of watch mode
 * sessions with statistics about generation runs.
 */
export type TypegenWatchModeTraceAttributes =
  | {
      step: 'started'
    }
  | {
      step: 'stopped'
      generationSuccessfulCount: number
      generationFailedCount: number
      averageGenerationDuration: number
      watcherDuration: number
    }

export const TypegenWatchModeTrace = defineTrace<TypegenWatchModeTraceAttributes>({
  name: 'Typegen Watch Mode Started',
  version: 0,
  description: 'Trace emitted when typegen watch mode is run',
})
