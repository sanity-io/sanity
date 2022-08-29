import path from 'path'
import {APIPackageDocument, TransformResult} from '@sanity/tsdoc-to-portable-text'
import cac from 'cac'
import chalk from 'chalk'
import {_parsePackageName} from './_helpers'
import {config} from './config'
import {extractFromTsdoc, extractPackagesFromSanity} from './extract'
import {loadToFs, loadToSanity} from './load'
import {transformTsdocToPortableText} from './transform'

const ROOT_PATH = path.resolve(__dirname, '../..')

function main() {
  const cwd = ROOT_PATH // process.cwd()
  const cli = cac('yarn etl')

  cli
    .command('[pattern]')
    .option('--quiet', '[boolean] print only crucial logs')
    .action(async (pattern, options) => {
      const workspace = pattern ? config.workspace.filter((p) => p === pattern) : config.workspace

      if (workspace.length === 0) {
        console.error(`${chalk.red('error')} no matching packages "${pattern}"`)
        process.exit(1)
      }

      const quiet = Boolean(options.quiet)

      try {
        const packages = await extractPackagesFromSanity({quiet, workspace})
        const packageResults = await extractFromTsdoc({workspace, quiet})

        const docs: TransformResult = []

        for (const fullName of workspace) {
          const [scope, name] = _parsePackageName(fullName)
          const pkg = packages.find((p) => p.scope === scope && p.name === name)
          const pkgResult = packageResults.find((r) => r.name === name)

          if (!pkgResult) {
            throw new Error(`Package was not found (name=${name})`)
          }

          const {results, version} = pkgResult

          const workspaceDocs = transformTsdocToPortableText({
            scope,
            name,
            package: pkg as APIPackageDocument | undefined,
            quiet,
            results,
            version,
          })

          await loadToFs({
            cwd,
            scope,
            name,
            version,
            docs: workspaceDocs,
          })

          docs.push(...workspaceDocs)
        }

        await loadToSanity(docs)
      } catch (error) {
        if (error instanceof Error) {
          console.error(`${chalk.red('error')} ${quiet ? error.message : error.stack}`)
        }

        process.exit(1)
      }
    })

  cli.help()
  cli.parse()
}

main()
