import fs from 'node:fs/promises'
import nodePath from 'node:path'

import createDebug from 'debug'
import {type Program} from 'estree'
import glob from 'globby'

import {findQueriesInSource} from './findQueriesInSource'
import {getResolver} from './moduleResolver'
import {parseComments} from './parseComments'
import {type ExtractedModule, QueryExtractionError} from './types'

const debug = createDebug('sanity:codegen:findQueries:debug')

interface FindQueriesInPathOptions {
  path: string | string[]
  resolver?: NodeJS.RequireResolve
}

interface ModuleCache {
  [filename: string]: Program
}

/**
 * findQueriesInPath takes a path or array of paths and returns all GROQ queries in the files.
 * @param pathPattern - The path or array of paths to search for queries
 * @param resolver - A resolver function to use when resolving module imports
 * @returns An async generator that yields the results of the search
 * @beta
 * @internal
 */
export function findQueriesInPath({
  path: pathPattern,
  resolver = getResolver(),
}: FindQueriesInPathOptions): {files: string[]; queries: AsyncIterable<ExtractedModule>} {
  const moduleCache: ModuleCache = {}

  // Holds all query names found in the source files
  debug(`Globing ${pathPattern}`)

  const files = glob
    .sync(pathPattern, {
      absolute: false,
      ignore: ['**/node_modules/**'], // we never want to look in node_modules
      onlyFiles: true,
    })
    .sort()

  async function parseModule(filename: string): Promise<Program> {
    const {transformWithEsbuild, parseAst} = await import('vite')
    const absolutePath = nodePath.resolve(filename)

    // Return cached module if already loaded
    if (moduleCache[absolutePath]) {
      debug(`Using cached module for "${filename}"`)
      return moduleCache[absolutePath]
    }

    debug(`Parsing module "${filename}"`)

    // Load and transform the file
    const source = await fs.readFile(filename, 'utf8')
    const comments = parseComments(source)
    const {code, map} = await transformWithEsbuild(source, filename, {})

    // Parse with espree to get ESTree AST
    const program = parseAst(code, {allowReturnOutsideFunction: true})

    console.log(map)
    console.log(comments)

    // Cache the parsed module
    moduleCache[absolutePath] = program

    return program
  }

  async function loadModule(moduleId: string): Promise<Program> {
    return parseModule(moduleId)
  }

  async function resolveModule(source: string, importer: string): Promise<string> {
    try {
      const importPath =
        source.startsWith('./') || source.startsWith('../')
          ? nodePath.resolve(nodePath.dirname(importer), source)
          : source
      return resolver(importPath)
    } catch (error) {
      debug(`Failed to resolve "${source}" from "${importer}": ${error}`)
      throw new Error(`Could not resolve module "${source}" from "${importer}"`)
    }
  }

  async function* getQueries(): AsyncGenerator<ExtractedModule> {
    for (const filename of files) {
      debug(`Found file "${filename}"`)
      try {
        const program = await parseModule(filename)
        const result = await findQueriesInSource({
          program,
          comments: [],
          filename,
          context: {
            load: loadModule,
            resolve: resolveModule,
          },
        })

        yield result
      } catch (cause) {
        yield {
          filename,
          queries: [],
          documentProjections: [],
          errors: [new QueryExtractionError({cause, filename})],
        }
      }
    }
  }

  return {files, queries: getQueries()}
}
