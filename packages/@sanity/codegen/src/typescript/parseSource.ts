import {parse, type TransformOptions} from '@babel/core'
import type * as babelTypes from '@babel/types'

// helper function to parse a source file
export function parseSourceFile(
  source: string,
  filename: string,
  babelOptions: TransformOptions,
): babelTypes.File {
  const result = parse(source, {
    ...babelOptions,
    filename,
  })

  if (!result) {
    throw new Error(`Failed to parse ${filename}`)
  }

  return result
}
