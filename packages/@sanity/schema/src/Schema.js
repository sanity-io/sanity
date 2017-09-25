import generateHelpUrl from '@sanity/generate-help-url'
import * as types from './types'

let hasWarned = false

function compileRegistry(schemaDef) {
  const registry = Object.assign(Object.create(null), types)

  const defsByName = schemaDef.types.reduce((acc, def) => {
    if (acc[def.name]) {
      throw new Error(`Duplicate type name added to schema: ${def.name}`)
    }
    acc[def.name] = def
    return acc
  }, {})

  schemaDef.types.forEach(add)

  return registry

  function ensure(typeName) {
    if (!registry[typeName]) {
      if (!defsByName[typeName]) {
        throw new Error(`Unknown type: ${typeName}`)
      }
      add(defsByName[typeName])
    }

  }
  function extendMember(memberDef) {
    if (memberDef.type === 'date') {
      if (!hasWarned) {
        // eslint-disable-next-line no-console
        console.warn(
          'Heads up! The `date` type has been renamed to `richDate`. Please update your schema. See %s for more info.',
          generateHelpUrl('migrate-to-rich-date')
        )
        hasWarned = true
      }
    }
    ensure(memberDef.type)
    return registry[memberDef.type].extend(memberDef, extendMember).get()
  }
  function add(typeDef) {
    ensure(typeDef.type)
    if (registry[typeDef.name]) {
      return
    }
    registry[typeDef.name] = registry[typeDef.type].extend(typeDef, extendMember)
  }
}

export default class Schema {
  static compile(schemaDef) {
    return new Schema(schemaDef)
  }
  constructor(schemaDef) {
    this._original = schemaDef
    this._registry = compileRegistry(schemaDef)
  }
  get name() {
    return this._original.name
  }
  get(name) {
    return this._registry[name] && this._registry[name].get()
  }
  has(name) {
    return name in this._registry
  }
  getTypeNames() {
    return Object.keys(this._registry)
  }
}
