import path from 'path'
import {_exports} from '../../exports'

/**
 * Cleans pre-Node14 commonjs exports
 */
export async function exportsCleanCommand(opts: {cwd: string}): Promise<void> {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.')

  await _exports.clean({cwd})
}
