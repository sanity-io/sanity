import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'

import {type TransformOptions} from '@babel/core'
import debug from 'debug'
import glob from 'fast-glob'
import {mergeMap, Observable} from 'rxjs'

import {type NamedQueryResult} from './expressionResolvers'
import {findQueriesInSource} from './findQueriesInSource'

const $debug = debug('sanity:codegen:findQueries:debug')
const $trace = debug('sanity:codegen:findQueries:trace')

const require = createRequire(__filename)

const defaultBabelOptions = {
  extends: join(__dirname, '..', '..', 'babel.config.json'),
}

type FindQueriesReturnValue = {
  filename: string
  queries: Map<string, NamedQueryResult>
  error?: Error
}

// Holds all queries found in the source files
const allQueries = new Set()

export function findQueriesInPath({
  path,
  babelOptions = defaultBabelOptions,
  resolver = require.resolve,
}: {
  path: string | string[]
  babelOptions?: TransformOptions
  resolver?: NodeJS.RequireResolve
}): Observable<FindQueriesReturnValue> {
  return new Observable<FindQueriesReturnValue>((subscriber) => {
    $debug(`Globing ${path}`)

    const stream = glob.globStream(path, {
      absolute: true,
      ignore: ['**/node_modules/**'], // we never want to look in node_modules
      onlyFiles: true,
    })
    stream.on('data', (filename: string) => {
      $trace(`Found file "${filename}"`)
      subscriber.next({filename, queries: new Map<string, NamedQueryResult>()})
    })
    stream.on('error', (err) => subscriber.error(err))
    stream.on('end', () => subscriber.complete())
  }).pipe(
    mergeMap(async ({filename}) => {
      let error

      try {
        const source = await fs.readFile(filename, 'utf8')
        const queries = findQueriesInSource(source, filename, babelOptions, resolver)
        // Check and error on duplicate query names, because we can't generate types with the same name.
        queries.forEach((_value, key) => {
          if (allQueries.has(key)) {
            error = new Error(
              `Duplicate query name found: "${key}". Query names must be unique across all files.`,
            )
          }
          allQueries.add(key)
        })

        return {
          filename,
          queries,
          error,
        }
      } catch (err) {
        return {
          filename,
          queries: new Map<string, NamedQueryResult>(),
          error: new Error(`Error reading file "${filename}": ${err.message}`, {cause: err}),
        }
      }
    }),
  )
}
