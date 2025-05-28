import {defineTrace} from '@sanity/telemetry'

interface SchemaDeployTraceData {
  manifestDir: string
  schemaRequired: boolean
  workspaceName?: string
  idPrefix?: string
  extractManifest?: boolean
}

interface GenerateManifestTraceData {
  manifestDir: string
  schemaRequired: boolean
}

export const GenerateManifest = defineTrace<GenerateManifestTraceData>({
  name: 'Manifest generation executed',
  version: 1,
  description: 'Manifest generation was executed',
})

export const SchemaDeploy = defineTrace<SchemaDeployTraceData>({
  name: 'Schema deploy action executed',
  version: 1,
  description:
    'Schema deploy action was executed, either via sanity schema deploy or as sanity deploy',
})

//Note – the individual sanity schema store commands are covered by the general cli telemetry
