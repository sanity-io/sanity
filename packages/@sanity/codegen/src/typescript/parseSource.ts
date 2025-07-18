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
  } else if (filename.endsWith('.vue')) {
    // append .ts to the filename so babel will parse it as typescript
    filename += '.ts'
    source = parseVue(source)
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

function parseVue(source: string): string {
  // find all script tags, the js code is between <script> and </script>
  const scriptRegex = /<script(?:\s+generic=["'][^"']*["'])?[^>]*>([\s\S]*?)<\/script>/g
  // const matches = [...source.matchAll(scriptRegex)]
  // TODO: swap once this code runs in `ES2020`
  const matches = matchAllPolyfill(source, scriptRegex)
  if (!matches.length) {
    return ''
  }

  return matches.map((match) => match[1]).join('\n')
}

// TODO: remove once this code runs in `ES2020`
function matchAllPolyfill(str: string, regex: RegExp): RegExpMatchArray[] {
  if (!regex.global) {
    throw new Error('matchAll polyfill requires a global regex (with /g flag)')
  }

  const matches = []
  let match
  while ((match = regex.exec(str)) !== null) {
    matches.push(match)
  }
  return matches
}
