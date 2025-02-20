import {readFileSync} from 'node:fs'
import path, {join, resolve} from 'node:path'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'

import {
  type CreateManifest,
  type ManifestSchemaType,
  type ManifestWorkspaceFile,
} from '../../../manifest/manifestTypes'

export interface StoreManifestSchemasFlags {
  'path'?: string
  'workspace'?: string
  'id-prefix'?: string
  'schema-required'?: boolean
  'verbose'?: boolean
}

export default async function storeManifestSchemas(
  args: CliCommandArguments<StoreManifestSchemasFlags>,
  context: CliCommandContext,
): Promise<Error | undefined> {
  const flags = args.extOptions
  const workspaceName = flags.workspace
  const idPrefix = flags['id-prefix']
  const verbose = flags.verbose
  const {output, workDir, apiClient} = context

  const defaultOutputDir = resolve(join(workDir, 'dist'))

  const outputDir = resolve(defaultOutputDir)
  const defaultStaticPath = join(outputDir, 'static')

  const staticPath = flags.path ?? defaultStaticPath

  const spinner = output.spinner({}).start('Storing schemas')

  try {
    const manifestPath = path.resolve(process.cwd(), staticPath)
    const client = apiClient({
      requireUser: true,
      requireProject: true,
    }).withConfig({apiVersion: 'v2024-08-01'})

    const projectId = client.config().projectId

    let manifest: CreateManifest

    try {
      manifest = JSON.parse(readFileSync(`${manifestPath}/create-manifest.json`, 'utf-8'))
    } catch (error) {
      spinner.fail(`Manifest not found at ${manifestPath}/create-manifest.json`)
      output.error(error)
      throw error
    }

    let storedCount = 0

    let error: Error | undefined

    const saveSchema = async (workspace: ManifestWorkspaceFile) => {
      const id = `${idPrefix || 'sanity.workspace.schema'}.${workspace.name}`
      try {
        if (workspace.projectId !== projectId) {
          throw new Error(
            `No rights to store schema for workspace ${workspace.name} with projectId: ${workspace.projectId}`,
          )
        }
        const schema = JSON.parse(
          readFileSync(`${manifestPath}/${workspace.schema}`, 'utf-8'),
        ) as ManifestSchemaType
        await client
          .withConfig({
            dataset: workspace.dataset,
            projectId: workspace.projectId,
          })
          .transaction()
          .createOrReplace({_type: 'sanity.workspace.schema', _id: id, workspace, schema})
          .commit()
        storedCount++
        spinner.text = `Stored ${storedCount} schemas so far...`
        if (verbose) spinner.succeed(`Schema stored for workspace '${workspace.name}'`)
      } catch (err) {
        error = err
        spinner.fail(
          `Error storing schema for workspace '${workspace.name}':\n${chalk.red(`-${err.message}`)}`,
        )
      } finally {
        if (verbose) {
          spinner.info(
            `${JSON.stringify(
              {
                id,
                workspace: workspace.name,
                projectId: workspace.projectId,
                dataset: workspace.dataset,
              },
              null,
              2,
            )}`,
          )
        }
      }
    }

    // If a workspace name is provided, only save the schema for that workspace
    if (workspaceName) {
      const workspaceToSave = manifest.workspaces.find(
        (workspace) => workspace.name === workspaceName,
      )
      if (workspaceToSave) {
        await saveSchema(workspaceToSave)
      } else {
        spinner.fail(`Workspace ${workspaceName} not found in manifest`)
        error = new Error(
          `Workspace ${workspaceName} not found in manifest: projectID: ${projectId}`,
        )
      }
    } else {
      await Promise.all(
        manifest.workspaces.map(async (workspace): Promise<void> => {
          await saveSchema(workspace)
        }),
      )
    }

    spinner.succeed(`Stored ${storedCount}/${manifest.workspaces.length} schemas`)

    if (error) throw error
    return undefined
  } catch (err) {
    // if this flag is set, throw the error and exit without deploying otherwise just log the error
    if (flags['schema-required']) throw err
    return err
  }
}
