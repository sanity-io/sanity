import {ExprNode} from 'groq-js'
import {SchemaType} from 'groq-js'
import {TransformOptions} from '@babel/core'
import {TypeNode} from 'groq-js'
import * as z from 'zod'

/**
 * @deprecated use TypeGenConfig
 */
export declare type CodegenConfig = TypeGenConfig

/**
 * @internal
 */
export declare const configDefinition: z.ZodObject<
  {
    path: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>>
    schema: z.ZodDefault<z.ZodString>
    generates: z.ZodDefault<z.ZodString>
    formatGeneratedCode: z.ZodDefault<z.ZodBoolean>
    overloadClientMethods: z.ZodDefault<z.ZodBoolean>
  },
  'strip',
  z.ZodTypeAny,
  {
    path: string | string[]
    schema: string
    generates: string
    formatGeneratedCode: boolean
    overloadClientMethods: boolean
  },
  {
    path?: string | string[] | undefined
    schema?: string | undefined
    generates?: string | undefined
    formatGeneratedCode?: boolean | undefined
    overloadClientMethods?: boolean | undefined
  }
>

/**
 * findQueriesInPath takes a path or array of paths and returns all GROQ queries in the files.
 * @param path - The path or array of paths to search for queries
 * @param babelOptions - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns An async generator that yields the results of the search
 * @beta
 * @internal
 */
export declare function findQueriesInPath({
  path,
  babelOptions,
  resolver,
}: {
  path: string | string[]
  babelOptions?: TransformOptions
  resolver?: NodeJS.RequireResolve
}): AsyncGenerator<ResultQueries | ResultError>

/**
 * findQueriesInSource takes a source string and returns all GROQ queries in it.
 * @param source - The source code to search for queries
 * @param filename - The filename of the source code
 * @param babelConfig - The babel configuration to use when parsing the source
 * @param resolver - A resolver function to use when resolving module imports
 * @returns
 * @beta
 * @internal
 */
export declare function findQueriesInSource(
  source: string,
  filename: string,
  babelConfig?: TransformOptions,
  resolver?: NodeJS.RequireResolve,
): NamedQueryResult[]

/**
 * This is a custom implementation of require.resolve that takes into account the paths
 * configuration in tsconfig.json. This is necessary if we want to resolve paths that are
 * custom defined in the tsconfig.json file.
 * Resolving here is best effort and might not work in all cases.
 * @beta
 */
export declare function getResolver(cwd?: string): NodeJS.RequireResolve

/**
 * NamedQueryResult is a result of a named query
 */
declare interface NamedQueryResult {
  /** name is the name of the query */
  name: string
  /** result is a groq query */
  result: resolveExpressionReturnType
  /** location is the location of the query in the source */
  location: {
    start?: {
      line: number
      column: number
      index: number
    }
    end?: {
      line: number
      column: number
      index: number
    }
  }
}

declare type QueryWithTypeNode = {
  query: string
  typeNode: TypeNode
}

/**
 * Read, parse and process a config file
 * @internal
 */
export declare function readConfig(path: string): Promise<CodegenConfig>

/**
 * Read a schema from a given path
 * @param path - The path to the schema
 * @returns The schema
 * @internal
 * @beta
 **/
export declare function readSchema(path: string): Promise<SchemaType>

/**
 * Register Babel with the given options
 *
 * @param babelOptions - The options to use when registering Babel
 * @beta
 */
export declare function registerBabel(babelOptions?: TransformOptions): void

declare type resolveExpressionReturnType = string

declare type ResultError = {
  type: 'error'
  error: Error
  filename: string
}

declare type ResultQueries = {
  type: 'queries'
  filename: string
  queries: NamedQueryResult[]
}

/**
 * safeParseQuery parses a GROQ query string, but first attempts to extract any parameters used in slices. This method is _only_
 * intended for use in type generation where we don't actually execute the parsed AST on a dataset, and should not be used elsewhere.
 * @internal
 */
export declare function safeParseQuery(query: string): ExprNode

export declare type TypeGenConfig = z.infer<typeof configDefinition>

/**
 * A class used to generate TypeScript types from a given schema
 * @internal
 * @beta
 */
export declare class TypeGenerator {
  private generatedTypeName
  private typeNameMap
  private typeNodeNameMap
  private readonly schema
  constructor(schema: SchemaType)
  /**
   * Generate TypeScript types for the given schema
   * @returns string
   * @internal
   * @beta
   */
  generateSchemaTypes(): string
  /**
   * Takes a identifier and a type node and generates a type alias for the type node.
   * @param identifierName - The name of the type to generated
   * @param typeNode - The type node to generate the type for
   * @returns
   * @internal
   * @beta
   */
  generateTypeNodeTypes(identifierName: string, typeNode: TypeNode): string
  static generateKnownTypes(): string
  /**
   * Takes a list of queries from the codebase and generates a type declaration
   * for SanityClient to consume.
   *
   * Note: only types that have previously been generated with `generateTypeNodeTypes`
   * will be included in the query map.
   *
   * @param queries - A list of queries to generate a type declaration for
   * @returns
   * @internal
   * @beta
   */
  generateQueryMap(queries: QueryWithTypeNode[]): string
  /**
   * Since we are sanitizing identifiers we migt end up with collisions. Ie there might be a type mux.video and muxVideo, both these
   * types would be sanityized into MuxVideo. To avoid this we keep track of the generated type names and add a index to the name.
   * When we reference a type we also keep track of the original name so we can reference the correct type later.
   */
  private getTypeName
  private getTypeNodeType
  private generateArrayTsType
  private generateObjectProperty
  private generateObjectTsType
  private generateInlineTsType
  private generateUnionTsType
  private generateDocumentType
}

export {}
