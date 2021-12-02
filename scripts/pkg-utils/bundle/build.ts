import path from 'path'
import chalk from 'chalk'
import {RollupError} from 'rollup'
import {SUPPORTED_TARGETS} from '../constants'
import {resolveTsconfigPath} from '../helpers'
import {TERM_DIVIDER} from './constants'
import {_resolveExternal, _resolveInput} from './helpers'
import {rollupBundle} from './rollup/rollupBundle'

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
  console.log(`${chalk.blue('package ')} ${pkg.name}@${pkg.version}`)
  console.log(`${chalk.blue('mode')}     bundle`)
  console.log(`${chalk.blue('target')}   ${target}`)

  const tsconfigPath = resolveTsconfigPath({cwd, tsconfig})

  if (tsconfigPath) {
    console.log(chalk.blue('tsconfig'), path.relative(cwd, tsconfigPath))
  }

  const external = _resolveExternal({pkg})
  const outDir = path.resolve(cwd, 'lib')
  const input = _resolveInput({cwd, outDir, pkg})

  try {
    const [esmFiles, cjsFiles] = await Promise.all([
      rollupBundle({
        build: {
          format: 'esm',
          outDir,
        },
        cwd,
        external,
        input,
        target,
        tsconfig: tsconfigPath,
      }),
      rollupBundle({
        build: {
          format: 'commonjs',
          outDir,
        },
        cwd,
        external,
        input,
        target,
        tsconfig: tsconfigPath,
      }),
    ])

    for (const file of esmFiles) {
      console.log(chalk.green(`${file.type}   `), path.relative(cwd, file.path))
    }

    for (const file of cjsFiles) {
      console.log(chalk.green(`${file.type}   `), path.relative(cwd, file.path))
    }
  } catch (err) {
    const bundleError = err as RollupError

    if (bundleError.code === 'PARSE_ERROR') {
      console.error(chalk.red(bundleError.parserError))
      console.error(
        [
          `${chalk.cyan(bundleError.loc?.file)}`,
          `:${chalk.yellow(bundleError.loc?.line)}:${chalk.yellow(bundleError.loc?.column)}`,
        ].join('')
      )

      console.error(chalk.yellow(bundleError.frame))
    } else {
      console.error(bundleError)
    }

    throw new Error('build failed')
  }

  console.log(TERM_DIVIDER)
}
