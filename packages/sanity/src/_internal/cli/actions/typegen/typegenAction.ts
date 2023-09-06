/* eslint-disable no-process-env, no-process-exit, max-statements */
import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'

import {extractFromSanitySchema} from './extractFromSanitySchema'
import {SchemaError} from './SchemaError'
import {GeneratedApiSpecification} from './types'
import {getSchemaDocumentTypeDefinitions} from './getSchemaDocumentTypeDefinitions'

import gen3 from './gen3'

export interface TypegenCommandFlags {
  workspace?: string
}

// eslint-disable-next-line complexity
export default async function typegenAction(
  args: CliCommandArguments<TypegenCommandFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {output, workDir} = context
  const flags: TypegenCommandFlags = {
    workspace: 'default',
    ...args.extOptions,
  }

  const spinner = output.spinner(`Generating Type Definitions`).start()
  let apiSpec: GeneratedApiSpecification
  let projectId: string
  let dataset: string

  try {
    const source = await getSchemaDocumentTypeDefinitions({workspace: flags.workspace, workDir})
    const extracted = extractFromSanitySchema(source.schema, {
      // Allow CLI flag to override configured setting
      // @TODO try toggling true false to see what happens
      nonNullDocumentFields: true,
    })
    projectId = source.projectId
    dataset = source.dataset
    apiSpec = gen3(extracted)
  } catch (err) {
    spinner.fail()

    if (err instanceof SchemaError) {
      err.print(output)
      process.exit(1) // eslint-disable-line no-process-exit
    }

    throw err
  }

  // Give some space
  output.print('')

  output.print(`Project: ${projectId}`)
  output.print(`Dataset: ${dataset}`)
  output.print(`Definitions file:     ${'TODO'}`)

  // eslint-disable-next-line no-console
  console.log('success', {flags, apiSpec})

  // Because of side effects when loading the schema, we can end up in situations where
  // the API has been successfully deployed, but some timer or other handle is keeping
  // the process from naturally exiting.
  process.exit(0)
}
