import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import esbuild from 'esbuild'
import {getPkgUtilsConfig} from '../config'
import {TERM_DIVIDER} from './constants'

export async function check(opts: {cwd: string; target: 'node' | 'web'}): Promise<void> {
  const {cwd, target: baseTarget} = opts

  if (!cwd.includes('packages/')) {
    throw new Error('must be in package')
  }

  const pkg = require(path.resolve(cwd, 'package.json'))

  const {exports: pkgExports} = pkg
  if (!pkgExports) {
    throw new Error(`There is no exports field in: "${path.resolve(cwd, 'package.json')}"`)
  }

  const {exportsCheck: exportsConfig = {}} = getPkgUtilsConfig({cwd})

  const external = [
    ...new Set([
      // @TODO add support for depcheckignore files
      ...(pkg.dependencies ? Object.keys(pkg.dependencies) : []),
      ...(pkg.devDependencies ? Object.keys(pkg.devDependencies) : []),
      ...(pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : []),
    ]),
  ]

  console.log(TERM_DIVIDER)
  console.log(`${chalk.blue('package ')} ${chalk.yellow(`${pkg.name}@${pkg.version}`)}`)
  console.log(`${chalk.blue('mode')}     exports-check`)
  console.log(`${chalk.green('exports')}  ${Object.keys(pkgExports).length} files`)

  const missing = []
  const cjsMap = new Map<string, string>()
  const cjsNodeMap = new Map<string, string>()
  const esmMap = new Map<string, string>()
  const esmNodeMap = new Map<string, string>()
  // eslint-disable-next-line guard-for-in -- this is JSON so no need to filter out unwanted stuff
  for (const pathname in pkgExports) {
    const exportConfig = exportsConfig[pathname] || {}
    const exportTarget = exportConfig.target || baseTarget
    const pkgExport = pkgExports[pathname]

    if ('source' in pkgExport) {
      const sourcePath = path.resolve(cwd, pkgExport.source)
      try {
        await fs.access(sourcePath)
      } catch {
        missing.push(path.normalize(pkgExport.source))
      }
    }

    if ('require' in pkgExport) {
      const requirePath = path.resolve(cwd, pkgExport.require)
      try {
        const targetMap = exportTarget === 'node' ? cjsNodeMap : cjsMap
        await fs.access(requirePath)
        targetMap.set(path.join(pkg.name, pathname), requirePath)
      } catch {
        missing.push(path.normalize(pkgExport.require))
      }
    }

    if ('default' in pkgExport) {
      const esmPath = path.resolve(cwd, pkgExport.default)
      try {
        const targetMap = exportTarget === 'node' ? esmNodeMap : esmMap
        await fs.access(esmPath)
        targetMap.set(path.join(pkg.name, pathname), esmPath)
      } catch {
        missing.push(path.normalize(pkgExport.default))
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing files: ${missing.join(', ')}`)
  }

  // Running them in a sequence intentionally, to avoid interleaved log messages
  await _check({format: 'cjs', exports: cjsMap, external, cwd, target: baseTarget})
  await _check({format: 'cjs', exports: cjsNodeMap, external, cwd, target: 'node'})
  await _check({format: 'esm', exports: esmMap, external, cwd, target: baseTarget})
  await _check({format: 'esm', exports: esmNodeMap, external, cwd, target: 'node'})

  console.log(TERM_DIVIDER)
}

async function _check(opts: {
  cwd: string
  exports: Map<string, string>
  format: 'cjs' | 'esm'
  external: string[]
  target: 'node' | 'web'
}) {
  if (opts.exports.size === 0) {
    return
  }

  const imports = []

  for (const [identifier] of opts.exports) {
    imports.push(opts.format === 'cjs' ? `require('${identifier}');` : `import '${identifier}';`)
  }

  const result = await esbuild.build({
    external: opts.target === 'node' ? undefined : opts.external,
    stdin: {
      contents: imports.join('\n'),
      loader: 'js',
      resolveDir: opts.cwd,
    },
    format: opts.format,
    bundle: opts.target !== 'node',
    // otherwise output maps to stdout as we're using stdin
    outfile: '/dev/null',
    platform: opts.target === 'node' ? 'node' : undefined,
  })

  if (result.errors.length > 0) {
    throw new Error(result.errors.join(', '))
  }

  if (result.warnings.length > 0) {
    console.warn(...result.warnings)
  }

  console.log(`${chalk.green(opts.format)}      ${opts.exports.size} files`)
}
