import {readFileSync} from 'node:fs'
import path, {join, resolve} from 'node:path'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {
  type CreateManifest,
  type ManifestSchemaType,
  type ManifestWorkspaceFile,
} from '../../../manifest/manifestTypes'

export interface StoreManifestSchemasFlags {
  'path'?: string
  'workspace'?: string
  'custom-id'?: string
  'schema-required'?: boolean
}

export default async function storeManifestSchemas(
  args: CliCommandArguments<StoreManifestSchemasFlags>,
  context: CliCommandContext,
): Promise<Error | undefined> {
  const flags = args.extOptions
  const workspaceName = flags.workspace
  const customId = flags['custom-id']
  const {output, workDir, apiClient} = context

  const defaultOutputDir = resolve(join(workDir, 'dist'))

  const outputDir = resolve(defaultOutputDir)
  const defaultStaticPath = join(outputDir, 'static')

  const staticPath = flags.path ?? defaultStaticPath

  try {
    const manifestPath = path.resolve(process.cwd(), staticPath)
    const client = apiClient({
      requireUser: true,
      requireProject: true,
    }).withConfig({apiVersion: 'v2024-08-01'})

    const projectId = client.config().projectId

    const manifest: CreateManifest = JSON.parse(
      readFileSync(`${manifestPath}/create-manifest.json`, 'utf-8'),
    )

    const saveSchema = async (workspace: ManifestWorkspaceFile) => {
      const spinner = output.spinner({}).start('Storing schemas')
      const id = customId || `sanity.workspace.schema.${workspace.name}`
      try {
        if (workspace.projectId !== projectId && workspaceName !== workspace.name) {
          spinner.fail(
            `Cannot store schema for ${workspace.name} because manifest projectId does not match: ${projectId} !== ${workspace.projectId}`,
          )
          return
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
        spinner.succeed(
          `Schema stored for workspace ${workspace.name} (shcemaId: ${id}, projectId: ${projectId}, dataset: ${workspace.dataset})`,
        )
      } catch (error) {
        spinner.fail(`Error storing schema for workspace ${workspace.name}: ${error}`)
      }
    }

    if (workspaceName) {
      const schemaToSave = manifest.workspaces.find((workspace) => workspace.name === workspaceName)
      if (schemaToSave) {
        await saveSchema(schemaToSave)
      } else {
        output.error(`Workspace ${workspaceName} not found in manifest: projectID: ${projectId}`)
      }
    } else {
      await Promise.all(
        manifest.workspaces.map(async (workspace): Promise<void> => {
          await saveSchema(workspace)
        }),
      )
    }
    return undefined
  } catch (err) {
    output.error(err)
    if (flags['schema-required']) {
      throw err
    }
    return err
  }
}
