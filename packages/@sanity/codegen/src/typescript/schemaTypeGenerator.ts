import * as t from '@babel/types'
import {
  type ArrayTypeNode,
  type DocumentSchemaType,
  type InlineTypeNode,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type TypeDeclarationSchemaType,
  typeEvaluate,
  type TypeNode,
  type UnionTypeNode,
} from 'groq-js'

import {safeParseQuery} from '../safeParseQuery'

export interface TypeEvaluationStats {
  allTypes: number
  unknownTypes: number
  emptyUnions: number
}

interface SchemaTypeGeneratorOptions {
  schema: SchemaType
  schemaId: string
}

export class SchemaTypeGenerator {
  static ProjectionBase = t.identifier('ProjectionBase')
  static InternalReferenceSymbol = Object.assign(t.identifier('internalGroqTypeReferenceTo'), {
    typeAnnotation: t.tsTypeAnnotation(
      Object.assign(t.tsTypeOperator(t.tsSymbolKeyword()), {operator: 'unique'}),
    ),
  })

  static sanitizeIdentifier(input: string): string {
    return `${input.replace(/^\d/, '_').replace(/[^$\w]+(.)/g, (_, char) => char.toUpperCase())}`
  }

  static normalizeIdentifier(input: string): string {
    const sanitized = SchemaTypeGenerator.sanitizeIdentifier(input)
    return `${sanitized.charAt(0).toUpperCase()}${sanitized.slice(1)}`
  }

  public readonly schema: SchemaType
  public readonly schemaId: string

  private typeNames = new Set<string>()
  private tsTypes = new Map<string, t.TSType>()
  private identifiers = new Map<string, t.Identifier>()

  constructor({schema, schemaId}: SchemaTypeGeneratorOptions) {
    this.schemaId = schemaId
    this.schema = schema

    for (const type of schema) {
      if (this.typeNames.has(type.name)) {
        throw new Error(
          `Duplicate type name "${type.name}" in schema "${schemaId}". Type names must be unique within the same schema.`,
        )
      }
      this.typeNames.add(type.name)
    }

    const uniqueIdentifiers = new Set<string>()
    for (const type of schema) {
      const desiredName = SchemaTypeGenerator.normalizeIdentifier(type.name)
      let resultingName = desiredName

      let index = 2
      while (uniqueIdentifiers.has(resultingName)) {
        resultingName = `${desiredName}_${index}`
        index++
      }

      uniqueIdentifiers.add(resultingName)
      this.identifiers.set(type.name, t.identifier(resultingName))
    }

    for (const type of schema) {
      this.tsTypes.set(type.name, this.generateTsType(type))
    }
  }

  private shouldOmitProjection({rest, attributes}: ObjectTypeNode) {
    if (rest?.type === 'unknown') return true
    if (rest?.type === 'object' && this.shouldOmitProjection(rest)) return true
    return Object.values(attributes).every((attr) => attr.value.type === 'null')
  }

  private generateTsType(
    typeNode: TypeNode | TypeDeclarationSchemaType | DocumentSchemaType,
  ): t.TSType {
    switch (typeNode.type) {
      case 'string': {
        if (typeNode.value !== undefined) {
          return t.tsLiteralType(t.stringLiteral(typeNode.value))
        }
        return t.tsStringKeyword()
      }
      case 'number': {
        if (typeNode.value !== undefined) {
          return t.tsLiteralType(t.numericLiteral(typeNode.value))
        }
        return t.tsNumberKeyword()
      }
      case 'boolean': {
        if (typeNode.value !== undefined) {
          return t.tsLiteralType(t.booleanLiteral(typeNode.value))
        }
        return t.tsBooleanKeyword()
      }
      case 'unknown': {
        return t.tsUnknownKeyword()
      }
      case 'document': {
        return this.generateDocumentTsType(typeNode)
      }
      case 'type': {
        return this.generateTsType(typeNode.value)
      }
      case 'array': {
        return this.generateArrayTsType(typeNode)
      }
      case 'object': {
        return this.generateObjectTsType(typeNode)
      }
      case 'union': {
        return this.generateUnionTsType(typeNode)
      }
      case 'inline': {
        return this.generateInlineTsType(typeNode)
      }
      case 'null': {
        return t.tsNullKeyword()
      }

      default: {
        throw new Error(
          `Encountered unsupported node type "${
            // @ts-expect-error This should never happen
            typeNode.type
          }" while generating schema types for schema "${this.schemaId}"`,
        )
      }
    }
  }

