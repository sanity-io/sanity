import {
  type ArraySchemaType,
  type NumberSchemaType,
  type ObjectField,
  type ObjectFieldType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type Rule,
  type Schema as SchemaDef,
  type SchemaType as SanitySchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {type SchemaType} from 'groq-js'

export function isFieldRequired(field: ObjectField): boolean {
  const {validation} = field.type
  if (!validation) {
    return false
  }
  const rules = Array.isArray(validation) ? validation : [validation]
  for (const rule of rules) {
    let required = false

    // hack to check if a field is required. We create a proxy that returns itself when a method is called,
    // if the method is "required" we set a flag
    const proxy = new Proxy(
      {},
      {
        get: (target, methodName) => () => {
          if (methodName === 'required') {
            required = true
          }
          return proxy
        },
      },
    ) as Rule

    if (typeof rule === 'function') {
      rule(proxy)
      if (required) {
        return true
      }
    }

    if (typeof rule === 'object' && rule !== null && '_required' in rule) {
      if (rule._required === 'required') {
        return true
      }
    }
  }

  return false
}

function isType(
  typeDef: SanitySchemaType | ObjectField | ObjectFieldType,
  typeName: string,
): boolean {
  let type: SchemaType | ObjectField | ObjectFieldType | undefined = typeDef
  while (type) {
    if (type.name === typeName || (type.type && type.type.name === typeName)) {
      return true
    }

    type = type.type
  }
  return false
}

export function isObjectType(typeDef: SanitySchemaType): typeDef is ObjectSchemaType {
  return isType(typeDef, 'object') || typeDef.jsonType === 'object' || 'fields' in typeDef
}
export function isArrayType(typeDef: SanitySchemaType): typeDef is ArraySchemaType {
  return isType(typeDef, 'array')
}
export function isReferenceType(typeDef: SanitySchemaType): typeDef is ReferenceSchemaType {
  return isType(typeDef, 'reference')
}
// @todo
export function isCrossDatasetReferenceType(typeDef: SanitySchemaType): boolean {
  return isType(typeDef, 'crossDatasetReference')
}
export function isStringType(typeDef: SanitySchemaType): typeDef is StringSchemaType {
  return isType(typeDef, 'string')
}
export function isNumberType(typeDef: SanitySchemaType): typeDef is NumberSchemaType {
  return isType(typeDef, 'number')
}

// Traverse the type tree and return the "last" type, ie deepest type in the tree
export function lastType(typeDef: SanitySchemaType): SanitySchemaType | undefined {
  let type: SchemaType | ObjectField | ObjectFieldType | undefined = typeDef
  while (type) {
    if (!type.type) {
      return type
    }
    type = type.type
  }

  return undefined
}

// Traverse the type tree and gather all the fields
export function gatherFields(type: SanitySchemaType | ObjectSchemaType): ObjectField[] {
  if ('fields' in type) {
    return type.type ? gatherFields(type.type).concat(type.fields) : type.fields
  }

  return []
}

// Sorts the types by their dependencies by using a topological sort depth-first algorithm.
export function sortByDependencies(compiledSchema: SchemaDef): string[] {
  const seen = new Set<SanitySchemaType>()

  // Walks the dependencies of a schema type and adds them to the dependencies set
  function walkDependencies(
    schemaType: SanitySchemaType,
    dependencies: Set<SanitySchemaType>,
  ): void {
    if (seen.has(schemaType)) {
      return
    }
    seen.add(schemaType)

    if ('fields' in schemaType) {
      for (const field of gatherFields(schemaType)) {
        const last = lastType(field.type)
        if (last!.name === 'document') {
          dependencies.add(last!)
          continue
        }

        let schemaTypeName: string | undefined
        if (schemaType.type!.type) {
          schemaTypeName = field.type.type!.name
        } else if ('jsonType' in schemaType.type!) {
          schemaTypeName = field.type.jsonType
        }

        if (schemaTypeName === 'object' || schemaTypeName === 'block') {
          if (isReferenceType(field.type)) {
            field.type.to.forEach((ref) => dependencies.add(ref.type!))
          } else {
            dependencies.add(field.type)
          }
        }
        walkDependencies(field.type, dependencies)
      }
    } else if ('of' in schemaType) {
      for (const item of schemaType.of) {
        walkDependencies(item, dependencies)
      }
    }
  }
  const dependencyMap = new Map<SanitySchemaType, Set<SanitySchemaType>>()
  compiledSchema.getTypeNames().forEach((typeName) => {
    const schemaType = compiledSchema.get(typeName)
    if (schemaType === undefined || schemaType.type === null) {
      return
    }
    const dependencies = new Set<SanitySchemaType>()

    walkDependencies(schemaType, dependencies)
    dependencyMap.set(schemaType, dependencies)
    seen.clear() // Clear the seen set for the next type
  })

  // Sorts the types by their dependencies
  const typeNames: string[] = []
  // holds a temporary mark for types that are currently being visited, to detect cyclic dependencies
  const currentlyVisiting = new Set<SanitySchemaType>()

  // holds a permanent mark for types that have been already visited
  const visited = new Set<SanitySchemaType>()

  // visit implements a depth-first search
  function visit(type: SanitySchemaType) {
    if (visited.has(type)) {
      return
    }
    // If we find a type that is already in the temporary mark, we have a cyclic dependency.
    if (currentlyVisiting.has(type)) {
      return
    }
    // mark this as a temporary mark, meaning it's being visited
    currentlyVisiting.add(type)
    const deps = dependencyMap.get(type)
    if (deps !== undefined) {
      deps.forEach((dep) => visit(dep))
    }
    currentlyVisiting.delete(type)
    visited.add(type)

    if (!typeNames.includes(type.name)) {
      typeNames.unshift(type.name)
    }
  }
  // Visit all types in the dependency map
  for (const [type] of dependencyMap) {
    visit(type)
  }

  return typeNames
}
