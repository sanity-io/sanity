import path from 'path'
import cac from 'cac'
import {createClient} from '@sanity/client'
import {SanityTSDocConfigOptions, _loadConfig, extract, load, transform} from '@sanity/tsdoc'
import chalk from 'chalk'

const cli = cac('yarn etl')

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
    throw new Error('Missing package name. Usage: yarn etl [packageName]')
  }

  const packagePath = path.resolve(__dirname, '../packages', packageName)

  await etl({cwd: process.cwd(), packageName, packagePath, releaseVersion})
}

function _fetchCurrentPackage(
  sanity: NonNullable<NonNullable<SanityTSDocConfigOptions['output']>['sanity']>,
  params: {name: string}
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

  console.log(`Extracting API documents from \`${packageName}\` …`)

  const tsdocConfig = await _loadConfig({packagePath})

  const sanityConfig = tsdocConfig?.output?.sanity

  if (!sanityConfig) {
    throw new Error(
      `Missing sanity config in ${path.relative(cwd, path.resolve(packagePath, 'tsdoc.config.ts'))}`
    )
  }

  const {pkg, results} = await extract({
    packagePath,
  })

  const releaseVersion = releaseVersionOption || pkg.version

  const currPackageDoc = await _fetchCurrentPackage(sanityConfig, {name: pkg.name})

  console.log(`Transforming API documents from \`${packageName}\` …`)

  const documents = transform(results, {
    currPackageDoc,
    package: {
      version: releaseVersion,
    },
  })

  const targetPath = path.resolve(cwd, `etc/${packageName}/${releaseVersion}.json`)

  console.log(`Loading ${documents.length} API documents to ./${path.relative(cwd, targetPath)} …`)

  if (sanityConfig.token) {
    console.log(
      `Loading ${documents.length} API documents to ${sanityConfig.projectId}:${sanityConfig.dataset} …`
    )

    await load(documents, {
      cwd: packagePath,
      sanity: sanityConfig,
    })

    console.log('Loaded', documents.length, 'documents')

    return
  }

  console.log('NOTE: Set EXTRACT_SANITY_WRITE_TOKEN in .env.local to write to Sanity')

  await load(documents, {
    cwd: packagePath,
    fs: {
      path: targetPath,
    },
  })

  console.log('Loaded', documents.length, 'documents')
}
