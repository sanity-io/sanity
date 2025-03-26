import {type Stats} from 'node:fs'
import {readFile, stat} from 'node:fs/promises'
import path, {join, resolve} from 'node:path'

import {type CliOutputter} from '@sanity/cli'
import chalk from 'chalk'

import {type CreateManifest, type ManifestSchemaType} from '../../../../manifest/manifestTypes'
import {MANIFEST_FILENAME} from '../../manifest/extractManifestAction'
import {type StoreSchemasFlags} from '../storeSchemasAction'

export type ManifestJsonReader = <T>(
  filePath: string,
) => Promise<JsonFileParseSuccess<T> | undefined>

export type CreateManifestReaderFactory = (args: {
  manifestDir: string
  output: CliOutputter
  jsonReader?: <T>(filePath: string) => Promise<JsonFileParseSuccess<T> | undefined>
}) => CreateManifestReader

export interface CreateManifestReader {
  getManifest: () => Promise<CreateManifest>
  getWorkspaceSchema: (workspaceName: string) => Promise<ManifestSchemaType[]>
}

interface JsonFileParseSuccess<T> {
  parsedJson: T
  path: string
  lastModified: string
}

/**
 * The manifest reader will try to read manifest and workspace schema files _once_ and cache a successful result.
 * If you need to re-read the manifest from disk, create a new instance.
 */
export const createManifestReader: CreateManifestReaderFactory = ({
  manifestDir,
  output,
  jsonReader = parseJsonFile,
}) => {
  let parsedManifest: JsonFileParseSuccess<CreateManifest>
  const parsedWorkspaces: Record<string, JsonFileParseSuccess<ManifestSchemaType[]> | undefined> =
    {}

  const getManifest: CreateManifestReader['getManifest'] = async () => {
    if (parsedManifest) {
      return parsedManifest?.parsedJson
    }

    const manifestFile = path.join(manifestDir, MANIFEST_FILENAME)

    const result = await jsonReader<CreateManifest>(manifestFile)
    if (!result) {
      throw new Error(
        `Manifest does not exist at ${manifestFile}. To create the manifest file, omit --no-${'extract-manifest' satisfies keyof StoreSchemasFlags} or run "sanity manifest extract" first.`,
      )
    }

    output.print(
      chalk.gray(`↳ Read manifest from ${manifestFile} (last modified: ${result.lastModified})`),
    )

    parsedManifest = result
    return result.parsedJson
  }

  const getWorkspaceSchema: CreateManifestReader['getWorkspaceSchema'] = async (workspaceName) => {
    if (parsedWorkspaces[workspaceName]) {
      return parsedWorkspaces[workspaceName]?.parsedJson
    }
    const manifest = await getManifest()
    if (!manifest) {
      throw Error('Manifest is required to read workspace schema.')
    }

    const workspaceManifest = manifest.workspaces.find(
      (workspace) => workspace.name === workspaceName,
    )

    if (!workspaceManifest) {
      throw Error(`No workspace named "${workspaceName}" found in manifest.`)
    }

    const workspaceSchemaFile = path.join(manifestDir, workspaceManifest.schema)
    const result = await jsonReader<ManifestSchemaType[]>(workspaceSchemaFile)
    if (!result) {
      throw Error(`Workspace schema file at "${workspaceSchemaFile}" does not exist.`)
    }
    parsedWorkspaces[workspaceName] = result
    return result.parsedJson
  }
  return {
    getManifest,
    getWorkspaceSchema,
  }
}

export function resolveManifestDirectory(workDir: string, customPath?: string): string {
  const defaultOutputDir = resolve(join(workDir, 'dist'))

  const outputDir = resolve(defaultOutputDir)
  const defaultStaticPath = join(outputDir, 'static')

  const staticPath = customPath ?? defaultStaticPath
  return path.resolve(process.cwd(), staticPath)
}

async function parseJsonFile<T>(filePath: string): Promise<JsonFileParseSuccess<T> | undefined> {
  let stats: Stats
  try {
    stats = await stat(filePath)
  } catch (err) {
    // file does not exist
    return undefined
  }
  const content = await readFile(filePath, 'utf-8')
  const lastModified = stats.mtime.toISOString()
  const json = JSON.parse(content) as T
  if (!json) {
    throw new Error(`JSON file "${filePath}" was empty.`)
  }
  return {
    parsedJson: json,
    path: filePath,
    lastModified,
  }
}
