import {CodeGenerator} from '@babel/generator'
import * as t from '@babel/types'
import {
  type ArrayTypeNode,
  type DocumentSchemaType,
  type InlineTypeNode,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type TypeDeclarationSchemaType,
  type TypeNode,
  type UnionTypeNode,
} from 'groq-js'

const REFERENCE_SYMBOL_NAME = 'internalGroqTypeReferenceTo'
const ALL_SCHEMA_TYPES = 'AllSanitySchemaTypes'

type QueryWithTypeNode = {
  query: string
  typeNode: TypeNode
}

/**
 * A class used to generate TypeScript types from a given schema
 * @internal
 * @beta
 */
export class TypeGenerator {
  // Simple set to keep track of generated type names, to avoid conflicts
  private generatedTypeName: Set<string> = new Set()
  // Map between type names and their generated type names, used to resolve the correct generated type name
  private typeNameMap: Map<string, string> = new Map()
  // Map between type nodes and their generated type names, used for query mapping
  private typeNodeNameMap: Map<TypeNode | DocumentSchemaType | TypeDeclarationSchemaType, string> =
    new Map()

  private readonly schema: SchemaType

  constructor(schema: SchemaType) {
    this.schema = schema

    this.schema.forEach((s) => {
      this.getTypeName(s.name, s)
    })
  }

  /**
   * Generate TypeScript types for the given schema
   * @returns string
   * @internal
   * @beta
   */
  generateSchemaTypes(): string {
    const typeDeclarations: (t.TSTypeAliasDeclaration | t.ExportNamedDeclaration)[] = []

    const schemaNames = new Set<string>()
    this.schema.forEach((schema) => {
      const typeLiteral = this.getTypeNodeType(schema)

      const schemaName = this.typeNodeNameMap.get(schema)
      if (!schemaName) {
        throw new Error(`Schema name not found for schema ${schema.name}`)
      }

      schemaNames.add(schemaName)
      const typeAlias = t.tsTypeAliasDeclaration(t.identifier(schemaName), null, typeLiteral)

      typeDeclarations.push(t.exportNamedDeclaration(typeAlias))
    })

    typeDeclarations.push(
      t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(
          t.identifier(this.getTypeName(ALL_SCHEMA_TYPES)),
          null,
          t.tsUnionType(
            [...schemaNames].map((typeName) => t.tsTypeReference(t.identifier(typeName))),
          ),
        ),
      ),
    )

