import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import mkdirp from 'mkdirp'
import {isRecord, isString} from '../helpers'
import {TERM_DIVIDER} from './constants'
import {_reExportHelperSnippet} from './_snippets'

export async function generate(opts: {cwd: string}): Promise<void> {
  const {cwd} = opts
  const pkg = require(path.resolve(cwd, 'package.json'))
  const entries = Object.entries(pkg.exports)

  console.log(TERM_DIVIDER)

  console.log(`${chalk.blue('package')}    ${chalk.yellow(`${pkg.name}@${pkg.version}`)}`)
  console.log(`${chalk.green('exports')}  ${entries.length} exports`)

  await mkdirp(path.resolve(cwd, 'lib'))

  const reExportHelperPath = path.resolve(cwd, 'lib/_reExport.js')

  await fs.writeFile(reExportHelperPath, _reExportHelperSnippet)

  for (const [entryPath, entry] of entries) {
    if (entryPath !== '.' && isRecord(entry) && isString(entry.require)) {
      const filePath = `${path.resolve(cwd, entryPath === '.' ? 'index' : entryPath)}.js`
      const dirPath = path.dirname(filePath)

      const code = [
        `/* eslint-disable prettier/prettier, strict */\n`,
        `'use strict'\n\n`,
        `// AUTO-GENERATED – DO NOT EDIT\n`,
        `// This is a legacy package export\n`,
        `// prettier-ignore\n`,
        `require('${_toModulePath(dirPath, reExportHelperPath)}')(`,
        `module.exports, `,
        `require('${_toModulePath(dirPath, entry.require)}')`,
        `)\n`,
      ].join('')

      await mkdirp(dirPath)
      await fs.writeFile(filePath, code)

      console.log('export', path.relative(cwd, filePath))
    }
  }

  console.log(TERM_DIVIDER)
}

function _toModulePath(cwd: string, filePath: string) {
  // Check if the `filePath` is a valid file path (and not a module path)
  if (!filePath.startsWith('.') && !filePath.startsWith('/')) {
    return filePath
  }

  const ext = path.extname(filePath)

  const basename = path.basename(filePath, ext === '.js' ? '.js' : undefined)
  const dirname = path.dirname(filePath)

  const modulePath = path.join(path.relative(cwd, dirname), basename)

  if (!modulePath.startsWith('.')) {
    return `./${modulePath}`
  }

  return modulePath
}
