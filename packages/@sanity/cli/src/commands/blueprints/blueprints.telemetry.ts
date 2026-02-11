import {defineEvent} from '@sanity/telemetry'

// create a telemetry event for when the user uses the --example flag with the blueprints add command
export const BlueprintsAddExampleUsed = defineEvent<{
  example: string // name of the example
  resourceType: string // only 'function' is supported for now
}>({
  version: 1,
  name: 'Blueprints Add Example Used',
  description: 'User used --example flag with blueprints add command',
})