    // Generate TypeScript code from the AST nodes
    return typeDeclarations.map((decl) => new CodeGenerator(decl).generate().code).join('\n\n')
  }

  /**
   * Takes a identifier and a type node and generates a type alias for the type node.
   * @param identifierName - The name of the type to generated
   * @param typeNode - The type node to generate the type for
   * @returns
   * @internal
   * @beta
   */
  generateTypeNodeTypes(identifierName: string, typeNode: TypeNode): string {
    const type = this.getTypeNodeType(typeNode)

    const typeName = this.getTypeName(identifierName, typeNode)
    const typeAlias = t.tsTypeAliasDeclaration(t.identifier(typeName), null, type)

    return new CodeGenerator(t.exportNamedDeclaration(typeAlias)).generate().code.trim()
  }

  static generateKnownTypes(): string {
    const typeOperator = t.tsTypeOperator(t.tsSymbolKeyword())
    typeOperator.operator = 'unique'

    const identifier = t.identifier(REFERENCE_SYMBOL_NAME)
    identifier.typeAnnotation = t.tsTypeAnnotation(typeOperator)

    const decleration = t.variableDeclaration('const', [t.variableDeclarator(identifier)])
    decleration.declare = true
    return new CodeGenerator(t.exportNamedDeclaration(decleration)).generate().code.trim()
  }

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
  generateQueryMap(queries: QueryWithTypeNode[]): string {
    const typesByQuerystring: {[query: string]: string[]} = {}

    for (const query of queries) {
      const name = this.typeNodeNameMap.get(query.typeNode)
      if (!name) {
        continue
      }

      typesByQuerystring[query.query] ??= []
      typesByQuerystring[query.query].push(name)
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
              t.tsUnionType(types.map((type) => t.tsTypeReference(t.identifier(type)))),
            ),
          )
        }),
      ),
    )

    const declareModule = t.declareModule(
      t.stringLiteral('@sanity/client'),
      t.blockStatement([queryReturnInterface]),
    )

    const clientImport = t.importDeclaration([], t.stringLiteral('@sanity/client'))

    return new CodeGenerator(t.program([clientImport, declareModule])).generate().code.trim()
  }

  /**
   * Since we are sanitizing identifiers we migt end up with collisions. Ie there might be a type mux.video and muxVideo, both these
   * types would be sanityized into MuxVideo. To avoid this we keep track of the generated type names and add a index to the name.
   * When we reference a type we also keep track of the original name so we can reference the correct type later.
   */
  private getTypeName(
    name: string,
    typeNode?: TypeNode | DocumentSchemaType | TypeDeclarationSchemaType,
  ): string {
    const desiredName = uppercaseFirstLetter(sanitizeIdentifier(name))

    let generatedName = desiredName
    let i = 2
    while (this.generatedTypeName.has(generatedName)) {
      // add _ and a index and increment that index until we find a name that is not in the map
      generatedName = `${desiredName}_${i++}`
    }
    this.generatedTypeName.add(generatedName)
    this.typeNameMap.set(name, generatedName)
    if (typeNode) {
      this.typeNodeNameMap.set(typeNode, generatedName)
    }

    return generatedName
  }

  private getTypeNodeType(
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
        return this.generateDocumentType(typeNode)
      }
      case 'type': {
        return this.getTypeNodeType(typeNode.value)
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

      default:
        // @ts-expect-error This should never happen
        throw new Error(`Type "${typeNode.type}" not found in schema`)
    }
  }

  // Helper function used to generate TS types for array type nodes.
  private generateArrayTsType(typeNode: ArrayTypeNode): t.TSTypeReference {
    const typeNodes = this.getTypeNodeType(typeNode.of)
    const arrayType = t.tsTypeReference(
      t.identifier('Array'),
      t.tsTypeParameterInstantiation([typeNodes]),
    )

    return arrayType
  }

  // Helper function used to generate TS types for object properties.
  private generateObjectProperty(key: string, attribute: ObjectAttribute): t.TSPropertySignature {
    const type = this.getTypeNodeType(attribute.value)
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
      props.push(this.generateObjectProperty(key, attribute))
    })
    const rest = typeNode.rest
    if (rest !== undefined) {
      switch (rest.type) {
        case 'unknown': {
          return t.tsUnknownKeyword()
        }
        case 'object': {
          Object.entries(rest.attributes).forEach(([key, attribute]) => {
            props.push(this.generateObjectProperty(key, attribute))
          })
          break
        }
        case 'inline': {
          const resolved = this.generateInlineTsType(rest)

          // if an object's rest type is unknown, we can't generate a type literal for it
          // so we return unknown
          if (t.isTSUnknownKeyword(resolved)) {
            return resolved
          }
          return t.tsIntersectionType([t.tsTypeLiteral(props), resolved])
        }
        default: {
          // @ts-expect-error This should never happen
          throw new Error(`Type "${rest.type}" not found in schema`)
        }
      }
    }
    if (typeNode.dereferencesTo !== undefined) {
      const derefType = t.tsPropertySignature(
        t.identifier(REFERENCE_SYMBOL_NAME),
        t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral(typeNode.dereferencesTo))),
      )
      derefType.computed = true
      derefType.optional = true
      props.push(derefType)
    }
    return t.tsTypeLiteral(props)
  }

  private generateInlineTsType(typeNode: InlineTypeNode): t.TSType {
    const referencedTypeNode = this.schema.find((schema) => schema.name === typeNode.name)
    // Check if we have a schema reference for the type node
    if (referencedTypeNode === undefined) {
      // Is it already generated by another type node?
      const generatedName = this.typeNameMap.get(typeNode.name)
      if (generatedName) {
        return t.tsTypeReference(t.identifier(generatedName))
      }

      // Not found in schema, return unknown type
      const missing = t.tsUnknownKeyword()
      missing.trailingComments = [
        {
          type: 'CommentLine',
          value: ` Unable to locate the referenced type "${typeNode.name}" in schema`,
        },
      ]
      return missing
    }

    const generatedName = this.typeNameMap.get(referencedTypeNode.name)

    if (generatedName) {
      return t.tsTypeReference(t.identifier(generatedName))
    }

    return t.tsUnknownKeyword()
  }

  // Helper function used to generate TS types for union type nodes.
  private generateUnionTsType(typeNode: UnionTypeNode): t.TSType {
    if (typeNode.of.length === 0) {
      return t.tsNeverKeyword()
    }
    if (typeNode.of.length === 1) {
      return this.getTypeNodeType(typeNode.of[0])
    }

    const typeNodes = typeNode.of.map((node) => this.getTypeNodeType(node))

    return t.tsUnionType(typeNodes)
  }

  // Helper function used to generate TS types for document type nodes.
  private generateDocumentType(document: DocumentSchemaType): t.TSType {
    const props = Object.entries(document.attributes).map(([key, node]) =>
      this.generateObjectProperty(key, node),
    )

    return t.tsTypeLiteral(props)
  }
}
function uppercaseFirstLetter(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1)
}

function sanitizeIdentifier(input: string): string {
  return `${input.replace(/^\d/, '_').replace(/[^$\w]+(.)/g, (_, char) => char.toUpperCase())}`
}
