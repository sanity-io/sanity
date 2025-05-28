import fs from 'node:fs'
import path from 'node:path'

import resolveFrom from 'resolve-from'
import semver from 'semver'

import {createExternalFromImportMap} from './createExternalFromImportMap'

// Directory where vendor packages will be stored
const VENDOR_DIR = 'vendor'

/**
 * A type representing the imports of vendor packages, defining specific entry
 * points for various versions and subpaths of the packages.
 *
 * The `VendorImports` object is used to build ESM browser-compatible versions
 * of the specified packages. This approach ensures that the appropriate version
 * and entry points are used for each package, enabling compatibility and proper
 * functionality in the browser environment.
 *
 * ## Rationale
 *
 * The rationale for this structure is to handle different versions of the
 * packages carefully, especially major versions. Major version bumps often
 * introduce breaking changes, so the module scheme for the package needs to be
 * checked when there is a major version update. However, minor and patch
 * versions are generally backward compatible, so they are handled more
 * leniently. By assuming that new minor versions are compatible, we avoid
 * unnecessary warnings and streamline the update process.
 *
 * If a new minor version introduces an additional subpath export within the
 * package of this version range, the corresponding package can add a more
 * specific version range that includes the new subpath. This design allows for
 * flexibility and ease of maintenance, ensuring that the latest features and
 * fixes are incorporated without extensive manual intervention.
 *
 * An additional subpath export within the package of this version range that
 * could cause the build to break if that new export is used, can be treated as
 * a bug fix. It might make more sense to our users that this new subpath isn't
 * supported yet until we address it as a bug fix. This approach helps maintain
 * stability and prevents unexpected issues during the build process.
 *
 * ## Structure
 * The `VendorImports` type is a nested object where:
 * - The keys at the first level represent the package names.
 * - The keys at the second level represent the version ranges (e.g., `^19.0.0`).
 * - The keys at the third level represent the subpaths within the package (e.g., `.` for the main entry point).
 * - The values at the third level are the relative paths to the corresponding entry points within the package.
 *
 * This structure allows for precise specification of the entry points for
 * different versions and subpaths, ensuring that the correct files are used
 * during the build process.
 */
type VendorImports = {
  [packageName: string]: {
    [versionRange: string]: {
      [subpath: string]: string
    }
  }
}

// Define the vendor packages and their corresponding versions and entry points
const VENDOR_IMPORTS: VendorImports = {
  'react': {
    '^19.0.0': {
      '.': './cjs/react.production.js',
      './jsx-runtime': './cjs/react-jsx-runtime.production.js',
      './jsx-dev-runtime': './cjs/react-jsx-dev-runtime.production.js',
      './compiler-runtime': './cjs/react-compiler-runtime.production.js',
      './package.json': './package.json',
    },
    '^18.0.0': {
      '.': './cjs/react.production.min.js',
      './jsx-runtime': './cjs/react-jsx-runtime.production.min.js',
      './jsx-dev-runtime': './cjs/react-jsx-dev-runtime.production.min.js',
      './package.json': './package.json',
    },
  },
  'react-dom': {
    '^19.0.0': {
      '.': './cjs/react-dom.production.js',
      './client': './cjs/react-dom-client.production.js',
      './server': './cjs/react-dom-server-legacy.browser.production.js',
      './server.browser': './cjs/react-dom-server-legacy.browser.production.js',
      './static': './cjs/react-dom-server.browser.production.js',
      './static.browser': './cjs/react-dom-server.browser.production.js',
      './package.json': './package.json',
    },
    '^18.0.0': {
      '.': './cjs/react-dom.production.min.js',
      './client': './cjs/react-dom.production.min.js',
      './server': './cjs/react-dom-server-legacy.browser.production.min.js',
      './server.browser': './cjs/react-dom-server-legacy.browser.production.min.js',
      './package.json': './package.json',
    },
  },
  'styled-components': {
    '^6.1.0': {
      '.': './dist/styled-components.esm.js',
      './package.json': './package.json',
    },
  },
}

interface VendorBuildOptions {
  cwd: string
  outputDir: string
  basePath: string
}

/**
 * Builds the ESM browser compatible versions of the vendor packages
 * specified in VENDOR_IMPORTS. Returns the `imports` object of an import map.
 */
