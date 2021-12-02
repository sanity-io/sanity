import path from 'path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import cpx from 'cpx'
import rimraf from 'rimraf'
import {SUPPORTED_TARGETS} from '../constants'
import {resolveTsconfigPath} from '../helpers'
import {TRANSPILE_EXTENSIONS} from './constants'
import {babelBuild} from './babel/babelBuild'
import {compileDTS} from './helpers'

export async function watch(opts: {
  cwd: string
  target: 'node' | 'web'
  tsconfig: string
}): Promise<void> {
  const {cwd, target, tsconfig} = opts

  if (!SUPPORTED_TARGETS.includes(target)) {
    throw new Error(`unsupported target: "${target}"`)
  }

  const pkg = require(path.resolve(cwd, 'package.json'))

  console.log(`${chalk.blue('watching')} ${chalk.yellow(`${pkg.name}@${pkg.version}`)}`)

  const tsconfigPath = resolveTsconfigPath({cwd, tsconfig})

  const SRC_PATH = path.resolve(cwd, 'src')
  const LIB_PATH = path.resolve(cwd, 'lib')

  const watcher = chokidar.watch('**/*', {cwd: SRC_PATH})

  function copy(filePath: string) {
    if (opts.target === 'web') {
      cpx.copy(path.resolve(SRC_PATH, filePath), path.resolve(LIB_PATH, 'esm', filePath))
      cpx.copy(path.resolve(SRC_PATH, filePath), path.resolve(LIB_PATH, 'cjs', filePath))
    }

    if (opts.target === 'node') {
      cpx.copy(path.resolve(SRC_PATH, filePath), path.resolve(LIB_PATH, filePath))
    }
  }

  async function transpile(filePath: string) {
    if (opts.target === 'web') {
      await Promise.all([
        babelBuild({
          cwd,
          files: [path.resolve(SRC_PATH, filePath)],
          sourceRootPath: SRC_PATH,
          format: 'esm',
          target,
          watch: true,
        }),
        babelBuild({
          cwd,
          files: [path.resolve(SRC_PATH, filePath)],
          sourceRootPath: SRC_PATH,
          format: 'commonjs',
          target,
          watch: true,
        }),
      ])
    }

    if (opts.target === 'node') {
      await babelBuild({
        cwd,
        files: [path.resolve(SRC_PATH, filePath)],
        sourceRootPath: SRC_PATH,
        format: 'commonjs',
        target,
        watch: true,
      })
    }
  }

  function unlink(filePath: string) {
    if (opts.target === 'web') {
      rimraf(path.resolve(LIB_PATH, 'esm', filePath), () => undefined)
      rimraf(path.resolve(LIB_PATH, 'cjs', filePath), () => undefined)
    }

    if (opts.target === 'node') {
      rimraf(path.resolve(LIB_PATH, filePath), () => undefined)
    }
  }

  watcher.on('all', (eventType, filePath) => {
    if (['add', 'change'].includes(eventType)) {
      const ext = path.extname(filePath)

      if (TRANSPILE_EXTENSIONS.includes(ext)) {
        transpile(filePath)
      } else {
        copy(filePath)
      }
    }

    if (eventType === 'unlink') {
      const ext = path.extname(filePath)

      if (TRANSPILE_EXTENSIONS.includes(ext)) {
        unlink(`${filePath.slice(0, 0 - ext.length)}.js`)
      } else {
        unlink(filePath)
      }
    }
  })

  if (tsconfigPath) {
    await compileDTS({cwd, tsconfig, watch: true})
  }
}
