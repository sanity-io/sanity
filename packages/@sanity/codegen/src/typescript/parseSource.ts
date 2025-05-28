import {parse, type TransformOptions} from '@babel/core'
import type * as babelTypes from '@babel/types'

// helper function to parse a source file
export function parseSourceFile(
  _source: string,
  _filename: string,
  babelOptions: TransformOptions,
): babelTypes.File {
  let source = _source
  let filename = _filename
  if (filename.endsWith('.astro')) {
    // append .ts to the filename so babel will parse it as typescript
    filename += '.ts'
    source = parseAstro(source)
  }
  const result = parse(source, {
    ...babelOptions,
    filename,
  })

  if (!result) {
    throw new Error(`Failed to parse ${filename}`)
  }

  return result
}

function parseAstro(source: string): string {
  // find all code fences, the js code is between --- and ---
  const codeFences = source.match(/---\n([\s\S]*?)\n---/g)
  if (!codeFences) {
    return ''
  }

  return codeFences
    .map((codeFence) => {
      return codeFence.split('\n').slice(1, -1).join('\n')
    })
    .join('\n')
}
