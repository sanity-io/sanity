import path from 'path'
import bundle from '../../bundle'

/**
 * Bundle a Sanity package
 *
 * - Output files to `lib/` in each package
 * - Bundle files to 1 file.
 * - Support multiple exports per package.
 * - Compile TS definitions to `lib/dts/`
 */
export async function bundleCommand(opts: {
  cwd: string
  target?: 'node' | 'web'
  tsconfig?: string
  watch: boolean
}): Promise<void> {
  const {target = 'web', tsconfig = 'tsconfig.json', watch} = opts
  const cwd = path.resolve(process.cwd(), opts.cwd || '.')

  if (watch) {
    await bundle.watch({cwd, target, tsconfig})
  } else {
    await bundle.build({cwd, target, tsconfig})
  }
}
