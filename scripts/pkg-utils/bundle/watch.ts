import path from 'path'
import chalk from 'chalk'
import {RollupError} from 'rollup'
import {resolveTsconfigPath} from '../helpers'
import {_resolveExternal, _resolveInput} from './helpers'
import {rollupBundle} from './rollup/rollupBundle'

export async function watch(opts: {
  cwd: string
  target: 'node' | 'web'
  tsconfig: string
}): Promise<void> {
  const {cwd, target, tsconfig} = opts

  if (!cwd.includes('packages/')) {
    throw new Error('must be in package')
  }

  const pkg = require(path.resolve(cwd, 'package.json'))

  console.log(`${chalk.blue('watch')} ${pkg.name}@${pkg.version}`)

  const tsconfigPath = resolveTsconfigPath({cwd, tsconfig})
  const external = _resolveExternal({pkg})
  const outDir = path.resolve(cwd, 'lib')
  const input = _resolveInput({cwd, outDir, pkg})

  try {
    await Promise.all([
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
        watch: true,
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
        watch: true,
      }),
    ])
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
}
