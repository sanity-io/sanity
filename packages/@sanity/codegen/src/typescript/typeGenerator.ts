import process from 'node:process'

import * as t from '@babel/types'
import {type WorkerChannel, type WorkerChannelReporter} from '@sanity/worker-channels'
import {type SchemaType} from 'groq-js'
import {createSelector} from 'reselect'

import {ALL_SANITY_SCHEMA_TYPES, INTERNAL_REFERENCE_SYMBOL} from './constants'
import {computeOnce, generateCode, getUniqueIdentifierForName, normalizePath} from './helpers'
import {SchemaTypeGenerator} from './schemaTypeGenerator'
import {type EvaluatedModule, type EvaluatedQuery, type ExtractedModule} from './types'

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
  }>
  evaluatedModules: WorkerChannel.Stream<EvaluatedModule>
  generatedQueryTypes: WorkerChannel.Event<{
    queryMapDeclaration: {code: string; ast: t.Program}
  }>
}>

export interface GenerateTypesOptions {
  schema: SchemaType
  schemaPath?: string
  queries: AsyncIterable<ExtractedModule>
  root?: string
  overloadClientMethods?: boolean
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

  private getSchemaTypeDeclarations = createSelector(
    [
      (options: GenerateTypesOptions) => options.root,
      (options: GenerateTypesOptions) => options.schemaPath,
      this.getSchemaTypeGenerator,
    ],
    (root = process.cwd(), schemaPath, schema) =>
      Array.from(schema).map(({id, name, tsType}, index) => {
        const typeAlias = t.tsTypeAliasDeclaration(id, null, tsType)
        let ast = t.exportNamedDeclaration(typeAlias)

        if (index === 0 && schemaPath) {
          ast = t.addComments(ast, 'leading', [
            {type: 'CommentLine', value: ` Source: ${normalizePath(root, schemaPath)}`},
          ])
        }
        const code = generateCode(ast)
        return {id, code, name, tsType, ast}
      }),
  )

  private getAllSanitySchemaTypesDeclaration = createSelector(
    [this.getSchemaTypeDeclarations],
    (schemaTypes) => {
      const ast = t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(
          ALL_SANITY_SCHEMA_TYPES,
          null,
          schemaTypes.length
            ? t.tsUnionType(schemaTypes.map(({id}) => t.tsTypeReference(id)))
            : t.tsNeverKeyword(),
        ),
      )
      const code = generateCode(ast)

      return {id: ALL_SANITY_SCHEMA_TYPES, code, ast}
    },
  )

  private static async getEvaluatedModules({
    root = process.cwd(),
    reporter: report,
    schemaTypeGenerator,
    schemaTypeDeclarations,
    queries: extractedModules,
  }: GetEvaluatedModulesOptions) {
    const currentIdentifiers = new Set<string>(schemaTypeDeclarations.map(({id}) => id.name))
    const evaluatedModuleResults: EvaluatedModule[] = []

    for await (const {filename, ...extractedModule} of extractedModules) {
      const results: EvaluatedQuery[] = []
      const errors: unknown[] = [...extractedModule.errors]

      for (const extractedQuery of extractedModule.queries) {
        try {
          const {tsType, stats} = schemaTypeGenerator.evaluateQuery(extractedQuery)
          const id = getUniqueIdentifierForName(
            `${extractedQuery.variable.id.name}Result`,
            currentIdentifiers,
          )
          const typeAlias = t.tsTypeAliasDeclaration(id, null, tsType)
          const trimmedQuery = extractedQuery.query.replace(/(\r\n|\n|\r)/gm, '').trim()
          const ast = t.addComments(t.exportNamedDeclaration(typeAlias), 'leading', [
            {type: 'CommentLine', value: ` Source: ${normalizePath(root, filename)}`},
            {type: 'CommentLine', value: ` Variable: ${extractedQuery.variable.id.name}`},
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
          results.push(evaluatedQueryResult)
        } catch (error) {
          errors.push(error)
        }
      }

      const evaluatedModule: EvaluatedModule = {
        filename,
        results,
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
    evaluatedModules,
  }: GetQueryMapDeclarationOptions) {
    if (!overloadClientMethods) return {code: '', ast: t.program([])}
    const typesByQuerystring: {[query: string]: string[]} = {}

    for (const {id, query} of evaluatedModules.flatMap((module) => module.results)) {
      typesByQuerystring[query] ??= []
      typesByQuerystring[query].push(id.name)
    }

    const queryReturnInterface = t.tsInterfaceDeclaration(
      t.identifier('SanityQueries'),
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

    const declareModule = t.declareModule(
      t.stringLiteral('@sanity/client'),
      t.blockStatement([queryReturnInterface]),
    )

    const clientImport = t.addComments(
      t.importDeclaration([], t.stringLiteral('@sanity/client')),
      'leading',
      [{type: 'CommentLine', value: ' Query TypeMap'}],
    )

    const ast = t.program([clientImport, declareModule])
    const code = generateCode(ast)
    return {code, ast}
  }

  async generateTypes(options: GenerateTypesOptions) {
    const {reporter: report} = options
    const internalReferenceSymbol = this.getInternalReferenceSymbolDeclaration()
    const schemaTypeDeclarations = this.getSchemaTypeDeclarations(options)
    const allSanitySchemaTypesDeclaration = this.getAllSanitySchemaTypesDeclaration(options)

    report?.event.generatedSchemaTypes({
      internalReferenceSymbol,
      schemaTypeDeclarations,
      allSanitySchemaTypesDeclaration,
    })

    const program = t.program([])
    let code = ''

    for (const declaration of schemaTypeDeclarations) {
      program.body.push(declaration.ast)
      code += declaration.code
    }

    program.body.push(allSanitySchemaTypesDeclaration.ast)
    code += allSanitySchemaTypesDeclaration.code

    program.body.push(internalReferenceSymbol.ast)
    code += internalReferenceSymbol.code

    const evaluatedModules = await TypeGenerator.getEvaluatedModules({
      ...options,
      schemaTypeDeclarations,
      schemaTypeGenerator: this.getSchemaTypeGenerator(options),
    })
    for (const {results} of evaluatedModules) {
      for (const result of results) {
        program.body.push(result.ast)
        code += result.code
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
