import {compile as compileSchema} from './schema/compile'

export default class Schema {
  static compile(schemaDef) {
    return new Schema(compileSchema(schemaDef))
  }

  constructor(compiledSchema) {
    this._compiledSchema = compiledSchema
    this._typeNames = Object.keys(compiledSchema.types)
  }

  getTypeNames() {
    return this._typeNames
  }

  getType(typeName) {
    return this._compiledSchema.types[typeName]
  }
}
