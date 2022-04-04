import {TransformOptions} from '@babel/core'
import {ModuleFormat} from 'rollup'
import rawBabelConfig from '../../babel.config'
import {isRecord} from './helpers'

/**
 * Get Babel config to use for either `bundle` or `transpile` builds.
 */
export function getBabelConfig(opts: {format?: ModuleFormat} = {}): TransformOptions {
  const {format = 'commonjs'} = opts
  const babelConfig = {...rawBabelConfig}

  babelConfig.presets = babelConfig.presets.map((preset: unknown) => {
    if (preset === '@babel/env' || (Array.isArray(preset) && preset[0] === '@babel/env')) {
      return [
        '@babel/env',
        {
          ...(isRecord(preset[1]) ? preset[1] : {}),
          modules: format === 'commonjs' ? 'commonjs' : false,
        },
      ]
    }

    return preset
  })

  return babelConfig
}
