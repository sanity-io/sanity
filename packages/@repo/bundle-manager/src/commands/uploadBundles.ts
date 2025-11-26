import {type Dirent, readdirSync, readFileSync} from 'node:fs'
import {readdir, readFile, stat, writeFile} from 'node:fs/promises'
import {type SourceMapPayload} from 'node:module'
import path from 'node:path'

import {Storage, type UploadOptions} from '@google-cloud/storage'
import {MONOREPO_ROOT, readEnv} from '@repo/utils'
import {type NormalizedReadResult, readPackageUp} from 'read-package-up'

import {isValidTag} from '../assert'
import {appVersion, corePkgs, VALID_TAGS} from '../constants'
import {updateManifestWith} from '../helpers/updateManifestWith'
import {addVersion} from '../operations/addVersion'
import {tagVersion} from '../operations/tagVersion'
import {type DistTag, type KnownEnvVar, type Manifest} from '../types'
import {cleanDirName, currentUnixTime} from '../utils'

const storage = new Storage({
  projectId: readEnv<KnownEnvVar>('GOOGLE_PROJECT_ID'),
  credentials: JSON.parse(readEnv<KnownEnvVar>('GCLOUD_SERVICE_KEY')),
})

const bucket = storage.bucket(readEnv<KnownEnvVar>('GCLOUD_BUCKET'))

const mimeTypes: Record<string, string | undefined> = {
  '.mjs': 'application/javascript',
  '.map': 'application/json',
}

/**
 * Recursively iterate through a directory and yield all files
 * @param directory - The directory to iterate
 */
async function* getFiles(directory: string): AsyncGenerator<string, void, unknown> {
  for (const file of await readdir(directory)) {
    const fullPath = path.join(directory, file)
    const stats = await stat(fullPath)

    if (stats.isDirectory()) {
      yield* getFiles(fullPath)
    }

    if (stats.isFile()) {
      yield fullPath
    }
  }
}

async function copyPackages(asVersion?: string) {
  console.log('**Copying Core packages**')

  const packageVersions: Record<string, string> = {}

  // First we iterate through each core package located in `packages/`
  for (const pkg of corePkgs) {
    console.log(`Copying files from ${pkg}`)

    const {packageJson} = await readPackageJson(
      path.join(MONOREPO_ROOT, `packages/${pkg}/package.json`),
    )

    if (asVersion && (process.env.CI || process.env.NODE_ENV === 'production')) {
      throw new Error('The `asVersion` option can not be used in CI or production')
    }

    const version = asVersion || packageJson.version
    packageVersions[pkg] = version

    // Convert slashes to double underscores
    // Needed for `@sanity/vision` and other scoped packages
    const cleanDir = cleanDirName(pkg)

    for await (const filePath of getFiles(path.join(MONOREPO_ROOT, `packages/${pkg}/dist`))) {
      try {
        const fileName = path.basename(filePath)
        const ext = path.extname(fileName)
        const contentType = mimeTypes[ext]
        if (!contentType) {
          throw new Error(`Unknown content type for file ${filePath}`)
        }

        const options: UploadOptions = {
          destination: `modules/${appVersion}/${cleanDir}/${version}/bare/${fileName}`,
          gzip: true,
          contentType,
          metadata: {
            // 1 year cache
            cacheControl: 'public, max-age=31536000, immutable',
          },
        }

        // Upload files to the proper bucket destination
        await bucket.upload(filePath, options)
      } catch (error) {
        throw new Error(`Failed to copy files from ${pkg}`, {cause: error})
      }
    }

    console.log(`Completed copy for directory ${pkg}`)
  }

  return packageVersions
}

