import path from 'node:path'

import resolveFrom from 'resolve-from'
import semver from 'semver'

import {type AutoUpdatesImportMap} from './getAutoUpdatesImportMap'
import {readPackageJson} from './readPackageJson'

async function getRemoteResolvedVersion(fetchFn: typeof fetch, url: string) {
  try {
    const res = await fetchFn(url, {method: 'HEAD', redirect: 'manual'})
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

/**
 * Compares the versions of dependencies in the studio with their remote versions.
 *
 * This function reads the package.json file in the provided working directory, and compares the versions of the dependencies
 * specified in the `autoUpdatesImports` parameter with their remote versions. If the versions do not match, the dependency is
 * added to a list of failed dependencies, which is returned by the function.
 *
 * The failed dependencies are anything that does not strictly match the remote version.
 * This means that if a version is lower or greater by even a patch it will be marked as failed.
 *
 * @param autoUpdatesImports - An object mapping package names to their remote import URLs.
 * @param workDir - The path to the working directory containing the package.json file.
 * @param fetchFn - Optional {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API | Fetch}-compatible function to use for requesting the current remote version of a module
 *
 * @returns A promise that resolves to an array of objects, each containing
 * the name of a package whose local and remote versions do not match, along with the local and remote versions.
 *
 * @throws Throws an error if the remote version of a package cannot be fetched, or if the local version of a package
 * cannot be parsed.
 */
export async function compareStudioDependencyVersions(
  autoUpdatesImports: AutoUpdatesImportMap,
  workDir: string,
  fetchFn = globalThis.fetch,
): Promise<Array<CompareStudioDependencyVersions>> {
  const manifest = readPackageJson(path.join(workDir, 'package.json'))
  const dependencies = {...manifest.dependencies, ...manifest.devDependencies}

  const failedDependencies: Array<CompareStudioDependencyVersions> = []

  // Filter out the packages that are wildcards in the import map
  const filteredAutoUpdatesImports = Object.entries(autoUpdatesImports).filter(
    ([pkg]) => !pkg.endsWith('/'),
  ) as Array<[string, string]>

  for (const [pkg, value] of filteredAutoUpdatesImports) {
    const resolvedVersion = await getRemoteResolvedVersion(fetchFn, value)

    if (!resolvedVersion) {
      throw new Error(`Failed to fetch remote version for ${value}`)
    }

    const dependency = dependencies[pkg]
    const manifestPath = resolveFrom.silent(workDir, path.join(pkg, 'package.json'))

    const installed = semver.coerce(
      manifestPath ? readPackageJson(manifestPath).version : dependency,
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
