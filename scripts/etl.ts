import path from 'node:path'

import baseConfig from '@repo/package.config'
import {startTimer} from '@repo/utils'
import {createClient} from '@sanity/client'
import {_loadConfig, extract, load, type SanityTSDocConfigOptions, transform} from '@sanity/tsdoc'
import cac from 'cac'
import chalk from 'chalk'

const cli = cac('pnpm etl')

cli
  .command('[packageName]', 'Extract, transform, and load API documents for a package')
  .option('--releaseVersion <version>', 'Version with which to tag the documents')
  .action((packageName, options) => {
    main({...options, packageName}).catch((err) => {
      console.error(chalk.red(err.message))
      process.exit(1)
    })
  })

cli.help()
cli.parse()

async function main(options: {packageName: string; releaseVersion?: string}): Promise<void> {
  const {packageName, releaseVersion} = options

  if (!packageName) {
    throw new Error('Missing package name. Usage: pnpm etl [packageName]')
  }

  const packagePath = path.resolve(__dirname, '../packages', packageName)

  await etl({cwd: process.cwd(), packageName, packagePath, releaseVersion})
}

function _fetchCurrentPackage(
  sanity: NonNullable<NonNullable<SanityTSDocConfigOptions['output']>['sanity']>,
  params: {name: string},
) {
  const parts = params.name.split('/')
  const scope = parts.length > 1 ? parts[0] : null
  const name = parts.length > 1 ? parts[1] : parts[0]

  const client = createClient({
    ...sanity,
    apiVersion: '2023-06-01',
    useCdn: false,
  })

  return client.fetch(`*[_type == "api.package" && scope == $scope && name == $name][0]`, {
    scope,
    name,
  })
}

async function etl(options: {
  cwd: string
  packageName: string
  packagePath: string
  releaseVersion?: string
}): Promise<void> {
  const {cwd, packageName, packagePath, releaseVersion: releaseVersionOption} = options

  const tsdocConfig = await _loadConfig({packagePath})

  const sanityConfig = tsdocConfig?.output?.sanity

  if (!sanityConfig) {
    throw new Error(
      `Missing sanity config in ${path.relative(
        cwd,
        path.resolve(packagePath, 'tsdoc.config.ts'),
      )}`,
    )
  }

  let timer = startTimer(`Extracting API documents from \`${packageName}\``)
  const {pkg, results} = await extract({
    customTags: tsdocConfig?.extract?.customTags,
    packagePath,
    rules: tsdocConfig?.extract?.rules,
    strict: true,
    tsconfig: tsdocConfig?.input?.tsconfig ?? (baseConfig.tsconfig || 'tsconfig.json'),
    bundledPackages: tsdocConfig?.input?.bundledPackages,
    legacyExports: tsdocConfig?.legacyExports ?? baseConfig.legacyExports ?? false,
  })
  timer.end()

  const releaseVersion = releaseVersionOption || pkg.version

  timer = startTimer('Fetching current package info from Sanity')
  const currPackageDoc = await _fetchCurrentPackage(sanityConfig, {name: pkg.name})
  timer.end()

  timer = startTimer(`Transforming API documents from \`${packageName}\``)
  const documents = transform(results, {
    currPackageDoc,
    package: {
      version: releaseVersion,
    },
  })
  timer.end()

  const targetPath = path.resolve(cwd, `etc/${packageName}/${releaseVersion}.json`)
  const relativePath = path.relative(cwd, targetPath)

  timer = startTimer(`Loading ${documents.length} API documents to ./${relativePath}`)
  await load(documents, {
    cwd: packagePath,
    fs: {path: targetPath},
  })
  timer.end()

  if (sanityConfig.token) {
    timer = startTimer(
      `Loading ${documents.length} API documents to ${sanityConfig.projectId}:${sanityConfig.dataset}`,
    )

    await load(documents, {
      cwd: packagePath,
      sanity: sanityConfig,
    })

    timer.end()
  } else {
    console.log('NOTE: Set EXTRACT_SANITY_API_TOKEN in .env.local to write to Sanity')
  }
}
