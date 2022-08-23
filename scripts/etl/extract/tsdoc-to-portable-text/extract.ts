import path from 'path'
import {
  extract,
  ExtractorLogLevel,
  ExtractorMessage,
  ExtractResult,
} from '@sanity/tsdoc-to-portable-text'
import chalk from 'chalk'
import {
  _encodePackageName,
  _parsePackageName,
  isRecord,
  isString,
  readJSONFile,
} from '../../_helpers'

const ROOT_PATH = path.resolve(__dirname, '../../../..')

export interface PackageResult {
  scope?: string
  name: string
  results: ExtractResult[]
  version: string
}

export function extractFromTsdoc(options: {
  quiet: boolean
  workspace: string[]
}): Promise<PackageResult[]> {
  const {quiet, workspace} = options

  return Promise.all(
    workspace.map((nameStr) => {
      const [scope, name] = _parsePackageName(nameStr)

      return _extractPackage({scope, name, quiet})
    })
  )
}

async function _extractPackage(options: {
  scope?: string
  name: string
  quiet: boolean
}): Promise<PackageResult> {
  const {scope, name, quiet} = options
  const fullName = _encodePackageName(scope, name)

  if (!quiet) {
    console.log(`${chalk.blue('info')} [${fullName}] Extract from TSDoc`)
  }

  const packagePath = path.resolve(ROOT_PATH, 'packages', fullName)
  const packageJsonPath = path.resolve(packagePath, 'package.json')
  const pkg = await readJSONFile(packageJsonPath)

  if (!isRecord(pkg)) {
    throw new Error('The package manifest is not an object')
  }

  const version = pkg.version

  if (!isString(version)) {
    throw new Error(`the package version is not a string (value=${JSON.stringify(version)})`)
  }

  const results = await extract(packagePath, {
    reporting: {
      compilerMessageReporting: {
        default: {
          logLevel: 'warning' as ExtractorLogLevel,
        },
      },

      extractorMessageReporting: {
        default: {
          logLevel: 'warning' as ExtractorLogLevel,
          addToApiReportFile: false,
        },

        // 'ae-extra-release-tag': {
        //   logLevel: 'error' as ExtractorLogLevel,
        //   addToApiReportFile: false,
        // },

        // 'ae-forgotten-export': {
        //   logLevel: 'error' as ExtractorLogLevel,
        //   addToApiReportFile: false,
        // },
      },

      tsdocMessageReporting: {
        default: {
          logLevel: 'warning' as ExtractorLogLevel,
          addToApiReportFile: false,
        },

        'tsdoc-unsupported-tag': {
          logLevel: 'none' as ExtractorLogLevel,
          addToApiReportFile: false,
        },

        'tsdoc-undefined-tag': {
          logLevel: 'none' as ExtractorLogLevel,
          addToApiReportFile: false,
        },
      },
    },
  })

  const messages = results.reduce<ExtractorMessage[]>((acc, x) => acc.concat(x.messages), [])

  if (!quiet) {
    const warnings: ExtractorMessage[] = messages.filter((msg) => msg.logLevel === 'warning')

    for (const msg of warnings) {
      const sourceFilePath = msg.sourceFilePath && path.relative(ROOT_PATH, msg.sourceFilePath)

      console.log(
        [
          `${chalk.cyan(sourceFilePath || '?')}`,
          `:${chalk.yellow(msg.sourceFileLine)}:${chalk.yellow(msg.sourceFileColumn)}`,
          ` - ${chalk.yellow('warning')} ${chalk.gray(msg.messageId)}\n`,
          msg.text,
          '\n',
        ].join('')
      )
    }
  }

  const errors: ExtractorMessage[] = messages.filter((msg) => msg.logLevel === 'error')
  for (const msg of errors) {
    const sourceFilePath = msg.sourceFilePath && path.relative(ROOT_PATH, msg.sourceFilePath)
    console.log(
      [
        `${chalk.cyan(sourceFilePath || '?')}`,
        `:${chalk.yellow(msg.sourceFileLine)}:${chalk.yellow(msg.sourceFileColumn)}`,
        ` - ${chalk.red('error')} ${chalk.gray(msg.messageId)}\n`,
        msg.text,
        '\n',
      ].join('')
    )
  }

  const allSucceeded = results.every((r) => r.succeeded)

  if (!allSucceeded) {
    throw new Error(`[${fullName}] Extracting from TSDoc failed`)
  }

  console.log(`${chalk.green('success')} [${fullName}] Extracted from TSDoc`)

  return {scope, name, results, version}
}