  // Helper function used to generate TS types for array type nodes.
  private generateArrayTsType(typeNode: ArrayTypeNode): t.TSTypeReference {
    const typeNodes = this.generateTsType(typeNode.of)
    return t.tsTypeReference(t.identifier('Array'), t.tsTypeParameterInstantiation([typeNodes]))
  }

  // Helper function used to generate TS types for object properties.
  private generateTsObjectProperty(key: string, attribute: ObjectAttribute): t.TSPropertySignature {
    const type = this.generateTsType(attribute.value)
    const propertySignature = t.tsPropertySignature(
      t.identifier(SchemaTypeGenerator.sanitizeIdentifier(key)),
      t.tsTypeAnnotation(type),
    )
    propertySignature.optional = attribute.optional

    return propertySignature
  }

  // Helper function used to generate TS types for object type nodes.
  private generateObjectTsType(typeNode: ObjectTypeNode): t.TSType {
    const props: t.TSPropertySignature[] = []
    Object.entries(typeNode.attributes).forEach(([key, attribute]) => {
      props.push(this.generateTsObjectProperty(key, attribute))
    })
    const rest = typeNode.rest

    if (rest) {
      switch (rest.type) {
        case 'unknown': {
          return t.tsUnknownKeyword()
        }
        case 'object': {
          Object.entries(rest.attributes).forEach(([key, attribute]) => {
            props.push(this.generateTsObjectProperty(key, attribute))
          })
          break
        }
        case 'inline': {
          const resolved = this.generateInlineTsType(rest)
          // if object rest is unknown, we can't generate a type literal for it
          if (t.isTSUnknownKeyword(resolved)) return resolved
          return t.tsIntersectionType([t.tsTypeLiteral(props), resolved])
        }
        default: {
          // @ts-expect-error This should never happen
          throw new Error(`Type "${rest.type}" not found in schema`)
        }
      }
    }

    if (typeNode.dereferencesTo) {
      const derefType = Object.assign(
        t.tsPropertySignature(
          SchemaTypeGenerator.InternalReferenceSymbol,
          t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral(typeNode.dereferencesTo))),
        ),
        {computed: true, optional: true},
      )
      props.push(derefType)
    }

    return t.tsTypeLiteral(props)
  }

  private generateInlineTsType(typeNode: InlineTypeNode): t.TSType {
    const identifier = this.getIdentifier(typeNode.name)
    if (!identifier) {
      // Not found in schema, return unknown type
      return t.addComment(
        t.tsUnknownKeyword(),
        'trailing',
        ` Unable to locate the referenced type "${typeNode.name}" in schema "${this.schemaId}"`,
        true,
      )
    }

    return t.tsTypeReference(identifier)
  }

  // Helper function used to generate TS types for union type nodes.
  private generateUnionTsType(typeNode: UnionTypeNode): t.TSType {
    if (typeNode.of.length === 0) return t.tsNeverKeyword()
    if (typeNode.of.length === 1) return this.generateTsType(typeNode.of[0])
    return t.tsUnionType(typeNode.of.map((node) => this.generateTsType(node)))
  }

  // Helper function used to generate TS types for document type nodes.
  private generateDocumentTsType(document: DocumentSchemaType): t.TSType {
    const props = Object.entries(document.attributes).map(([key, node]) =>
      this.generateTsObjectProperty(key, node),
    )

    return t.tsTypeLiteral(props)
  }

  getTypeNames(): string[] {
    return Array.from(this.typeNames)
  }

  getTsType(typeName: string): t.TSType | undefined {
    return this.tsTypes.get(typeName)
  }

  getIdentifier(typeName: string): t.Identifier | undefined {
    return this.identifiers.get(typeName)
  }

  evaluateQuery(query: string): {tsType: t.TSType; stats: TypeEvaluationStats} {
    const ast = safeParseQuery(query)
    const typeNode = typeEvaluate(ast, this.schema)
    const tsType = this.generateTsType(typeNode)
    const stats = walkAndCountQueryTypeNodeStats(typeNode)
    return {tsType, stats}
  }

  evaluateProjection(projection: string): {tsType: t.TSType; stats: TypeEvaluationStats} | null {
    const results: {tsType: t.TSType; stats: TypeEvaluationStats}[] = []

    for (const schemaType of this.schema) {
      // only document types are supported for projections
      if (schemaType.type !== 'document') continue

      const projectionAst = safeParseQuery(projection)
      if (projectionAst.type !== 'Object') {
        throw new Error(
          `Invalid projection syntax: Projections must be enclosed in curly braces, (e.g., "{_id, title}"). Received: "${projection}"`,
        )
      }

      const ast = safeParseQuery(`* [_type==${JSON.stringify(schemaType.name)}] ${projection} [0]`)
      const result = typeEvaluate(ast, this.schema)

      // Skip results that aren't a union of exactly 2 types (the actual type and null)
      if (result.type !== 'union' || result.of.length !== 2) continue

      // Find the non-null member of the union (the actual type)
      const projectionResult = result.of.find((node) => node.type !== 'null')
      // Skip members that aren't objects (projections should always be objects)
      if (projectionResult?.type !== 'object') continue
      if (this.shouldOmitProjection(projectionResult)) continue

      const stats = walkAndCountQueryTypeNodeStats(projectionResult)
      const tsType = t.tsTypeReference(
        SchemaTypeGenerator.ProjectionBase,
        t.tsTypeParameterInstantiation([
          this.generateTsType(projectionResult),
          t.tsLiteralType(t.stringLiteral(schemaType.name)),
        ]),
      )

      results.push({tsType, stats})
    }

    // Return `null` if no document types match the projection.
    // Using `null` instead of `never` (empty union) explicitly signals that no
    // types matched, which is expected behavior (e.g., in multi-schema setups).
    // Stats are also omitted when returning `null`.
    if (!results.length) return null

    if (results.length === 1) return results[0]

    const combinedTsType = t.tsUnionType(results.map((i) => i.tsType))
    const accumulatedStats = results.reduce(
      (acc, {stats}) => ({
        allTypes: acc.allTypes + stats.allTypes,
        emptyUnions: acc.emptyUnions + stats.emptyUnions,
        unknownTypes: acc.unknownTypes + stats.unknownTypes,
      }),
      {allTypes: 0, unknownTypes: 0, emptyUnions: 0},
    )
    // Add 1 for the final union type since multiple results were combined
    accumulatedStats.allTypes += 1

    return {tsType: combinedTsType, stats: accumulatedStats}
  }
}

