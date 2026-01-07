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
import {ARRAY_OF, INTERNAL_REFERENCE_SYMBOL} from './constants'
import {
  getFilterArrayUnionType,
  getUniqueIdentifierForName,
  sanitizeIdentifier,
  weakMapMemo,
} from './helpers'
import {type ExtractedQuery, type TypeEvaluationStats} from './types'

export class SchemaTypeGenerator {
  public readonly schema: SchemaType
  private tsTypes = new Map<string, t.TSType>()
  private identifiers = new Map<string, t.Identifier>()

  constructor(schema: SchemaType) {
    this.schema = schema

    const uniqueTypeNames = new Set<string>()
    for (const type of schema) {
      if (uniqueTypeNames.has(type.name)) {
        throw new Error(
          `Duplicate type name "${type.name}" in schema. Type names must be unique within the same schema.`,
        )
      }
      uniqueTypeNames.add(type.name)
    }

    for (const type of schema) {
      const currentIdentifierNames = new Set(
        Array.from(this.identifiers.values()).map((id) => id.name),
      )
      const uniqueIdentifier = getUniqueIdentifierForName(type.name, currentIdentifierNames)
      this.identifiers.set(type.name, uniqueIdentifier)
    }

    for (const type of schema) {
      this.tsTypes.set(type.name, this.generateTsType(type))
    }
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
          }" while generating schema types`,
        )
      }
    }
  }

  /**
   * Helper function used to generate TS types for arrays of inline types, or arrays of inline types
   * wrapped in the ArrayOf wrapper that adds _key prop
   */
  private generateArrayOfTsType(typeNode: ArrayTypeNode): t.TSTypeReference {
    const typeNodes = this.generateTsType(typeNode.of)
    return t.tsTypeReference(ARRAY_OF, t.tsTypeParameterInstantiation([typeNodes]))
  }

  // Helper function used to generate TS types for array type nodes.
  private generateArrayTsType(typeNode: ArrayTypeNode): t.TSTypeReference | t.TSUnionType {
    // if it's an array of a single inline type, wrap it in ArrayOf
    if (typeNode.of.type === 'inline') {
      return this.generateArrayOfTsType(typeNode)
    }

    // if it's not an inline object and not a union, wrap in Array
    if (typeNode.of.type !== 'union') {
      const typeNodes = this.generateTsType(typeNode.of)
      return t.tsTypeReference(t.identifier('Array'), t.tsTypeParameterInstantiation([typeNodes]))
    }

    // if it's not a union type or all of the union type members are non-inlines, wrap type in Array
    if (typeNode.of.of.every((unionTypeNode) => unionTypeNode.type !== 'inline')) {
      const typeNodes = this.generateTsType(typeNode.of)
      return t.tsTypeReference(t.identifier('Array'), t.tsTypeParameterInstantiation([typeNodes]))
    }

    // all the union types nodes are inline
    if (typeNode.of.of.every((unionMember) => unionMember.type === 'inline')) {
      return this.generateArrayOfTsType(typeNode)
    }

    // some of the union types are inlines, while some are not - split and recurse
    const arrayOfNonInline = getFilterArrayUnionType(typeNode, (member) => member.type !== 'inline')
    const arrayOfInline = getFilterArrayUnionType(typeNode, (member) => member.type === 'inline')

    return t.tsUnionType([
      this.generateArrayTsType(arrayOfNonInline),
      this.generateArrayTsType(arrayOfInline),
    ])
  }

  // Helper function used to generate TS types for object properties.
  private generateTsObjectProperty(key: string, attribute: ObjectAttribute): t.TSPropertySignature {
    const type = this.generateTsType(attribute.value)
    const propertySignature = t.tsPropertySignature(
      t.identifier(sanitizeIdentifier(key)),
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
          INTERNAL_REFERENCE_SYMBOL,
          t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral(typeNode.dereferencesTo))),
        ),
        {computed: true, optional: true},
      )
      props.push(derefType)
    }

    return t.tsTypeLiteral(props)
  }

  private generateInlineTsType(typeNode: InlineTypeNode): t.TSType {
    const id = this.identifiers.get(typeNode.name)
    if (!id) {
      // Not found in schema, return unknown type
      return t.addComment(
        t.tsUnknownKeyword(),
        'trailing',
        ` Unable to locate the referenced type "${typeNode.name}" in schema`,
        true,
      )
    }

    return t.tsTypeReference(id)
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

  typeNames(): string[] {
    return this.schema.map((schemaType) => schemaType.name)
  }

  getType(typeName: string): {tsType: t.TSType; id: t.Identifier} | undefined {
    const tsType = this.tsTypes.get(typeName)
    const id = this.identifiers.get(typeName)
    if (tsType && id) return {tsType, id}
    return undefined
  }

  hasType(typeName: string): boolean {
    return this.tsTypes.has(typeName)
  }

  evaluateQuery = weakMapMemo(
    ({query}: Pick<ExtractedQuery, 'query'>): {tsType: t.TSType; stats: TypeEvaluationStats} => {
      const ast = safeParseQuery(query)
      const typeNode = typeEvaluate(ast, this.schema)
      const tsType = this.generateTsType(typeNode)
      const stats = walkAndCountQueryTypeNodeStats(typeNode)
      return {tsType, stats}
    },
  );

  *[Symbol.iterator]() {
    for (const {name} of this.schema) {
      yield {name, ...this.getType(name)!}
    }
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
