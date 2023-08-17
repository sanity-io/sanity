import {flatten, uniq} from 'lodash'
import {getDupes} from '../sanity/validation/utils/getDupes'

type SchemaType = Record<string, any>
type SchemaTypeDef = Record<string, any>

type VisitContext = {
  isRoot: boolean
  isReserved: (typeName: string) => boolean
  visit: Visitor
  index: number
  isDuplicate: (typeName: string) => boolean
  getType: (typeName: string) => null | SchemaType
  getTypeNames: () => Array<string>
}

export type Visitor = (typeDef: SchemaTypeDef, arg1: VisitContext) => SchemaType

const NOOP_VISITOR: Visitor = (typeDef) => typeDef

export class UnknownType {
  name: string

  constructor(name: string) {
    this.name = name
  }
}

const TYPE_TYPE = {name: 'type', type: null}

const FUTURE_RESERVED = ['any', 'time', 'date']

export function traverseSchema(
  types: SchemaTypeDef[] = [],
  coreTypes: SchemaTypeDef[] = [],
  visitor: Visitor = NOOP_VISITOR,
) {
  const coreTypesRegistry = Object.create(null)
  const registry = Object.create(null)

  const coreTypeNames = coreTypes.map((typeDef) => typeDef.name)

  const reservedTypeNames = FUTURE_RESERVED.concat(coreTypeNames)

  const typeNames = types.map((typeDef) => typeDef && typeDef.name).filter(Boolean)

  coreTypes.forEach((coreType) => {
    coreTypesRegistry[coreType.name] = coreType
  })

  types.forEach((type, i) => {
    // Allocate a placeholder for each type
    registry[(type && type.name) || `__unnamed_${i}`] = {}
  })

  function getType(typeName) {
    return typeName === 'type'
      ? TYPE_TYPE
      : coreTypesRegistry[typeName] || registry[typeName] || null
  }

  const duplicateNames = uniq(flatten(getDupes(typeNames)))

  function isDuplicate(typeName) {
    return duplicateNames.includes(typeName)
  }
  function getTypeNames() {
    return typeNames.concat(coreTypeNames)
  }
  function isReserved(typeName) {
    return typeName === 'type' || reservedTypeNames.includes(typeName)
  }

  const visitType = (isRoot) => (typeDef, index) => {
    return visitor(typeDef, {
      visit: visitType(false),
      isRoot,
      getType,
      getTypeNames,
      isReserved,
      isDuplicate,
      index,
    })
  }

  coreTypes.forEach((coreTypeDef) => {
    Object.assign(coreTypesRegistry[coreTypeDef.name], visitType(coreTypeDef))
  })

  types.forEach((typeDef, i) => {
    Object.assign(
      registry[(typeDef && typeDef.name) || `__unnamed_${i}`],
      visitType(true)(typeDef, i),
    )
  })

  return {
    get(typeName: string) {
      const res = registry[typeName] || coreTypesRegistry[typeName]
      if (res) {
        return res
      }
      throw new Error(`No such type: ${typeName}`)
    },
    has(typeName: string): boolean {
      return typeName in registry || typeName in coreTypesRegistry
    },
    getTypeNames(): string[] {
      return Object.keys(registry)
    },
    getTypes() {
      return this.getTypeNames().map(this.get)
    },
    toJSON() {
      return this.getTypes()
    },
  }
}
