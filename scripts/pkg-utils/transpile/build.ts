import path from 'path'
import chalk from 'chalk'
import globby from 'globby'
import {SUPPORTED_TARGETS} from '../constants'
import {resolveTsconfigPath} from '../helpers'
import {TERM_DIVIDER} from './constants'
import {babelBuild} from './babel/babelBuild'
import {compileDTS, copyFiles} from './helpers'

export async function build(opts: {
  cwd: string
  target: 'node' | 'web'
  tsconfig: string
}): Promise<void> {
  const {cwd, target, tsconfig} = opts

  if (!cwd.includes('packages/')) {
    throw new Error('must be in package')
  }

  if (!SUPPORTED_TARGETS.includes(target)) {
    throw new Error(`unsupported target: "${target}"`)
  }

  const pkg = require(path.resolve(cwd, 'package.json'))

  console.log(TERM_DIVIDER)
  console.log(`${chalk.blue('package ')} ${chalk.yellow(`${pkg.name}@${pkg.version}`)}`)
  console.log(`${chalk.blue('mode')}     transpile`)
  console.log(`${chalk.blue('target')}   ${target}`)

  const tsconfigPath = resolveTsconfigPath({cwd, tsconfig})

  if (tsconfigPath) {
    console.log(chalk.blue('tsconfig'), path.relative(cwd, tsconfigPath))
  }

  const SRC_PATH = path.resolve(cwd, 'src')
  const LIB_PATH = path.resolve(cwd, 'lib')

  const files = await globby([
    path.resolve(SRC_PATH, '**/*.js'),
    path.resolve(SRC_PATH, '**/*.ts'),
    path.resolve(SRC_PATH, '**/*.tsx'),
  ])

  // Run these in parallel
  await Promise.all([transpile(), copy(), dts()])

  async function transpile() {
    if (target === 'web') {
      const [esmOutputs, cjsOutputs] = await Promise.all([
        babelBuild({
          cwd,
          files,
          sourceRootPath: SRC_PATH,
          format: 'esm',
          target,
        }),
        babelBuild({
          cwd,
          files,
          sourceRootPath: SRC_PATH,
          format: 'commonjs',
          target,
        }),
      ])

      console.log(
        `${chalk.green('transpiled')} ${esmOutputs.length} chunks to ${path.relative(
          cwd,
          LIB_PATH
        )}/esm/`
      )
      console.log(
        `${chalk.green('transpiled')} ${cjsOutputs.length} chunks to ${path.relative(
          cwd,
          LIB_PATH
        )}/cjs/`
      )
    }

    if (target === 'node') {
      const cjsOutputs = await babelBuild({
        cwd,
        files,
        sourceRootPath: SRC_PATH,
        format: 'commonjs',
        target,
      })

      console.log(`transpiled ${cjsOutputs.length} chunks to ${path.relative(cwd, LIB_PATH)}/`)
    }
  }

  async function copy() {
    if (target === 'web') {
      await copyFiles({srcPath: SRC_PATH, libPath: `${LIB_PATH}/esm`})
      await copyFiles({srcPath: SRC_PATH, libPath: `${LIB_PATH}/cjs`})
    }

    if (target === 'node') {
      await copyFiles({srcPath: SRC_PATH, libPath: LIB_PATH})
    }

    console.log(`${chalk.green('copied')} files`)
  }

  async function dts() {
    if (tsconfigPath) {
      await compileDTS({cwd, tsconfig})

      console.log(`${chalk.green('compiled')} TS definitions`)
    }
  }

  console.log(TERM_DIVIDER)
}
