import {readdir, readFile, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'

// eslint-disable-next-line import/no-extraneous-dependencies
import {Storage, type UploadOptions} from '@google-cloud/storage'

import {readEnv} from './utils/envVars'

type KnownEnvVar = 'GOOGLE_PROJECT_ID' | 'GCLOUD_SERVICE_KEY' | 'GCLOUD_BUCKET'

const storage = new Storage({
  projectId: readEnv<KnownEnvVar>('GOOGLE_PROJECT_ID'),
  credentials: JSON.parse(readEnv<KnownEnvVar>('GCLOUD_SERVICE_KEY')),
})

const bucket = storage.bucket(readEnv<KnownEnvVar>('GCLOUD_BUCKET'))

const corePkgs = ['sanity', '@sanity/vision'] as const

const appVersion = 'v1'

const mimeTypes: Record<string, string | undefined> = {
  '.mjs': 'application/javascript',
  '.map': 'application/json',
}

/**
 * Replaces all slashes with double underscores
 */
function cleanDirName(dirName: string) {
  return dirName.replace(/\//g, '__')
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

async function copyPackages() {
  console.log('**Copying Core packages**')

  const packageVersions = new Map<string, string>()

  // First we iterate through each core package located in `packages/`
  for (const pkg of corePkgs) {
    console.log(`Copying files from ${pkg}`)

    const packageJson = JSON.parse(await readFile(`packages/${pkg}/package.json`, 'utf8'))

    const {version} = packageJson
    packageVersions.set(pkg, version)

    // Convert slashes to double underscores
    // Needed for `@sanity/vision` and other scoped packages
    const cleanDir = cleanDirName(pkg)

    for await (const filePath of getFiles(`packages/${pkg}/dist`)) {
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

interface ManifestPackage {
  default: string
  versions: {version: string; timestamp: number}[]
}

interface Manifest {
  packages: Record<string, ManifestPackage>
}

async function updateManifest(newVersions: Map<string, string>) {
  console.log('**Updating manifest**')

  let existingManifest: Manifest = {packages: {}}

  try {
    // Download the manifest
    const buffer = await bucket.file('modules/v1/manifest-v1.json').download()
    existingManifest = JSON.parse(buffer.toString())
  } catch (error) {
    console.log('Existing manifest not found', error)
  }

  const timestamp = Math.floor(Date.now() / 1000)

  // Add the new version to the manifest with timestamp
  const newManifest = Array.from(newVersions).reduce((initial, [key, value]) => {
    const dirName = cleanDirName(key)

    return {
      ...initial,
      packages: {
        ...initial.packages,
        [dirName]: {
          ...initial.packages[dirName],
          default: value,
          versions: [...(initial.packages[dirName]?.versions || []), {version: value, timestamp}],
        },
      },
    }
  }, existingManifest)

  await writeFile('./manifest-v1.json', JSON.stringify(newManifest), {encoding: 'utf-8'})

  try {
    const options = {
      destination: 'modules/v1/manifest-v1.json',
      contentType: 'application/json',
      metadata: {
        // no-cache to help with consistency across pods when this manifest
        // is downloaded in the module-server
        cacheControl: 'no-cache, max-age=0',
      },
    }

    await bucket.upload('manifest-v1.json', options)
  } catch (error) {
    throw new Error('Error copying manifest file', {cause: error})
  }
}

async function uploadBundles() {
  // Copy all the bundles
  const pkgVersions = await copyPackages()
  console.log('**Completed copying all files** ✅')

  // Update the manifest json file
  await updateManifest(pkgVersions)
  console.log('**Completed updating manifest** ✅')
}

uploadBundles().catch((err) => {
  console.error(err)
  process.exit(1)
})
