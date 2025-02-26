import {readFileSync} from 'node:fs'
import path, {join, resolve} from 'node:path'

import {type CliCommandArguments, type CliCommandContext, type CliOutputter} from '@sanity/cli'
import chalk from 'chalk'
import {type Ora} from 'ora'

import {type ManifestSchemaType, type ManifestWorkspaceFile} from '../../../manifest/manifestTypes'
import {MANIFEST_FILENAME} from '../manifest/extractManifestAction'
import {SANITY_WORKSPACE_SCHEMA_TYPE} from './schemaListAction'

export interface StoreManifestSchemasFlags {
  'path'?: string
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

export const readManifest = (readPath: string, output?: CliOutputter, spinner?: Ora) => {
  try {
    return JSON.parse(readFileSync(`${readPath}/${MANIFEST_FILENAME}`, 'utf-8'))
  } catch (error) {
    const errorMessage = `Manifest not found at ${readPath}/${MANIFEST_FILENAME}`
    if (spinner) spinner.fail(errorMessage)
    if (output) output.error(errorMessage)
    throw error
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
  const flags = args.extOptions

  const schemaRequired = flags['schema-required']
  const workspaceName = flags.workspace
  const idPrefix = flags['id-prefix']
  const verbose = flags.verbose

  if (typeof flags.path === 'boolean') throw new Error('Path is empty')
  if (typeof idPrefix === 'boolean') throw new Error('Id prefix is empty')
  if (typeof workspaceName === 'boolean') throw new Error('Workspace is empty')

  const {output, apiClient} = context

  const spinner = output.spinner({}).start('Storing schemas')

  const manifestPath = getManifestPath(context, flags.path)

  try {
    const client = apiClient({
      requireUser: true,
      requireProject: true,
    }).withConfig({apiVersion: 'v2024-08-01'})

    const projectId = client.config().projectId
    if (!projectId) throw new Error('Project ID is not defined')

    const manifest = readManifest(manifestPath, output, spinner)

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
