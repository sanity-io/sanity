import process from 'node:process'

import * as t from '@babel/types'
import {type WorkerChannel, type WorkerChannelReporter} from '@sanity/worker-channels'
import {type SchemaType} from 'groq-js'
import {createSelector} from 'reselect'

import {
  ALL_SANITY_SCHEMA_TYPES,
  DEFAULT_SCHEMA,
  INTERNAL_REFERENCE_SYMBOL,
  SANITY_QUERIES,
  SANITY_SCHEMAS,
} from './constants'
import {computeOnce, generateCode, getUniqueIdentifierForName, normalizePath} from './helpers'
import {SchemaTypeGenerator} from './schemaTypeGenerator'
import {
  type EvaluatedModule,
  type EvaluatedQuery,
  type ExtractedModule,
  QueryEvaluationError,
  type QueryExtractionError,
} from './types'

export type TypegenWorkerChannel = WorkerChannel.Definition<{
  generatedSchemaTypes: WorkerChannel.Event<{
    internalReferenceSymbol: {
      id: t.Identifier
      code: string
      ast: t.ExportNamedDeclaration
    }
    schemaTypeDeclarations: {
      id: t.Identifier
      name: string
      code: string
      tsType: t.TSType
      ast: t.ExportNamedDeclaration
    }[]
    allSanitySchemaTypesDeclaration: {
      code: string
      id: t.Identifier
      ast: t.ExportNamedDeclaration
    }
    schemaDeclarations: {
      schemaId: string
      code: string
      id: t.Identifier
      ast: t.ExportNamedDeclaration
    }[]
    sanitySchemasDeclaration: {
      code: string
      ast: t.Program
    }
  }>
  evaluatedModules: WorkerChannel.Stream<EvaluatedModule>
  generatedQueryTypes: WorkerChannel.Event<{
    queryMapDeclaration: {code: string; ast: t.Program}
  }>
}>

export interface GenerateTypesOptions {
  schema: SchemaType
  schemaPath?: string
  queries?: AsyncIterable<ExtractedModule>
  root?: string
  overloadClientMethods?: boolean
  augmentGroqModule?: boolean
  reporter?: WorkerChannelReporter<TypegenWorkerChannel>
}

type GetEvaluatedModulesOptions = GenerateTypesOptions & {
  schemaTypeDeclarations: ReturnType<TypeGenerator['getSchemaTypeDeclarations']>
  schemaTypeGenerator: SchemaTypeGenerator
}
type GetQueryMapDeclarationOptions = GenerateTypesOptions & {
  evaluatedModules: EvaluatedModule[]
}

/**
 * A class used to generate TypeScript types from a given schema
 * @beta
 */
export class TypeGenerator {
  private getInternalReferenceSymbolDeclaration = computeOnce(() => {
    const typeOperator = t.tsTypeOperator(t.tsSymbolKeyword(), 'unique')

    const id = INTERNAL_REFERENCE_SYMBOL
    id.typeAnnotation = t.tsTypeAnnotation(typeOperator)

    const declaration = t.variableDeclaration('const', [t.variableDeclarator(id)])
    declaration.declare = true
    const ast = t.exportNamedDeclaration(declaration)
    const code = generateCode(ast)

    return {id, code, ast}
  })

  private getSchemaTypeGenerator = createSelector(
    [(options: GenerateTypesOptions) => options.schema],
    (schema) => new SchemaTypeGenerator(schema),
  )

  private getSchemaTypeDeclarations = createSelector([this.getSchemaTypeGenerator], (schema) =>
    Array.from(schema).map(({id, name, tsType}) => {
      const typeAlias = t.tsTypeAliasDeclaration(id, null, tsType)
      const ast = t.exportNamedDeclaration(typeAlias)

      const code = generateCode(ast)
      return {id, code, name, tsType, ast}
    }),
  )