async function cleanupSourceMaps(asVersion?: string) {
  const monoRepoPackageVersions = getMonorepoPackageVersions()

  const packageVersions: Record<string, string> = {}
  // First we iterate through each core package located in `packages/`
  for (const pkg of corePkgs) {
    const {packageJson} = await readPackageJson(
      path.join(MONOREPO_ROOT, `packages/${pkg}/package.json`),
    )

    const version = asVersion || packageJson.version
    packageVersions[pkg] = version

    for await (const filePath of getFiles(path.join(MONOREPO_ROOT, `packages/${pkg}/dist`))) {
      if (path.extname(filePath) !== '.map') {
        continue
      }

      try {
        const sourceMap = await readSourceMap(filePath)
        const newSources = await Promise.all(
          sourceMap.sources.map((source) =>
            rewriteSource({
              source,
              sourceMapPath: filePath,
              monoRepoPackageVersions,
            }),
          ),
        )
        sourceMap.sources = newSources
        await writeFile(filePath, JSON.stringify(sourceMap), 'utf-8')
      } catch (error) {
        throw new Error(`Failed to rewrite source map from ${pkg}`, {cause: error})
      }
    }

    console.log(`Completed source map rewriting for directory ${pkg}`)
  }
}

/**
 * Rewrite source paths to absolute URLs for CDN-published bundles.
 *
 * Technically speaking this is "incorrect", as we don't use the URLs given for actually building,
 * however it is useful for debugging purposes, and leaving the original paths do not make sense
 * as we are not hosting the source files on the CDN anyway.
 *
 * The `sourcesContent` property does contain the actual contents we need for most debugging,
 * so this is mostly a way for us to jump to a file we can peek at, as well as telling us which
 * version of the file we are looking at. This is more helpful than, say,
 * `../../node_modules/someModule/index.js`.
 *
 * The URLs we rewrite to are as follows:
 * - For absolute URLs, leave them as-is.
 * - For dependencies (eg anything inside of `node_modules`), we use jsdelivr.net.
 * - For Sanity monorepo packages, we use GitHub URLs. Note that these link to the HTML interface,
 *     _NOT_ the raw file - so any tools that tries to actually fetch the file might fail. If this
 *     proves to be an issue, we could switch to `raw.githubusercontent.com` instead, but it is
 *     less user-friendly for us developers.
 *
 * @param source - The source path to rewrite
 * @param sourceMapPath - The path to the source map file that contained this source path
 * @returns The rewritten source path (URL)
 * @internal
 */
async function rewriteSource(options: {
  source: string
  sourceMapPath: string
  monoRepoPackageVersions: Record<string, string>
}): Promise<string> {
  const {source, sourceMapPath, monoRepoPackageVersions} = options

  if (/^https?:\/\//.test(source)) {
    return source
  }

  const sourceMapDir = path.dirname(sourceMapPath)
  const sourcePath = path.resolve(sourceMapDir, source)
  if (sourcePath.includes('node_modules')) {
    const {
      packageJson: {name, version},
      packagePath,
    } = await readPackageJson(sourcePath)

    if (name === 'sanity-root') {
      throw new Error(`Found sanity-root instead of a package for ${sourcePath}`)
    }
    const pathFromPackage = path.relative(packagePath, sourcePath)
    // eg `../../../node_modules/.pnpm/@sanity+client@6.22.0_debug@4.3.7/node_modules/@sanity/client/dist/index.browser.js`
    // => `https://cdn.jsdelivr.net/npm/@sanity/client@6.22.1/dist/index.browser.js`
    return `https://cdn.jsdelivr.net/npm/${name}@${version}/${pathFromPackage}`
  }

  // eg `../src/core/schema/createSchema.ts` =>
  // => `https://github.com/sanity-io/sanity/blob/v3.59.1/packages/sanity/src/core/schema/createSchema.ts`
  const relativePath = path.posix.relative(MONOREPO_ROOT, sourcePath)
  const pathParts = relativePath.split('/')

  if (pathParts.shift() !== 'packages') {
    console.warn('Failed to rewrite source path, unknown path type', {source, sourceMapPath})
    return source
  }

  const pkgName = pathParts[0].startsWith('@') ? `${pathParts[0]}/${pathParts[1]}` : pathParts[0]
  const pkgVersion = monoRepoPackageVersions[pkgName]
  if (!pkgVersion) {
    console.warn(`Failed to rewrite source path, could not find version for ${pkgName}`)
    return source
  }

  // Encode for GitHub URLs, eg `@sanity/vision` -> `%40sanity/vision`
  const cleanDir = encodeURIComponent(relativePath).replace(/%2F/g, '/')
  return `https://github.com/sanity-io/sanity/blob/v${pkgVersion}/${cleanDir}`
}

