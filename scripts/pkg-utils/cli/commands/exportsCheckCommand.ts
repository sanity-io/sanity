import path from 'path'
import {_exports} from '../../exports'

/**
 * Checks that the package json `exports` files exists and are in the right module format
 *
 * - Reads the package.json `exports`
 * - Runs esbuild on both `esm` and `cjs` exported files
 * - Doesn't write to anything, but will fail with a non-zero exit code if there are errors
 */
export async function exportsCheckCommand(opts: {
  cwd: string
  target: 'node' | 'web'
}): Promise<void> {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.')

  await _exports.check({cwd, target: opts.target})
}
