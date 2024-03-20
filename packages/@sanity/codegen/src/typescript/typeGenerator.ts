import {CodeGenerator} from '@babel/generator'
import * as t from '@babel/types'
import {
  type ArrayTypeNode,
  type DocumentSchemaType,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type TypeDeclarationSchemaType,
  type TypeNode,
  type UnionTypeNode,
} from 'groq-js'

const REFERENCE_SYMBOL_NAME = 'internalGroqTypeReferenceTo'

/**
 * A class used to generate TypeScript types from a given schema
 * @internal
 * @beta
 */
export class TypeGenerator {
  private generatedTypeName: Set<string> = new Set()
  private typeNameMap: Map<string, string> = new Map()

  private readonly schema: SchemaType

  constructor(schema: SchemaType) {
    this.schema = schema
  }

  /**
   * Generate TypeScript types for the given schema
   * @returns string
   * @internal
   * @beta
   */
  generateSchemaTypes(): string {
    const typeDeclarations: (t.TSTypeAliasDeclaration | t.ExportNamedDeclaration)[] = []

    this.schema.forEach((schema) => {
      const typeLiteral = this.getTypeNodeType(schema)

      const typeAlias = t.tsTypeAliasDeclaration(
        t.identifier(this.getTypeName(schema.name)),
        null,
        typeLiteral,
      )

      typeDeclarations.push(t.exportNamedDeclaration(typeAlias))
    })

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

    const typeAlias = t.tsTypeAliasDeclaration(
      t.identifier(this.getTypeName(identifierName)),
      null,
      type,
    )

    return new CodeGenerator(t.exportNamedDeclaration(typeAlias)).generate().code
  }

  static generateKnownTypes(): string {
    const typeOperator = t.tsTypeOperator(t.tsSymbolKeyword())
    typeOperator.operator = 'unique'

    const identifier = t.identifier(REFERENCE_SYMBOL_NAME)
    identifier.typeAnnotation = t.tsTypeAnnotation(typeOperator)

    const decleration = t.variableDeclaration('const', [t.variableDeclarator(identifier)])
    decleration.declare = true
    return new CodeGenerator(t.exportNamedDeclaration(decleration)).generate().code
  }

  /**
   * Since we are sanitizing identifiers we migt end up with collisions. Ie there might be a type mux.video and muxVideo, both these
   * types would be sanityized into MuxVideo. To avoid this we keep track of the generated type names and add a index to the name.
   * When we reference a type we also keep track of the original name so we can reference the correct type later.
   */
  private getTypeName(name: string): string {
    const desiredName = uppercaseFirstLetter(sanitizeIdentifier(name))

    let generatedName = desiredName
    let i = 2
    while (this.generatedTypeName.has(generatedName)) {
      // add _ and a index and increment that index until we find a name that is not in the map
      generatedName = `${desiredName}_${i++}`
    }
    this.generatedTypeName.add(generatedName)
    this.typeNameMap.set(name, generatedName)
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
        return t.tsTypeReference(
          t.identifier(uppercaseFirstLetter(sanitizeIdentifier(typeNode.name))),
        )
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
    if (typeNode.rest !== undefined) {
      switch (typeNode.rest.type) {
        case 'unknown': {
          return t.tsUnknownKeyword()
        }
        case 'object': {
          Object.entries(typeNode.rest.attributes).forEach(([key, attribute]) => {
            props.push(this.generateObjectProperty(key, attribute))
          })
          break
        }
        case 'inline': {
          return t.tsIntersectionType([
            t.tsTypeLiteral(props),
            t.tsTypeReference(
              t.identifier(
                this.typeNameMap.get(typeNode.rest.name) ||
                  uppercaseFirstLetter(sanitizeIdentifier(typeNode.rest.name)),
              ),
            ),
          ])
        }
        default: {
          // @ts-expect-error This should never happen
          throw new Error(`Type "${typeNode.rest.type}" not found in schema`)
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