export function walkAndCountQueryTypeNodeStats(typeNode: TypeNode): TypeEvaluationStats {
  switch (typeNode.type) {
    case 'unknown': {
      return {allTypes: 1, unknownTypes: 1, emptyUnions: 0}
    }
    case 'array': {
      const acc = walkAndCountQueryTypeNodeStats(typeNode.of)
      acc.allTypes += 1 // count the array type itself
      return acc
    }
    case 'object': {
      // if the rest is unknown, we count it as one unknown type
      if (typeNode.rest && typeNode.rest.type === 'unknown') {
        return {allTypes: 2, unknownTypes: 1, emptyUnions: 0} // count the object type itself as well
      }

      const restStats = typeNode.rest
        ? walkAndCountQueryTypeNodeStats(typeNode.rest)
        : {allTypes: 0, unknownTypes: 0, emptyUnions: 0}

      // count the object type itself
      restStats.allTypes += 1

      return Object.values(typeNode.attributes).reduce((acc, attribute) => {
        const {allTypes, unknownTypes, emptyUnions} = walkAndCountQueryTypeNodeStats(
          attribute.value,
        )
        return {
          allTypes: acc.allTypes + allTypes,
          unknownTypes: acc.unknownTypes + unknownTypes,
          emptyUnions: acc.emptyUnions + emptyUnions,
        }
      }, restStats)
    }
    case 'union': {
      if (typeNode.of.length === 0) {
        return {allTypes: 1, unknownTypes: 0, emptyUnions: 1}
      }

      return typeNode.of.reduce(
        (acc, type) => {
          const {allTypes, unknownTypes, emptyUnions} = walkAndCountQueryTypeNodeStats(type)
          return {
            allTypes: acc.allTypes + allTypes,
            unknownTypes: acc.unknownTypes + unknownTypes,
            emptyUnions: acc.emptyUnions + emptyUnions,
          }
        },
        {allTypes: 1, unknownTypes: 0, emptyUnions: 0}, // count the union type itself
      )
    }
    default: {
      return {allTypes: 1, unknownTypes: 0, emptyUnions: 0}
    }
  }
}
