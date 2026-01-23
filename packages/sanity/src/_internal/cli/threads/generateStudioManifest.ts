import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {type ClientConfig, createClient, type SanityClient} from '@sanity/client'
import debugit from 'debug'
import {generateStudioManifest, type StudioManifest, uploadSchema, type Workspace} from 'sanity'

import {resolveIcon} from '../../manifest/extractWorkspaceManifest'
import {getStudioWorkspaces} from '../util/getStudioWorkspaces'
import {mockBrowserEnvironment} from '../util/mockBrowserEnvironment'

const debug = debugit('sanity:cli:generate-studio-manifest')

/** @internal */
export interface DeployedCreateSchema {
  name: string
  projectId: string
  dataset: string
}

/** @internal */
export interface DeployStudioWorkerData {
  workDir: string
  clientConfig: Partial<ClientConfig>
  sanityVersion: string
}

/** @internal */
export interface DeployStudioWorkerSuccess {
  type: 'success'
  /** The final studio manifest for deployment registration */
  studioManifest: StudioManifest | null
}

/** @internal */
export interface DeployStudioWorkerError {
  type: 'error'
  message: string
  workspaceName?: string
}

/** @internal */
export type DeployStudioWorkerResult = DeployStudioWorkerSuccess | DeployStudioWorkerError

async function main() {
  if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread')
  }

  const opts = _workerData as DeployStudioWorkerData
  const cleanup = mockBrowserEnvironment(opts.workDir)

  try {
    // Load workspaces once
    const workspaces = await getStudioWorkspaces({basePath: opts.workDir})

    if (!workspaces.length) {
      parentPort.postMessage({
        type: 'error',
        message: 'No workspaces found in studio configuration',
      } satisfies DeployStudioWorkerError)
      return
    }

    // Create client from passed config
    const client = createClient({
      ...opts.clientConfig,
      requestTagPrefix: 'sanity.cli.deploy',
    })

    // Upload schemas to Lexicon and collect descriptor IDs
    const schemaDescriptorsResult = await uploadSchemasToLexicon(workspaces, client)

    if (schemaDescriptorsResult.type === 'error') {
      parentPort.postMessage(schemaDescriptorsResult)
      return
    }

    const schemaDescriptors = schemaDescriptorsResult.descriptors

    // Generate studio manifest using the shared utility
    const manifest = await generateStudioManifest({
      workspaces,
      resolveSchemaDescriptorId: (workspace) => schemaDescriptors.get(workspace.name),
      resolveIcon: (workspace) =>
        resolveIcon({
          icon: workspace.icon,
          title: workspace.title,
          subtitle: workspace.subtitle,
        }) ?? undefined,
      bundleVersion: opts.sanityVersion,
      buildId: JSON.stringify(Date.now()),
    })

    const result: DeployStudioWorkerSuccess = {
      type: 'success',
      // Return null if no workspaces have schema descriptors
      studioManifest: manifest.workspaces.length === 0 ? null : manifest,
    }

    parentPort.postMessage(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred'
    parentPort.postMessage({
      type: 'error',
      message,
    } satisfies DeployStudioWorkerError)
  } finally {
    cleanup()
  }
}

interface UploadSchemasSuccess {
  type: 'success'
  descriptors: Map<string, string>
}

/**
 * Uploads schemas to Lexicon and returns workspace name → descriptor ID mapping.
 * Returns a structured result to allow proper error handling.
 */
async function uploadSchemasToLexicon(
  workspaces: Workspace[],
  client: SanityClient,
): Promise<UploadSchemasSuccess | DeployStudioWorkerError> {
  const schemaDescriptors = new Map<string, string>()

  for (const workspace of workspaces) {
    // Use the workspace's schema directly (already resolved)
    const workspaceClient = client.withConfig({
      projectId: workspace.projectId,
      dataset: workspace.dataset,
    })

    try {
      const descriptorId = await uploadSchema(workspace.schema, workspaceClient)

      if (!descriptorId) {
        return {
          type: 'error',
          message: `Failed to get schema descriptor ID for workspace "${workspace.name}": upload returned empty result`,
          workspaceName: workspace.name,
        }
      }

      schemaDescriptors.set(workspace.name, descriptorId)
      debug(
        `Uploaded schema for workspace "${workspace.name}" to Lexicon with descriptor ID: ${descriptorId}`,
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        type: 'error',
        message: `Failed to upload schema for workspace "${workspace.name}": ${errorMessage}`,
        workspaceName: workspace.name,
      }
    }
  }

  return {type: 'success', descriptors: schemaDescriptors}
}

void main()
