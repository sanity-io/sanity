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

export class TypeGenerator {
  private generatedTypeName: Set<string> = new Set()
  private typeNameMap: Map<string, string> = new Map()

  private readonly schema: SchemaType

  constructor(schema: SchemaType) {
    this.schema = schema
  }

  generateTypesFromSchema(): string {
    const typeDeclarations: (t.TSTypeAliasDeclaration | t.ExportNamedDeclaration)[] = []

    this.schema.forEach((schema) => {
      const typeLiteral = this.getFieldType(schema)

      const typeAlias = t.tsTypeAliasDeclaration(
        t.identifier(this.getTypeName(schema.name, true)),
        null,
        typeLiteral,
      )

      typeDeclarations.push(t.exportNamedDeclaration(typeAlias))
    })

    // Generate TypeScript code from the AST nodes
    return typeDeclarations.map((decl) => new CodeGenerator(decl).generate().code).join('\n\n')
  }

  generateTypeForField(identifierName: string, field: TypeNode): string {
    const fieldType = this.getFieldType(field)

    const typeAlias = t.tsTypeAliasDeclaration(
      t.identifier(this.getTypeName(identifierName, false)),
      null,
      fieldType,
    )

    return new CodeGenerator(t.exportNamedDeclaration(typeAlias)).generate().code
  }

  private getTypeName(name: string, shouldUppercaseFirstLetter: boolean): string {
    const desiredName = shouldUppercaseFirstLetter
      ? uppercaseFirstLetter(sanitizeIdentifier(name))
      : sanitizeIdentifier(name)

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

  private getFieldType(field: TypeNode | TypeDeclarationSchemaType | DocumentSchemaType): t.TSType {
    switch (field.type) {
      case 'string': {
        if (field.value !== undefined) {
          return t.tsLiteralType(t.stringLiteral(field.value))
        }
        return t.tsStringKeyword()
      }
      case 'number': {
        if (field.value !== undefined) {
          return t.tsLiteralType(t.numericLiteral(field.value))
        }
        return t.tsNumberKeyword()
      }
      case 'boolean': {
        if (field.value !== undefined) {
          return t.tsLiteralType(t.booleanLiteral(field.value))
        }
        return t.tsBooleanKeyword()
      }
      case 'unknown': {
        return t.tsUnknownKeyword()
      }
      case 'document': {
        return this.generateDocumentType(field)
      }
      case 'type': {
        return this.getFieldType(field.value)
      }
      case 'array': {
        return this.generateArrayTsType(field)
      }
      case 'object': {
        return this.generateObjectTsType(field)
      }
      case 'union': {
        return this.generateUnionTsType(field)
      }
      case 'inline': {
        return t.tsTypeReference(t.identifier(uppercaseFirstLetter(sanitizeIdentifier(field.name))))
      }
      case 'null': {
        return t.tsNullKeyword()
      }

      default:
        // @ts-expect-error This should never happen
        throw new Error(`Type "${field.type}" not found in schema`)
    }
  }

  // Helper function used to generate TS types for array fields.
  private generateArrayTsType(field: ArrayTypeNode): t.TSTypeReference {
    const typeNodes = this.getFieldType(field.of)
    const arrayType = t.tsTypeReference(
      t.identifier('Array'),
      t.tsTypeParameterInstantiation([typeNodes]),
    )

    return arrayType
  }

  generateObjectProperty(key: string, field: ObjectAttribute): t.TSPropertySignature {
    const fieldType = this.getFieldType(field.value)
    const propertySignature = t.tsPropertySignature(
      t.identifier(sanitizeIdentifier(key)),
      t.tsTypeAnnotation(fieldType),
    )
    propertySignature.optional = field.optional

    return propertySignature
  }

  // Helper function used to generate TS types for object fields.
  private generateObjectTsType(field: ObjectTypeNode): t.TSType {
    const parsedFields: t.TSPropertySignature[] = []
    Object.entries(field.attributes).forEach(([key, attribute]) => {
      parsedFields.push(this.generateObjectProperty(key, attribute))
    })
    if (field.rest !== undefined) {
      switch (field.rest.type) {
        case 'unknown': {
          return t.tsUnknownKeyword()
        }
        case 'object': {
          Object.entries(field.rest.attributes).forEach(([key, attribute]) => {
            parsedFields.push(this.generateObjectProperty(key, attribute))
          })
          break
        }
        case 'inline': {
          return t.tsIntersectionType([
            t.tsTypeLiteral(parsedFields),
            t.tsTypeReference(
              t.identifier(
                this.typeNameMap.get(field.rest.name) ||
                  uppercaseFirstLetter(sanitizeIdentifier(field.rest.name)),
              ),
            ),
          ])
        }
        default: {
          // @ts-expect-error This should never happen
          throw new Error(`Type "${field.rest.type}" not found in schema`)
        }
      }
    }
    return t.tsTypeLiteral(parsedFields)
  }

  // Helper function used to generate TS types for union fields.
  private generateUnionTsType(field: UnionTypeNode): t.TSType {
    if (field.of.length === 0) {
      return t.tsNeverKeyword()
    }
    if (field.of.length === 1) {
      return this.getFieldType(field.of[0])
    }

    const typeNodes = field.of.map((subfield) => {
      if (typeof subfield === 'string') {
        return t.tsLiteralType(t.stringLiteral(subfield))
      }

      return this.getFieldType(subfield)
    })

    return t.tsUnionType(typeNodes)
  }

  // Helper function used to generate TS types for document fields.
  private generateDocumentType(document: DocumentSchemaType): t.TSType {
    const contentFields = Object.entries(document.attributes).map(([key, node]) =>
      this.generateObjectProperty(key, node),
    )

    return t.tsTypeLiteral(contentFields)
  }
}
function uppercaseFirstLetter(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1)
}

function sanitizeIdentifier(input: string): string {
  return `${input.replace(/^\d/, '_').replace(/[^$\w]+(.)/g, (_, char) => char.toUpperCase())}`
}
