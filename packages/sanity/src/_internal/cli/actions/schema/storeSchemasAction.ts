import {readFileSync, statSync} from 'node:fs'
import path, {join, resolve} from 'node:path'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'
import {type Ora} from 'ora'

import {type ManifestSchemaType, type ManifestWorkspaceFile} from '../../../manifest/manifestTypes'
import {
  type ExtractManifestFlags,
  extractManifestSafe,
  MANIFEST_FILENAME,
} from '../manifest/extractManifestAction'
import {SANITY_WORKSPACE_SCHEMA_TYPE} from './schemaListAction'

const FEATURE_ENABLED_ENV_NAME = 'SANITY_CLI_SCHEMA_STORE_ENABLED'
export const SCHEMA_STORE_ENABLED = process.env[FEATURE_ENABLED_ENV_NAME] === 'true'

export interface StoreManifestSchemasFlags {
  'manifest-dir'?: string
  'workspace'?: string
  'id-prefix'?: string
  'schema-required'?: boolean
  'verbose'?: boolean
}

export const getManifestPath = (context: CliCommandContext, customPath?: string) => {
  const defaultOutputDir = resolve(join(context.workDir, 'dist'))

  const outputDir = resolve(defaultOutputDir)
  const defaultStaticPath = join(outputDir, 'static')

  const staticPath = customPath ?? defaultStaticPath
  const manifestPath = path.resolve(process.cwd(), staticPath)
  return manifestPath
}

/**
 * Helper function to read and parse a manifest file with logging
 */
const readAndParseManifest = (manifestPath: string, context: CliCommandContext) => {
  const content = readFileSync(manifestPath, 'utf-8')
  const stats = statSync(manifestPath)
  const lastModified = stats.mtime.toISOString()
  context.output.print(
    chalk.gray(`\n↳ Read manifest from ${manifestPath} (last modified: ${lastModified})`),
  )
  return JSON.parse(content)
}

export const readManifest = async (readPath: string, context: CliCommandContext, spinner?: Ora) => {
  const manifestPath = `${readPath}/${MANIFEST_FILENAME}`

  try {
    return readAndParseManifest(manifestPath, context)
  } catch (error) {
    // Still log that we're attempting extraction
    spinner!.text = 'Manifest not found, attempting to extract it...'

    await extractManifestSafe(
      {
        extOptions: {path: readPath},
        groupOrCommand: 'extract',
        argv: [],
        argsWithoutOptions: [],
        extraArguments: [],
      } as CliCommandArguments<ExtractManifestFlags>,
      context,
    )

    // Try reading the manifest again after extraction
    try {
      return readAndParseManifest(manifestPath, context)
    } catch (retryError) {
      const errorMessage = `Failed to read manifest at ${manifestPath}`
      spinner?.fail(errorMessage)
      // We should log the error too for consistency
      context.output.error(errorMessage)
      throw retryError
    }
  }
}

// At the moment schema store deos not support studios where workspaces have multiple projects
export const throwIfProjectIdMismatch = (
  workspace: ManifestWorkspaceFile,
  projectId: string,
): void => {
  if (workspace.projectId !== projectId) {
    throw new Error(
      `↳ No permissions to store schema for workspace ${workspace.name} with projectId: ${workspace.projectId}`,
    )
  }
}

export default async function storeSchemasAction(
  args: CliCommandArguments<StoreManifestSchemasFlags>,
  context: CliCommandContext,
): Promise<Error | undefined> {
  if (!SCHEMA_STORE_ENABLED) {
    return undefined
  }

  const flags = args.extOptions

  const schemaRequired = flags['schema-required']
  const workspaceName = flags.workspace
  const idPrefix = flags['id-prefix']
  const verbose = flags.verbose
  const manifestDir = flags['manifest-dir']

  if (typeof manifestDir === 'boolean') throw new Error('Manifest directory is empty')
  if (typeof idPrefix === 'boolean') throw new Error('Id prefix is empty')
  if (typeof workspaceName === 'boolean') throw new Error('Workspace is empty')

  const {output, apiClient} = context

  const spinner = output.spinner({}).start('Storing schemas')

  const manifestPath = getManifestPath(context, manifestDir)

  try {
    const client = apiClient({
      requireUser: true,
      requireProject: true,
    }).withConfig({apiVersion: 'v2024-08-01'})

    const projectId = client.config().projectId
    if (!projectId) throw new Error('Project ID is not defined')

    const manifest = await readManifest(manifestPath, context, spinner)

    let storedCount = 0

    let error: Error | undefined

    const saveSchema = async (workspace: ManifestWorkspaceFile) => {
      const id = `${idPrefix ? `${idPrefix}.` : ''}${SANITY_WORKSPACE_SCHEMA_TYPE}.${workspace.name}`
      try {
        throwIfProjectIdMismatch(workspace, projectId)
        const schema = JSON.parse(
          readFileSync(`${manifestPath}/${workspace.schema}`, 'utf-8'),
        ) as ManifestSchemaType
        await client
          .withConfig({
            dataset: workspace.dataset,
            projectId: workspace.projectId,
          })
          .transaction()
          .createOrReplace({_type: SANITY_WORKSPACE_SCHEMA_TYPE, _id: id, workspace, schema})
          .commit()
        storedCount++
        spinner.text = `Stored ${storedCount} schemas so far...`
        if (verbose) spinner.succeed(`Schema stored for workspace '${workspace.name}'`)
      } catch (err) {
        error = err
        spinner.fail(
          `Error storing schema for workspace '${workspace.name}':\n${chalk.red(`${err.message}`)}`,
        )
        if (schemaRequired) throw err
      } finally {
        if (verbose) {
          output.print(
            chalk.gray(`↳ schemaId: ${id}, projectId: ${projectId}, dataset: ${workspace.dataset}`),
          )
        }
      }
    }

    // If a workspace name is provided, only save the schema for that workspace
    if (workspaceName) {
      const workspaceToSave = manifest.workspaces.find(
        (workspace: ManifestWorkspaceFile) => workspace.name === workspaceName,
      )
      if (!workspaceToSave) {
        spinner.fail(`Workspace ${workspaceName} not found in manifest`)
        throw new Error(`Workspace ${workspaceName} not found in manifest: projectID: ${projectId}`)
      }
      await saveSchema(workspaceToSave as ManifestWorkspaceFile)
      spinner.succeed(`Stored 1 schemas`)
    } else {
      await Promise.all(
        manifest.workspaces.map(async (workspace: ManifestWorkspaceFile): Promise<void> => {
          await saveSchema(workspace)
        }),
      )
      spinner.succeed(`Stored ${storedCount}/${manifest.workspaces.length} schemas`)
    }

    if (error) throw error
    return undefined
  } catch (err) {
    // if this flag is set, throw the error and exit without deploying otherwise just log the error
    if (schemaRequired) throw err
    return err
  } finally {
    output.print(`${chalk.gray('↳ List stored schemas with:')} ${chalk.cyan('sanity schema list')}`)
  }
}
