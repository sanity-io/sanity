import {readFile} from 'node:fs/promises'
import {join} from 'node:path'

import {type CliConfig} from '@sanity/cli'
import startCase from 'lodash/startCase'

import {readPackageJson} from '../cli/util/readPackageManifest'
import {type AppManifest} from './manifestTypes'

export interface ExtractAppManifestOptions {
  workDir: string
  cliConfig?: CliConfig
}

/**
 * Extracts app manifest information
 *
 * - name and title from package.json (should this be from cliConfig?)
 * - basePath from cliConfig
 * - icon from favicon.svg (should this be a React element like workspaces do?)
 */
export async function extractAppManifest({
  workDir,
  cliConfig,
}: ExtractAppManifestOptions): Promise<AppManifest> {
  const packageJsonPath = join(workDir, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  // Extract name and title from package.json
  const name = packageJson.name || 'app'
  const title = packageJson.description || startCase(name)

  // Extract basePath from cliConfig
  const basePath = cliConfig?.project?.basePath || '/'

  // Try to resolve icon from favicon.svg
  const icon = await resolveAppIcon(workDir)

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    name,
    title,
    subtitle: undefined,
    basePath,
    icon,
  }
}

async function resolveAppIcon(workDir: string): Promise<string | null> {
  // Try to find favicon.svg in static directory
  const staticFaviconPath = join(workDir, 'static', 'favicon.svg')
  try {
    const svgContent = await readFile(staticFaviconPath, 'utf-8')
    // Return the SVG content as a string (similar to how workspace icons work)
    return svgContent
  } catch {
    // If favicon.svg doesn't exist, return null
    // In the future, we could try other formats or generate a default icon
    return null
  }
}