export async function uploadBundles(args: {tag?: string; asVersion?: string}) {
  const {tag, asVersion} = args

  if (typeof tag !== 'undefined' && !isValidTag(tag)) {
    throw new Error(`Unsupported tag, must be one of [${VALID_TAGS.join(', ')}] required options`)
  }

  // Clean up source maps
  await cleanupSourceMaps(MONOREPO_ROOT)
  console.log('**Completed cleaning up source maps** ✅')

  // Copy all the bundles
  const pkgVersions = await copyPackages(asVersion)
  console.log('**Completed copying all files** ✅')

  // Update the manifest json file
  await updateManifest({tag, newVersions: pkgVersions})
  console.log('**Completed updating manifest** ✅')
}

async function readSourceMap(
  filePath: string,
): Promise<Omit<SourceMapPayload, 'sourceRoot'> & {sourceRoot?: string}> {
  const sourceMap = JSON.parse(await readFile(filePath, 'utf8'))
  if (typeof sourceMap !== 'object' || sourceMap === null || Array.isArray(sourceMap)) {
    throw new Error(`Invalid source map at ${filePath}`)
  }

  if (!('sources' in sourceMap)) {
    throw new Error(`Missing 'sources' in source map at ${filePath}`)
  }

  return sourceMap
}

async function readPackageJson(
  fromFilePath: string,
): Promise<NormalizedReadResult & {packagePath: string}> {
  const depPkg = await readPackageUp({cwd: fromFilePath})
  if (!depPkg || !depPkg.packageJson) {
    throw new Error(`No package.json found for ${fromFilePath}`)
  }

  return {...depPkg, packagePath: path.dirname(depPkg.path)}
}

function getMonorepoPackageVersions(): Record<string, string> {
  const isDir = (dirent: Dirent) => dirent.isDirectory() && !dirent.name.startsWith('.')
  const getFullPath = (dirent: Dirent) => path.join(dirent.parentPath, dirent.name)
  const listOpts = {withFileTypes: true} as const

  const scoped = readdirSync(path.join(MONOREPO_ROOT, 'packages', '@sanity'), listOpts)
    .filter(isDir)
    .map(getFullPath)

  const unscoped = readdirSync(path.join(MONOREPO_ROOT, 'packages'), listOpts)
    .filter((dirent) => isDir(dirent) && !dirent.name.startsWith('@'))
    .map(getFullPath)

  const versions: Record<string, string> = {}
  ;[...scoped, ...unscoped].forEach((pkgPath) => {
    try {
      const {name, version} = JSON.parse(readFileSync(path.join(pkgPath, 'package.json'), 'utf-8'))
      versions[name] = version
    } catch (err) {
      console.warn(`Failed to read package.json for ${pkgPath}`, err)
    }
  })

  return versions
}

async function updateManifest(options: {tag?: DistTag; newVersions: Record<string, string>}) {
  const {tag, newVersions} = options
  const timestamp = Math.floor(Date.now() / 1000)
  await updateManifestWith(bucket, (existingManifest) => {
    // Add the new version to the manifest with timestamp
    const updatedPackages = Object.entries(newVersions).reduce(
      (acc, [key, version]): Manifest['packages'] => {
        const packageId = cleanDirName(key)

        const existingPackage = acc[packageId] || {versions: []}
        let updatedPackage = addVersion(existingPackage, {version: version, timestamp})

        // tag the version in addition to adding it to the manifest
        if (tag) {
          updatedPackage = tagVersion(
            updatedPackage,
            tag,
            {timestamp: currentUnixTime(), version},
            {setAsDefault: tag === 'latest'},
          )
        }
        return {
          ...acc,
          [packageId]: updatedPackage,
        }
      },
      existingManifest?.packages || {},
    )

    return {
      updatedAt: new Date().toISOString(),
      packages: updatedPackages,
    }
  })
}
