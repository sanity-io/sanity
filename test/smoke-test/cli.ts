/* eslint-disable no-console, no-process-exit */

import childProcess from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import util from 'util'
import chalk from 'chalk'
import tmp from 'tmp'
import _rimraf from 'rimraf'

const rimraf = util.promisify(_rimraf)

const files = {
  'package.json': [
    `{`,
    `  "private": true,`,
    `  "name": "test",`,
    `  "version": "0.0.0-development",`,
    `  "dependencies": {}`,
    `}`,
  ].join(''),
}

test().catch((err) => {
  console.error(chalk.red(err))
  process.exit(1)
})

const fakeRegistryPath = path.resolve(__dirname, '../../etc/npm')

/**
 * This test will:
 * - install `@sanity/cli` from the tarball location (`etc/npm/*.tgz`)
 * - run `sanity init`
 * - throw an exception if anything goes wrong
 */
async function test() {
  const tmpobj = tmp.dirSync()
  const cwd = tmpobj.name

  try {
    // init
    await fs.writeFile(path.resolve(cwd, 'package.json'), files['package.json'])

    //
    await _exec('npm', ['install', _tarball('@sanity/cli')], {cwd, stdio: 'inherit'})

    await _exec(
      'sanity',
      [
        'init',

        // dataset
        '--dataset',
        'test',

        // output path
        '--output-path',
        `${cwd}/studio`,

        // project
        '--project',
        'ppsg7ml5',

        // typescript
        '--typescript',

        // visibility
        '--visibility',
        'public',

        // unattended mode
        '-y',
      ],
      {cwd, stdio: 'inherit'}
    )

    await _exec('sanity', ['build'], {cwd: path.resolve(cwd, 'studio'), stdio: 'inherit'})
  } catch (_err) {
    try {
      // clean up
      await rimraf(cwd)
    } catch (_) {
      // ignore
    }

    throw _err
  }
}

function _tarball(name: string) {
  const versions = require('../../etc/npm/versions.json')
  const version = versions[name]

  return path.resolve(fakeRegistryPath, name, `v${version}.tgz`)
}

function _exec(cmd: string, args: any[], options: childProcess.SpawnOptions): Promise<void> {
  console.log('')
  console.log(`${chalk.green('$')} ${chalk.cyan([cmd, ...args].join(' '))}`)

  return new Promise((resolve, reject) => {
    const stream = childProcess.spawn(cmd, args, options)

    stream.on('close', () => resolve())
    stream.on('error', (err) => reject(err))
  })
}
