import fs from 'node:fs/promises'

import {type TransformOptions} from '@babel/core'
import createDebug from 'debug'
import glob from 'globby'

import {getBabelConfig} from '../getBabelConfig'
import {
  findAllQueriesInSource,
  findNamedQueriesInSource,
  type NamedQueryResult,
  type QueryResult,
} from './findQueriesInSource'
import {getResolver} from './moduleResolver'

const debug = createDebug('sanity:codegen:findQueries:debug')

type ResultNamedQueries = {
  type: 'queries'
  filename: string
  queries: NamedQueryResult[]
}
type ResultAllQueries = {
  type: 'queries'
  filename: string
  queries: QueryResult[]
}
type ResultError = {
  type: 'error'
  error: Error
  filename: string
}

function globPath(path: string | string[]) {
  debug(`Globing ${path}`)
  return glob.stream(path, {
    absolute: false,
    ignore: ['**/node_modules/**'], // we never want to look in node_modules
    onlyFiles: true,
  })
}

/**
 * findQueriesInPath takes a path or array of paths and returns all named GROQ queries in the files.
 * @param path - The path or array of paths to search for queries
 * @param babelOptions - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns An async generator that yields the results of the search
 * @beta
 * @internal
 * @deprecated Use findNamedQueriesInPath instead
 */
export async function* findQueriesInPath({
  path,
  babelOptions = getBabelConfig(),
  resolver = getResolver(),
}: {
  path: string | string[]
  babelOptions?: TransformOptions
  resolver?: NodeJS.RequireResolve
}): AsyncGenerator<ResultNamedQueries | ResultError> {
  for await (const res of findNamedQueriesInPath({path, babelOptions, resolver})) {
    yield res
  }
}

/**
 * findQueriesInPath takes a path or array of paths and returns all named GROQ queries in the files.
 * @param path - The path or array of paths to search for queries
 * @param babelOptions - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns An async generator that yields the results of the search
 * @beta
 * @internal
 */
export async function* findNamedQueriesInPath({
  path,
  babelOptions = getBabelConfig(),
  resolver = getResolver(),
}: {
  path: string | string[]
  babelOptions?: TransformOptions
  resolver?: NodeJS.RequireResolve
}): AsyncGenerator<ResultNamedQueries | ResultError> {
  // Holds all query names found in the source files
  const queryNames = new Set()

  const stream = globPath(path)
  for await (const filename of stream) {
    if (typeof filename !== 'string') {
      continue
    }

    debug(`Found file "${filename}"`)
    try {
      const source = await fs.readFile(filename, 'utf8')
      const queries = findNamedQueriesInSource(source, filename, babelOptions, resolver)
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

/**
 * findAllQueriesInPath takes a path or array of paths and returns all GROQ queries in the files.
 * @param path - The path or array of paths to search for queries
 * @param babelOptions - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns An async generator that yields the results of the search
 * @beta
 * @internal
 */
export async function* findAllQueriesInPath({
  path,
  babelOptions = getBabelConfig(),
  resolver = getResolver(),
}: {
  path: string | string[]
  babelOptions?: TransformOptions
  resolver?: NodeJS.RequireResolve
}): AsyncGenerator<ResultAllQueries | ResultError> {
  const stream = globPath(path)
  for await (const filename of stream) {
    if (typeof filename !== 'string') {
      continue
    }

    debug(`Found file "${filename}"`)
    try {
      const source = await fs.readFile(filename, 'utf8')
      const queries = findAllQueriesInSource(source, filename, babelOptions, resolver)
      yield {type: 'queries', filename, queries}
    } catch (error) {
      debug(`Error in file "${filename}"`, error)
      yield {type: 'error', error, filename}
    }
  }
}
