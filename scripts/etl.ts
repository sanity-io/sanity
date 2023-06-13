import path from 'path'
import {createClient} from '@sanity/client'
import {SanityTSDocConfigOptions, _loadConfig, extract, load, transform} from '@sanity/tsdoc'
import chalk from 'chalk'

// RUN
main().catch((err) => {
  console.error(chalk.red(err.message))
  process.exit(1)
})

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  const packageName = args[0]

  if (!packageName) {
    throw new Error('Missing package name. Usage: yarn etl <package-name>')
  }

  const packagePath = path.resolve(__dirname, '../packages', packageName)

  await etl({cwd: process.cwd(), packagePath})
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

async function etl(options: {cwd: string; packagePath: string}): Promise<void> {
  const {cwd, packagePath} = options

  console.log(`Extracting API documents from ${path.relative(cwd, packagePath)} …`)

  const tsdocConfig = await _loadConfig({packagePath})

  const sanityConfig = tsdocConfig?.output.sanity

  if (!sanityConfig) {
    throw new Error(
      `Missing sanity config in ${path.relative(cwd, path.resolve(packagePath, 'tsdoc.config.ts'))}`
    )
  }

  const {pkg, results} = await extract({
    packagePath,
  })

  const currPackageDoc = await _fetchCurrentPackage(sanityConfig, {name: pkg.name})

  console.log(`Transforming API documents …`)

  const documents = transform(results, {
    currPackageDoc,
    package: {
      version: pkg.version,
    },
  })

  // TODO
  // Do custom transformations on `documents` here

  if (sanityConfig.token) {
    console.log(
      `Loading ${documents.length} API documents to ${sanityConfig.projectId}:${sanityConfig.dataset} …`
    )

    await load(documents, {
      cwd: packagePath,
      sanity: sanityConfig,
    })

    console.log('Wrote', documents.length, 'documents')

    return
  }

  console.log('NOTE: Set EXTRACT_SANITY_WRITE_TOKEN in .env.local to write to Sanity')

  console.log('Transformed', documents.length, 'documents')
}