export async function buildVendorDependencies({
  cwd,
  outputDir,
  basePath,
}: VendorBuildOptions): Promise<Record<string, string>> {
  // normalize the CWD to a relative dir for better error messages
  const dir = path.relative(process.cwd(), path.resolve(cwd))
  const entry: Record<string, string> = {}
  const imports: Record<string, string> = {}

  // Iterate over each package and its version ranges in VENDOR_IMPORTS
  for (const [packageName, ranges] of Object.entries(VENDOR_IMPORTS)) {
    const packageJsonPath = resolveFrom.silent(cwd, path.join(packageName, 'package.json'))
    if (!packageJsonPath) {
      throw new Error(
        `Could not find package.json for package '${packageName}' from directory '${dir}'. Is it installed?`,
      )
    }

    let packageJson

    try {
      // Read and parse the package.json file
      packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'))
    } catch (e) {
      const message = `Could not read package.json for package '${packageName}' from directory '${dir}'`
      if (typeof e?.message === 'string') {
        // Re-assign the error message so the stack trace is more visible
        e.message = `${message}: ${e.message}`
        throw e
      }

      throw new Error(message, {cause: e})
    }

    // Coerce the version to a semver-compatible version
    const version = semver.coerce(packageJson.version)?.version
    if (!version) {
      throw new Error(`Could not parse version '${packageJson.version}' from '${packageName}'`)
    }

    // Sort version ranges in descending order
    const sortedRanges = Object.keys(ranges).sort((range1, range2) => {
      const min1 = semver.minVersion(range1)
      const min2 = semver.minVersion(range2)

      if (!min1) throw new Error(`Could not parse range '${range1}'`)
      if (!min2) throw new Error(`Could not parse range '${range2}'`)

      // sort them in reverse so we can rely on array `.find` below
      return semver.rcompare(min1.version, min2.version)
    })

    // Find the first version range that satisfies the package version
    const matchedRange = sortedRanges.find((range) => semver.satisfies(version, range))

    if (!matchedRange) {
      const min = semver.minVersion(sortedRanges[sortedRanges.length - 1])
      if (!min) {
        throw new Error(`Could not find a minimum version for package '${packageName}'`)
      }

      if (semver.gt(min.version, version)) {
        throw new Error(`Package '${packageName}' requires at least ${min.version}.`)
      }

      throw new Error(`Version '${version}' of package '${packageName}' is not supported yet.`)
    }

    const subpaths = ranges[matchedRange]

    // Iterate over each subpath and its corresponding entry point
    for (const [subpath, relativeEntryPoint] of Object.entries(subpaths)) {
      const packagePath = path.dirname(packageJsonPath)
      const entryPoint = resolveFrom.silent(packagePath, relativeEntryPoint)

      if (!entryPoint) {
        throw new Error(
          `Failed to resolve entry point '${path.join(packageName, relativeEntryPoint)}'. `,
        )
      }

      const specifier = path.posix.join(packageName, subpath)
      const chunkName = path.posix.join(
        packageName,
        path.relative(packageName, specifier) || 'index',
      )

      entry[chunkName] = entryPoint
      imports[specifier] = path.posix.join('/', basePath, VENDOR_DIR, `${chunkName}.mjs`)
    }
  }

  // removes the `RollupWatcher` type
  type BuildResult = Exclude<Awaited<ReturnType<typeof build>>, {close: unknown}>

  const {build} = await import('vite')
  // Use Vite to build the packages into the output directory
  let buildResult = (await build({
    // Define a custom cache directory so that sanity's vite cache
    // does not conflict with any potential local vite projects
    cacheDir: 'node_modules/.sanity/vite-vendor',
    root: cwd,
    configFile: false,
    logLevel: 'silent',

    appType: 'custom',
    mode: 'production',
    define: {'process.env.NODE_ENV': JSON.stringify('production')},

    build: {
      commonjsOptions: {strictRequires: 'auto'},
      minify: true,
      emptyOutDir: false, // Rely on CLI to do this
      outDir: path.join(outputDir, VENDOR_DIR),
      lib: {entry, formats: ['es']},
      rollupOptions: {
        external: createExternalFromImportMap({imports}),
        output: {
          entryFileNames: '[name]-[hash].mjs',
          chunkFileNames: '[name]-[hash].mjs',
          exports: 'named',
          format: 'es',
        },
        treeshake: {preset: 'recommended'},
      },
    },
  })) as BuildResult

  buildResult = Array.isArray(buildResult) ? buildResult : [buildResult]

  // Create a map of the original import specifiers to their hashed filenames
  const hashedImports: Record<string, string> = {}
  const output = buildResult.flatMap((i) => i.output)

  for (const chunk of output) {
    if (chunk.type === 'asset') continue

    for (const [specifier, originalPath] of Object.entries(imports)) {
      if (originalPath.endsWith(`${chunk.name}.mjs`)) {
        hashedImports[specifier] = path.posix.join('/', basePath, VENDOR_DIR, chunk.fileName)
      }
    }
  }

  return hashedImports
}
