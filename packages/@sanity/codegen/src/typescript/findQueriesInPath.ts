import fs from 'node:fs/promises'

import {type TransformOptions} from '@babel/core'
import createDebug from 'debug'
import glob from 'globby'

import {getBabelConfig} from '../getBabelConfig'
import {type NamedQueryResult} from './expressionResolvers'
import {findQueriesInSource} from './findQueriesInSource'
import {getResolver} from './moduleResolver'

const debug = createDebug('sanity:codegen:findQueries:debug')

type ResultQueries = {
  type: 'queries'
  filename: string
  queries: NamedQueryResult[]
}
type ResultError = {
  type: 'error'
  error: Error
  filename: string
}

/**
 * findQueriesInPath takes a path or array of paths and returns all GROQ queries in the files.
 * @param path - The path or array of paths to search for queries
 * @param babelOptions - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns An async generator that yields the results of the search
 * @beta
 * @internal
 */
export async function* findQueriesInPath({
  path,
  babelOptions = getBabelConfig(),
  resolver = getResolver(),
}: {
  path: string | string[]
  babelOptions?: TransformOptions
  resolver?: NodeJS.RequireResolve
}): AsyncGenerator<ResultQueries | ResultError> {
  const queryNames = new Set()
  // Holds all query names found in the source files
  debug(`Globing ${path}`)

  const files = glob
    .sync(path, {
      absolute: false,
      ignore: ['**/node_modules/**'], // we never want to look in node_modules
      onlyFiles: true,
    })
    .sort()

  for (const filename of files) {
    if (typeof filename !== 'string') {
      continue
    }

    debug(`Found file "${filename}"`)
    try {
      const source = await fs.readFile(filename, 'utf8')
      const queries = findQueriesInSource(source, filename, babelOptions, resolver)
      // Check and error on duplicate query names, because we can't generate types with the same name.
      for (const query of queries) {
        if (queryNames.has(query.name)) {
          throw new Error(
            `Duplicate query name found: "${query.name}". Query names must be unique across all files.`,
          )
        }
        queryNames.add(query.name)
      }
      yield {type: 'queries', filename, queries}
    } catch (error) {
      debug(`Error in file "${filename}"`, error)
      yield {type: 'error', error, filename}
    }
  }
}
