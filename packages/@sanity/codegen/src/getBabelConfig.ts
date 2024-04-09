import {existsSync} from 'node:fs'
import {join, resolve} from 'node:path'

import {type TransformOptions} from '@babel/core'

/**
 * Because of bundlers and compilers, knowing the exact path the babel configuration will be
 * located at post - build is not always trivial. We traverse from the current directory upwards
 * until we find the first `babel.config.json` and use that path.
 *
 * @param path - The path to start looking for the babel configuration
 * @returns The path to the `babel.config.json` file
 * @internal
 */
export function findBabelConfig(path: string): string {
  const configPath = join(path, 'babel.config.json')
  if (existsSync(configPath)) {
    return configPath
  }

  const parent = resolve(join(path, '..'))
  if (parent && parent !== path) {
    return findBabelConfig(parent)
  }

  throw new Error('Could not find `babel.config.json` in @sanity/codegen')
}

/**
 * Get the default babel configuration for `@sanity/codegen`
 *
 * @param path - The path to start looking for the babel configuration. Defaults to `__dirname`
 * @returns A babel configuration object
 * @internal
 */
export function getBabelConfig(path?: string): TransformOptions {
  const configPath = findBabelConfig(path || __dirname)
  return {extends: configPath}
}