  private getAllSanitySchemaTypesDeclaration = createSelector(
    [this.getSchemaTypeDeclarations],
    (schemaTypes) => {
      const tsType = schemaTypes.length
        ? t.tsUnionType(schemaTypes.map(({id}) => t.tsTypeReference(id)))
        : t.tsNeverKeyword()
      const ast = t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(ALL_SANITY_SCHEMA_TYPES, null, tsType),
      )
      const code = generateCode(ast)
      return {id: ALL_SANITY_SCHEMA_TYPES, code, ast, tsType}
    },
  )

  private getDefaultSchemaDeclaration = createSelector(
    [
      (options: GenerateTypesOptions) => options.root,
      (options: GenerateTypesOptions) => options.schemaPath,
      this.getAllSanitySchemaTypesDeclaration,
    ],
    (root = process.cwd(), schemaPath, {tsType}) => {
      let ast
      ast = t.exportNamedDeclaration(t.tsTypeAliasDeclaration(DEFAULT_SCHEMA, null, tsType))

      if (schemaPath) {
        ast = t.addComments(ast, 'leading', [
          {type: 'CommentLine', value: ` Source: ${normalizePath(root, schemaPath)}`},
        ])
      }

      return {id: DEFAULT_SCHEMA, code: generateCode(ast), ast, tsType}
    },
  )

  private getSanitySchemasDeclaration = createSelector(
    [
      (options: GenerateTypesOptions) => options.augmentGroqModule,
      this.getDefaultSchemaDeclaration,
    ],
    (augmentGroqModule = true, defaultSchemaDeclaration) => {
      if (!augmentGroqModule) return {code: '', ast: t.program([])}

      const sanitySchemasInterface = t.tsInterfaceDeclaration(
        SANITY_SCHEMAS,
        null,
        [],
        t.tsInterfaceBody([
          t.tsPropertySignature(
            t.stringLiteral('default'),
            t.tsTypeAnnotation(t.tsTypeReference(defaultSchemaDeclaration.id)),
          ),
        ]),
      )

      let declareModule
      declareModule = t.declareModule(
        t.stringLiteral('groq'),
        t.blockStatement([sanitySchemasInterface]),
      )
      declareModule = t.addComments(declareModule, 'leading', [
        {type: 'CommentLine', value: ' Schema TypeMap'},
      ])
      const ast = t.program([declareModule])

      return {code: generateCode(ast), ast}
    },
  )

  private static async getEvaluatedModules({
    root = process.cwd(),
    reporter: report,
    schemaTypeGenerator,
    schemaTypeDeclarations,
    queries: extractedModules,
  }: GetEvaluatedModulesOptions) {
    if (!extractedModules) {
      report?.stream.evaluatedModules.end()
      return []
    }

    const currentIdentifiers = new Set<string>(schemaTypeDeclarations.map(({id}) => id.name))
    const evaluatedModuleResults: EvaluatedModule[] = []

    for await (const {filename, ...extractedModule} of extractedModules) {
      const queries: EvaluatedQuery[] = []
      const errors: (QueryExtractionError | QueryEvaluationError)[] = [...extractedModule.errors]

      for (const extractedQuery of extractedModule.queries) {
        const {variable} = extractedQuery
        try {
          const {tsType, stats} = schemaTypeGenerator.evaluateQuery(extractedQuery)
          const id = getUniqueIdentifierForName(`${variable.id.name}Result`, currentIdentifiers)
          const typeAlias = t.tsTypeAliasDeclaration(id, null, tsType)
          const trimmedQuery = extractedQuery.query.replace(/(\r\n|\n|\r)/gm, '').trim()
          const ast = t.addComments(t.exportNamedDeclaration(typeAlias), 'leading', [
            {type: 'CommentLine', value: ` Source: ${normalizePath(root, filename)}`},
            {type: 'CommentLine', value: ` Variable: ${variable.id.name}`},
            {type: 'CommentLine', value: ` Query: ${trimmedQuery}`},
          ])

          const evaluatedQueryResult: EvaluatedQuery = {
            id,
            code: generateCode(ast),
            ast,
            stats,
            tsType,
            ...extractedQuery,
          }

          currentIdentifiers.add(id.name)
          queries.push(evaluatedQueryResult)
        } catch (cause) {
          errors.push(new QueryEvaluationError({variable, cause, filename}))
        }
      }

      const evaluatedModule: EvaluatedModule = {
        filename,
        queries,
        errors,
      }
      report?.stream.evaluatedModules.emit(evaluatedModule)
      evaluatedModuleResults.push(evaluatedModule)
    }
    report?.stream.evaluatedModules.end()

    return evaluatedModuleResults
  }

  private static async getQueryMapDeclaration({
    overloadClientMethods = true,
    augmentGroqModule = true,
    evaluatedModules,
  }: GetQueryMapDeclarationOptions) {
    if (!overloadClientMethods && !augmentGroqModule) return {code: '', ast: t.program([])}

    const queries = evaluatedModules.flatMap((module) => module.queries)
    if (!queries.length) return {code: '', ast: t.program([])}

    const typesByQuerystring: {[query: string]: string[]} = {}
    for (const {id, query} of queries) {
      typesByQuerystring[query] ??= []
      typesByQuerystring[query].push(id.name)
    }

    const sanityQueriesInterface = t.tsInterfaceDeclaration(
      SANITY_QUERIES,
      null,
      [],
      t.tsInterfaceBody(
        Object.entries(typesByQuerystring).map(([query, types]) => {
          return t.tsPropertySignature(
            t.stringLiteral(query),
            t.tsTypeAnnotation(
              types.length
                ? t.tsUnionType(types.map((type) => t.tsTypeReference(t.identifier(type))))
                : t.tsNeverKeyword(),
            ),
          )
        }),
      ),
    )

    const program = t.program([])

    if (overloadClientMethods) {
      program.body.push(
        t.declareModule(
          t.stringLiteral('@sanity/client'),
          t.blockStatement([sanityQueriesInterface]),
        ),
      )
    }

    if (augmentGroqModule) {
      program.body.push(
        t.declareModule(t.stringLiteral('groq'), t.blockStatement([sanityQueriesInterface])),
      )
    }

    program.body[0] = t.addComments(program.body[0], 'leading', [
      {type: 'CommentLine', value: ' Query TypeMap'},
    ])

    const code = generateCode(program)
    return {code, ast: program}
  }

  async generateTypes(options: GenerateTypesOptions) {
    const {reporter: report} = options
    const internalReferenceSymbol = this.getInternalReferenceSymbolDeclaration()
    const schemaTypeDeclarations = this.getSchemaTypeDeclarations(options)
    const allSanitySchemaTypesDeclaration = this.getAllSanitySchemaTypesDeclaration(options)
    const defaultSchemaDeclaration = this.getDefaultSchemaDeclaration(options)
    const sanitySchemasDeclaration = this.getSanitySchemasDeclaration(options)

    report?.event.generatedSchemaTypes({
      internalReferenceSymbol,
      schemaTypeDeclarations,
      allSanitySchemaTypesDeclaration,
      schemaDeclarations: [{...defaultSchemaDeclaration, schemaId: 'default'}],
      sanitySchemasDeclaration,
    })

    const program = t.program([])
    let code = ''

    for (const declaration of schemaTypeDeclarations) {
      program.body.push(declaration.ast)
      code += declaration.code
    }

    program.body.push(allSanitySchemaTypesDeclaration.ast)
    code += allSanitySchemaTypesDeclaration.code

    program.body.push(defaultSchemaDeclaration.ast)
    code += defaultSchemaDeclaration.code

    program.body.push(...sanitySchemasDeclaration.ast.body)
    code += sanitySchemasDeclaration.code

    program.body.push(internalReferenceSymbol.ast)
    code += internalReferenceSymbol.code

    const evaluatedModules = await TypeGenerator.getEvaluatedModules({
      ...options,
      schemaTypeDeclarations,
      schemaTypeGenerator: this.getSchemaTypeGenerator(options),
    })
    for (const {queries} of evaluatedModules) {
      for (const query of queries) {
        program.body.push(query.ast)
        code += query.code
      }
    }

    const queryMapDeclaration = await TypeGenerator.getQueryMapDeclaration({
      ...options,
      evaluatedModules,
    })
    program.body.push(...queryMapDeclaration.ast.body)
    code += queryMapDeclaration.code

    report?.event.generatedQueryTypes({queryMapDeclaration})

    return {code, ast: program}
  }
}
