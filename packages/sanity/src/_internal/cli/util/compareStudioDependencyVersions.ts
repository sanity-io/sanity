import path from 'node:path'

import resolveFrom from 'resolve-from'
import semver from 'semver'

import {readPackageJson} from './readPackageJson'

// TODO: support custom hostname
const AUTO_UPDATE_PACKAGES = {
  'react': {
    url: 'https://api.sanity.work/v1/modules/react/^18',
    shouldAddPathPrefix: true,
  },
  'react-dom': {url: 'https://api.sanity.work/v1/modules/react-dom/^18', shouldAddPathPrefix: true},
  'styled-components': {
    url: 'https://api.sanity.work/v1/modules/styled-components/^6',
    shouldAddPathPrefix: false,
  },
  'sanity': {url: 'https://api.sanity.work/v1/modules/sanity/^3', shouldAddPathPrefix: true},
  '@sanity/vision': {
    url: 'https://api.sanity.work/v1/modules/@sanity__vision/^3',
    shouldAddPathPrefix: false,
  },
}

// TODO: replace this with a manifest somewhere
export const AUTO_UPDATES_IMPORTMAP = {
  imports: Object.keys(AUTO_UPDATE_PACKAGES).reduce<Record<string, string>>((acc, curr) => {
    const key = curr as keyof typeof AUTO_UPDATE_PACKAGES
    const pkg = AUTO_UPDATE_PACKAGES[key]

    acc[key] = pkg.url
    if (pkg.shouldAddPathPrefix) {
      acc[`${key}/`] = `${pkg.url}/`
    }

    return acc
  }, {}),
}

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
  workDir: string,
): Promise<Array<CompareStudioDependencyVersions>> {
  const manifest = readPackageJson(path.join(workDir, 'package.json'))
  const dependencies = {...manifest.dependencies, ...manifest.devDependencies}

  const failedDependencies: Array<CompareStudioDependencyVersions> = []

  for (const [pkg, value] of Object.entries(AUTO_UPDATE_PACKAGES)) {
    const resolvedVersion = await getRemoteResolvedVersion(value.url)

    if (!resolvedVersion) {
      throw new Error(`Failed to fetch remote version for ${value.url}`)
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
