import {type TransformOptions} from '@babel/core'
import register from '@babel/register'

import {getBabelConfig} from '../getBabelConfig'

/**
 * Register Babel with the given options
 *
 * @param babelOptions - The options to use when registering Babel
 * @beta
 */
export function registerBabel(babelOptions?: TransformOptions): void {
  const options = babelOptions || getBabelConfig()

  register({...options, extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']})
}
