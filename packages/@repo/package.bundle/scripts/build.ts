import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import enhancedResolve from 'enhanced-resolve'
import _ from 'lodash'
import ora from 'ora'
import {build} from 'vite'

const OUT_DIR = './dist'

// List of import specifiers to resolve and build
const IMPORTS_TO_BUILD = [
  'sanity',
  'sanity/presentation',
  'sanity/desk',
  'sanity/router',
  'sanity/_singletons',
  'sanity/structure',
  'sanity/package.json',

  '@sanity/block-tools',
  '@sanity/block-tools/package.json',

  '@sanity/diff',
  '@sanity/diff/package.json',

  '@sanity/mutator',
  '@sanity/mutator/package.json',

  '@sanity/portable-text-editor',
  '@sanity/portable-text-editor/package.json',

  '@sanity/schema',
  '@sanity/schema/_internal',
  '@sanity/schema/package.json',

  '@sanity/types',
  '@sanity/types/package.json',

  '@sanity/util',
  '@sanity/util/client',
  '@sanity/util/content',
  '@sanity/util/concurrency-limiter',
  '@sanity/util/createSafeJsonParser',
  '@sanity/util/legacyDateFormat',
  '@sanity/util/paths',
  '@sanity/util/package.json',

  '@sanity/vision',
  '@sanity/vision/package.json',

  'react',
  'react/jsx-runtime',
  'react/package.json',

  'react-dom',
  'react-dom/server',
  'react-dom/client',
  'react-dom/package.json',

  'styled-components',
  'styled-components/package.json',
]

const {ResolverFactory} = enhancedResolve
const resolver = ResolverFactory.createResolver({
  // @ts-expect-error types seems to be wrong for this
  fileSystem: fs,
  conditionNames: ['browser', 'import'],
  mainFields: ['module', 'browser', 'main'],
  enforceExtension: false,
})

/**
 * Uses webpack's "enhanced-resolve" in order to resolve the above import
 * specifiers. Note that this works for the built versions of packages that are
 * within this monorepo. This works because this package's package.json should
 * have other monorepo packages as dependencies using the `workspace:*`
 * protocol. This will make enhanced-resolve follow the specifier to the
 * appropriate built version of that package. This ensures that any build
 * settings, optimizations, and other build processes that occur via pkg-utils
 * are applied to these bundles we build for the browser.
 */
async function resolveModule(specifier: string) {
  const context = {}
  const resolveContext = {}

  return new Promise<string>((resolve, reject) => {
    resolver.resolve(
      context,
      path.dirname(fileURLToPath(import.meta.url)),
      specifier,
      resolveContext,
      (err, result) => {
        if (err) reject(err)
        else if (result) resolve(result)
        else reject(new Error(`Unable to resolve '${specifier}'`))
      },
    )
  })
}

// for every import specifier listed above, grab other related information
const entries = await Promise.all(
  IMPORTS_TO_BUILD.map(async (specifier) => {
    const hasScope = specifier.startsWith('@')
    const packageName = specifier
      .split('/')
      .slice(0, hasScope ? 2 : 1)
      .join('/')
    const chunkName = path.relative(packageName, specifier) || 'index'
    const {default: packageJson} = await import(path.join(packageName, 'package.json'))
    const {version} = packageJson
    const entryPoint = await resolveModule(specifier)
    const packageDir = path.join(OUT_DIR, packageName.replace(/\//g, '__'))
    const dir = path.join(packageDir, version)

    return {packageName, packageDir, dir, specifier, chunkName, entryPoint, version}
  }),
)

const packageNames = Array.from(new Set(entries.map((entry) => entry.packageName)))
// derive an `external` value from unique set of package names
const external = packageNames.flatMap((packageName) => [
  // add the package name verbatim
  packageName,
  // also add a regex that matches the package name with a forward slash
  new RegExp(`^${_.escapeRegExp(packageName)}\\/.+`),
])

for (const packageName of packageNames) {
  const spinner = ora().start()
  spinner.info(`Building ${packageName}…`)

  const packageEntries = entries.filter((e) => e.packageName === packageName)
  const {dir, packageDir, version} = packageEntries[0]
  const entry = Object.fromEntries(
    packageEntries.map(({chunkName, entryPoint}) => [chunkName, entryPoint]),
  )

  await build({
    appType: 'custom',
    define: {'process.env.NODE_ENV': JSON.stringify('production')},
    build: {
      emptyOutDir: true,
      lib: {entry, formats: ['es']},
      rollupOptions: {
        external,
        output: {exports: 'named', dir, format: 'es'},
        treeshake: {preset: 'recommended'},
      },
    },
    customLogger: {
      info: (msg) => spinner.info(msg),
      clearScreen: () => {},
      hasErrorLogged: () => false,
      hasWarned: false,
      warnOnce: console.warn,
      error: (msg) => console.error(msg),
      warn: (msg) => spinner.warn(msg),
    },
  })

  const manifest = {
    name: packageName,
    version,
    imports: Object.fromEntries(
      packageEntries.map(({specifier, chunkName}) => [specifier, `./${chunkName}.js`]),
    ),
  }

  const defaultManifest = {
    name: packageName,
    version,
    imports: Object.fromEntries(
      packageEntries.map(({specifier, chunkName}) => [
        specifier,
        `./${path.join(version, chunkName)}.js`,
      ]),
    ),
  }

  await fs.promises.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest))
  await fs.promises.writeFile(
    path.join(packageDir, 'default.json'),
    JSON.stringify(defaultManifest),
  )

  spinner.succeed(`Built ${packageName}!\n`)
}

const imports = Object.fromEntries(
  entries.map(({specifier, chunkName, dir}) => [
    specifier,
    `./${path.relative(OUT_DIR, path.join(dir, chunkName))}.js`,
  ]),
)

const topLevelManifestPath = path.join(OUT_DIR, 'default.json')
await fs.promises.writeFile(topLevelManifestPath, JSON.stringify({version: '1', imports}))
ora().succeed(`Wrote default manifest at ${topLevelManifestPath}!`)
