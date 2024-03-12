import {join} from 'node:path'

import {type TransformOptions} from '@babel/core'
import register from '@babel/register'

const defaultBabelOptions = {
  extends: join(__dirname, '..', '..', 'babel.config.json'),
}

/**
 * Register Babel with the given options
 * @param babelOptions - The options to use when registering Babel
 * @beta
 */
export function registerBabel(babelOptions: TransformOptions = defaultBabelOptions): void {
  register({...babelOptions, extensions: ['.ts', '.tsx', '.js', '.jsx']})
}
