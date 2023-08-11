import path from 'path'
import fs from 'fs/promises'
import cac from 'cac'
import ora from 'ora'
import {createClient, SanityClient} from '@sanity/client'
import {SanityTSDocConfigOptions, _loadConfig, extract, load, transform} from '@sanity/tsdoc'
import chalk from 'chalk'
import {deburr} from 'lodash'

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

export function sanityIdify(input: string) {
  return deburr(input)
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^-/, '')
}

async function main(options: {packageName: string; releaseVersion?: string}): Promise<void> {
  const {packageName, releaseVersion} = options

  if (!packageName) {
    throw new Error('Missing package name. Usage: yarn etl [packageName]')
  }

  const packagePath = path.resolve(__dirname, '../packages', packageName)

  await etl({cwd: process.cwd(), packageName, packagePath, releaseVersion})
}

function _fetchCurrentPackage(client: SanityClient, params: {name: string}) {
  const parts = params.name.split('/')
  const scope = parts.length > 1 ? parts[0] : null
  const name = parts.length > 1 ? parts[1] : parts[0]

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
      `Missing sanity config in ${path.relative(cwd, path.resolve(packagePath, 'tsdoc.config.ts'))}`
    )
  }

  const client = createClient({
    ...sanityConfig,
    apiVersion: '2023-06-01',
    useCdn: false,
  })

  let timer = startTimer(`Extracting API documents from \`${packageName}\``)
  const {pkg, results} = await extract({
    packagePath,
  })
  timer.end()

  const releaseVersion = releaseVersionOption || pkg.version

  const report = {
    _id: `apidocs-report-${`${sanityIdify(releaseVersion)}-${sanityIdify(packageName)}`}`,
    _type: 'api.report',
    packages: results.map((result) => {
      return {
        _key: result.apiPackage?.name,
        _type: 'api.report.package',
        packageName: `${result.apiPackage?.name}/${result.exportPath}`,
        properties: result.apiPackage?.members[0]?.members.map((member) => {
          return {
            name: member.displayName,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            isExported: member.isExported,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            isCommented: member.tsdocComment !== undefined,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            modifierTags: member?.tsdocComment?.modifierTagSet?.nodes
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              ?.map((tag) => tag.tagName),
          }
        }),
      }
    }),
  }

  await client.createOrReplace(report)

  timer = startTimer('Fetching current package info from Sanity')
  const currPackageDoc = await _fetchCurrentPackage(client, {name: pkg.name})
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
      `Loading ${documents.length} API documents to ${sanityConfig.projectId}:${sanityConfig.dataset}`
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

function startTimer(label: string) {
  const spinner = ora(label).start()
  const start = Date.now()
  return {
    end: () => spinner.succeed(`${label} (${formatMs(Date.now() - start)})`),
  }
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
}
