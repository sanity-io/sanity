import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import chalk from 'chalk'
import partition from 'lodash/partition'

import {
  CURRENT_WORKSPACE_SCHEMA_VERSION,
  type ManifestWorkspaceFile,
  type StoredWorkspaceSchema,
} from '../../../manifest/manifestTypes'
import {SchemaDeploy} from './__telemetry__/schemaStore.telemetry'
import {type SchemaStoreActionResult, type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, ensureManifestExtractSatisfied} from './utils/mainfestExtractor'
import {type CreateManifestReader, createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {projectIdDatasetPair} from './utils/schemaStoreOutStrings'
import {
  FlagValidationError,
  parseDeploySchemasConfig,
  SCHEMA_PERMISSION_HELP_TEXT,
  type SchemaStoreCommonFlags,
} from './utils/schemaStoreValidation'
import {getWorkspaceSchemaId} from './utils/workspaceSchemaId'

export interface DeploySchemasFlags extends SchemaStoreCommonFlags {
  'workspace'?: string
  'tag'?: string
  'schema-required'?: boolean
}

export default function deploySchemasActionForCommand(
  flags: DeploySchemasFlags,
  context: CliCommandContext,
): Promise<SchemaStoreActionResult> {
  return deploySchemasAction(
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
export async function deploySchemasAction(
  flags: DeploySchemasFlags,
  context: SchemaStoreContext,
): Promise<SchemaStoreActionResult> {
  const {workspaceName, verbose, tag, manifestDir, extractManifest, schemaRequired} =
    parseDeploySchemasConfig(flags, context)

  const {output, apiClient, jsonReader, manifestExtractor, telemetry} = context

  // prettier-ignore
  if (!(await ensureManifestExtractSatisfied({schemaRequired, extractManifest, manifestDir, manifestExtractor, output, telemetry}))) {
    return 'failure'
  }

  const trace = context.telemetry.trace(SchemaDeploy, {
    manifestDir,
    schemaRequired,
    workspaceName,
    tag,
    extractManifest,
  })

  try {
    trace.start()
    const {client} = createSchemaApiClient(apiClient)
    const manifestReader = createManifestReader({manifestDir, output, jsonReader})
    const manifest = await manifestReader.getManifest()

    const storeWorkspaceSchema = createStoreWorkspaceSchema({
      tag,
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
        `Failed to deploy ${failures.length}/${targetWorkspaces.length} schemas. Successfully deployed ${successes.length}/${targetWorkspaces.length} schemas.`,
      )
    }

    trace.complete()
    output.success(`Deployed ${successes.length}/${targetWorkspaces.length} schemas`)
    return 'success'
  } catch (err) {
    trace.error(err)
    if (schemaRequired || err instanceof FlagValidationError) {
      throw err
    } else {
      output.print(`↳ Error when storing schemas:\n  ${err.message}`)
      return 'failure'
    }
  } finally {
    context.output.print(
      `${chalk.gray('↳ List deployed schemas with:')} ${chalk.cyan('sanity schema list')}`,
    )
  }
}

function createStoreWorkspaceSchema(args: {
  tag?: string
  verbose: boolean
  client: SanityClient
  output: CliOutputter
  manifestReader: CreateManifestReader
}): (workspace: ManifestWorkspaceFile) => Promise<void> {
  const {tag, verbose, client, output, manifestReader} = args

  return async (workspace) => {
    const {safeBaseId: id, idWarning} = getWorkspaceSchemaId({
      workspaceName: workspace.name,
      tag,
    })
    if (idWarning) output.warn(idWarning)

    try {
      const schema = await manifestReader.getWorkspaceSchema(workspace.name)

      const storedWorkspaceSchema: Omit<StoredWorkspaceSchema, '_id' | '_type'> = {
        version: CURRENT_WORKSPACE_SCHEMA_VERSION,
        tag,
        workspace: {
          name: workspace.name,
          title: workspace.title,
        },
        // the API will stringify the schema – we send as JSON
        schema,
      }

      await client
        .withConfig({dataset: workspace.dataset, projectId: workspace.projectId})
        .request({
          method: 'PUT',
          url: `/projects/${workspace.projectId}/datasets/${workspace.dataset}/schemas`,
          body: {
            schemas: [storedWorkspaceSchema],
          },
        })

      if (verbose) {
        output.print(
          chalk.gray(
            `↳ schemaId: ${id}, projectId: ${workspace.projectId}, dataset: ${workspace.dataset}`,
          ),
        )
      }
    } catch (err) {
      if ('statusCode' in err && err?.statusCode === 401) {
        output.error(
          `↳ No permissions to write schema for workspace "${workspace.name}" – ${projectIdDatasetPair(workspace)}. ${
            SCHEMA_PERMISSION_HELP_TEXT
          }:\n  ${chalk.red(`${err.message}`)}`,
        )
      } else {
        output.error(
          `↳ Error deploying schema for workspace "${workspace.name}":\n  ${chalk.red(`${err.message}`)}`,
        )
      }

      throw err
    }
  }
}
