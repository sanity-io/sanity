import path from 'node:path'

import resolveFrom from 'resolve-from'
import semver from 'semver'

import {type AutoUpdatesImportMap} from './getAutoUpdatesImportMap'
import {readPackageJson} from './readPackageJson'

async function getRemoteResolvedVersion(url: string) {
  try {
    const res = await fetch(url, {method: 'HEAD', redirect: 'manual'})
    return res.headers.get('x-resolved-version')
  } catch (err) {
    throw new Error(`Failed to fetch remote version for ${url}: ${err.message}`)
  }
}

interface CompareStudioDependencyVersions {
  pkg: string
  installed: string
  remote: string
}

export async function compareStudioDependencyVersions(
  autoUpdatesImports: AutoUpdatesImportMap,
  workDir: string,
): Promise<Array<CompareStudioDependencyVersions>> {
  const manifest = readPackageJson(path.join(workDir, 'package.json'))
  const dependencies = {...manifest.dependencies, ...manifest.devDependencies}

  const failedDependencies: Array<CompareStudioDependencyVersions> = []

  // Filter out the packages that are wildcards in the import map
  const filteredAutoUpdatesImports = Object.entries(autoUpdatesImports).filter(
    ([pkg]) => !pkg.endsWith('/'),
  ) as Array<[string, string]>

  for (const [pkg, value] of filteredAutoUpdatesImports) {
    const resolvedVersion = await getRemoteResolvedVersion(value)

    if (!resolvedVersion) {
      throw new Error(`Failed to fetch remote version for ${value}`)
    }

    const dependency = dependencies[pkg]
    const manifestPath = resolveFrom.silent(workDir, path.join(pkg, 'package.json'))

    const installed = semver.coerce(
      manifestPath ? readPackageJson(manifestPath).version : dependency.replace(/[\D.]/g, ''),
    )

    if (!installed) {
      throw new Error(`Failed to parse installed version for ${pkg}`)
    }

    if (!semver.eq(resolvedVersion, installed.version)) {
      failedDependencies.push({pkg, installed: installed.version, remote: resolvedVersion})
    }
  }

  return failedDependencies
}
