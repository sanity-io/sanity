import {startCase} from 'lodash'

import * as types from './types'
import {lazyGetter} from './types/utils'

interface ExtendHelper {
  /** Creates a new type based on the definition. */
  (memberDef: any): any

  cached(def: any): any
  cachedField(fieldDef: any): any
  cachedObjectField(fieldDef: any): any
}

function compileRegistry(schemaDef: any) {
  const registry = Object.create(null)
  let localTypeNames: string[]

  if (schemaDef.parent) {
    Object.assign(registry, schemaDef.parent._registry)
    localTypeNames = []
  } else {
    // For the root schema we inherit from the core types and also register these as the "local" ones.
    Object.assign(registry, types)
    localTypeNames = Object.keys(types)
  }

  const defsByName = schemaDef.types.reduce((acc: any, def: any) => {
    if (acc[def.name]) {
      throw new Error(`Duplicate type name added to schema: ${def.name}`)
    }
    acc[def.name] = def
    return acc
  }, {})

  const memberCache = new Map()
  const fieldCache = new Map()
  const objectFieldCache = new Map()

  const extendHelper: ExtendHelper = Object.assign(extendMember, {
    cached(def: any) {
      let member = memberCache.get(def)
      if (!member) {
        member = extendMember(def)
        memberCache.set(def, member)
      }
      return member
    },

    cachedField(fieldDef: any) {
      let field = fieldCache.get(fieldDef)
      if (!field) {
        const {name, ...type} = fieldDef
        field = {
          name,
          type: extendMember(type),
        }
        fieldCache.set(fieldDef, field)
      }
      return field
    },

    cachedObjectField(fieldDef: any) {
      let field = objectFieldCache.get(fieldDef)
      if (!field) {
        const {name, fieldset, group, ...rest} = fieldDef

        field = {
          name,
          group,
          fieldset,
        }

        lazyGetter(field, 'type', () => {
          return extendMember({
            ...rest,
            title: fieldDef.title || startCase(name),
          })
        })
        objectFieldCache.set(fieldDef, field)
      }
      return field
    },
  })

  schemaDef.types.forEach(add)

  return {
    registry,
    localTypeNames,
  }

  function ensure(typeName: any) {
    if (!registry[typeName]) {
      if (!defsByName[typeName]) {
        throw new Error(`Unknown type: ${typeName}`)
      }
      add(defsByName[typeName])
    }
  }

  function extendMember(memberDef: any) {
    ensure(memberDef.type)
    return registry[memberDef.type].extend(memberDef, extendHelper).get()
  }

  function add(typeDef: any) {
    ensure(typeDef.type)
    if (registry[typeDef.name]) {
      return
    }
    localTypeNames.push(typeDef.name)
    registry[typeDef.name] = registry[typeDef.type].extend(typeDef, extendMember)
  }
}

/**
 * @beta
 */
export class Schema {
  _original: {name: string; types: any[]; parent?: Schema}
  _registry: {[typeName: string]: any}
  #localTypeNames: string[]

  static compile(schemaDef: any): Schema {
    return new Schema(schemaDef)
  }

  constructor(schemaDef: any) {
    this._original = schemaDef

    const {registry, localTypeNames} = compileRegistry(schemaDef)
    this._registry = registry
    this.#localTypeNames = localTypeNames
  }

  get name(): string {
    return this._original.name
  }

  /**
   * Returns the parent schema.
   */
  get parent(): Schema | undefined {
    return this._original.parent
  }

  get(name: string): any {
    return this._registry[name] && this._registry[name].get()
  }

  has(name: string): boolean {
    return name in this._registry
  }

  getTypeNames(): string[] {
    return Object.keys(this._registry)
  }

  getLocalTypeNames(): string[] {
    return this.#localTypeNames
  }
}

/**
 * @deprecated Use `import {Schema} from "@sanity/schema"` instead
 */
export class DeprecatedDefaultSchema extends Schema {
  static compile(schemaDef: any): Schema {
    return new DeprecatedDefaultSchema(schemaDef)
  }

  constructor(schemaDef: any) {
    super(schemaDef)

    const stack = new Error(
      'The default export of `@sanity/schema` is deprecated. Use `import {Schema} from "@sanity/schema"` instead.',
    ).stack!.replace(/^Error/, 'Warning')

    console.warn(stack)
  }
}
