import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import chalk from 'chalk'
import partition from 'lodash/partition'

import {
  type ManifestWorkspaceFile,
  SANITY_WORKSPACE_SCHEMA_TYPE,
  type StoredWorkspaceSchema,
} from '../../../manifest/manifestTypes'
import {type SchemaStoreActionResult, type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, ensureManifestExtractSatisfied} from './utils/mainfestExtractor'
import {type CreateManifestReader, createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {
  FlagValidationError,
  parseStoreSchemasConfig,
  type StoreSchemaCommonFlags,
  throwWriteProjectIdMismatch,
} from './utils/schemaStoreValidation'
import {getWorkspaceSchemaId} from './utils/workspaceSchemaId'

export interface StoreSchemasFlags extends StoreSchemaCommonFlags {
  'workspace'?: string
  'id-prefix'?: string
  'schema-required'?: boolean
}

export default function storeSchemasActionForCommand(
  flags: StoreSchemasFlags,
  context: CliCommandContext,
): Promise<SchemaStoreActionResult> {
  return storeSchemasAction(
    {
      ...flags,
      //invoking the command through CLI implies that schema is required
      'schema-required': true,
    },
    {
      ...context,
      manifestExtractor: createManifestExtractor(context),
    },
  )
}

/**
 *
 * Stores schemas for configured workspaces into workspace datasets.
 *
 * Workspaces are determined by on-disk manifest file – not directly from sanity.config.
 * All schema store actions require a manifest to exist, so we regenerate it by default.
 * Manifest generation can be optionally disabled with --no-manifest-extract.
 * In this case the command uses and existing file or throws when missing.
 */
export async function storeSchemasAction(
  flags: StoreSchemasFlags,
  context: SchemaStoreContext,
): Promise<SchemaStoreActionResult> {
  const {workspaceName, verbose, idPrefix, manifestDir, extractManifest, schemaRequired} =
    parseStoreSchemasConfig(flags, context)

  const {output, apiClient, jsonReader, manifestExtractor} = context

  // prettier-ignore
  if (!(await ensureManifestExtractSatisfied({schemaRequired, extractManifest, manifestDir, manifestExtractor, output,}))) {
    return 'failure'
  }

  try {
    const {client, projectId} = createSchemaApiClient(apiClient)
    const manifestReader = createManifestReader({manifestDir, output, jsonReader})
    const manifest = await manifestReader.getManifest()

    const storeWorkspaceSchema = createStoreWorkspaceSchema({
      idPrefix,
      projectId,
      verbose,
      client,
      output,
      manifestReader,
    })

    const targetWorkspaces = manifest.workspaces.filter(
      (workspace) => !workspaceName || workspace.name === workspaceName,
    )

    if (!targetWorkspaces.length) {
      if (workspaceName) {
        throw new FlagValidationError(`Found no workspaces named "${workspaceName}"`)
      } else {
        throw new Error(`Workspace array in manifest is empty.`)
      }
    }

    //known caveat: we _dont_ rollback failed operations or partial success
    const results = await Promise.allSettled(
      targetWorkspaces.map(async (workspace: ManifestWorkspaceFile): Promise<void> => {
        await storeWorkspaceSchema(workspace)
      }),
    )

    const [successes, failures] = partition(results, (result) => result.status === 'fulfilled')
    if (failures.length) {
      throw new Error(
        `Failed to store ${failures.length}/${targetWorkspaces.length} schemas. Successfully stored ${successes.length}/${targetWorkspaces.length} schemas.`,
      )
    }

    output.success(`Stored ${successes.length}/${targetWorkspaces.length} schemas`)
    return 'success'
  } catch (err) {
    if (schemaRequired || err instanceof FlagValidationError) {
      throw err
    } else {
      output.print(`↳ Error when storing schemas:\n  ${err.message}`)
      return 'failure'
    }
  } finally {
    output.print(`${chalk.gray('↳ List stored schemas with:')} ${chalk.cyan('sanity schema list')}`)
  }
}

function createStoreWorkspaceSchema(args: {
  idPrefix?: string
  projectId: string
  verbose: boolean
  client: SanityClient
  output: CliOutputter
  manifestReader: CreateManifestReader
}): (workspace: ManifestWorkspaceFile) => Promise<void> {
  const {idPrefix, projectId, verbose, client, output, manifestReader} = args

  return async (workspace) => {
    const {safeId: id, idWarning} = getWorkspaceSchemaId({workspaceName: workspace.name, idPrefix})
    if (idWarning) output.warn(idWarning)

    try {
      throwWriteProjectIdMismatch(workspace, projectId)
      const schema = await manifestReader.getWorkspaceSchema(workspace.name)

      const storedWorkspaceSchema: StoredWorkspaceSchema = {
        _type: SANITY_WORKSPACE_SCHEMA_TYPE,
        _id: id,
        workspace,
        // we have to stringify the schema to save on attribute paths
        schema: JSON.stringify(schema),
      }

      await client
        .withConfig({dataset: workspace.dataset, projectId: workspace.projectId})
        .createOrReplace(storedWorkspaceSchema)

      if (verbose) {
        output.print(
          chalk.gray(`↳ schemaId: ${id}, projectId: ${projectId}, dataset: ${workspace.dataset}`),
        )
      }
    } catch (err) {
      output.error(
        `↳ Error storing schema for workspace "${workspace.name}":\n  ${chalk.red(`${err.message}`)}`,
      )
      throw err
    }
  }
}
