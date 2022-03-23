import path from 'path'
import {_exports} from '../../exports'

/**
 * Generates pre-Node14 commonjs exports
 *
 * - Outputs a `<export>.js` in the root of the reposity for each export
 */
export async function exportsGenerateCommand(opts: {cwd: string}): Promise<void> {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.')

  await _exports.generate({cwd})
}
