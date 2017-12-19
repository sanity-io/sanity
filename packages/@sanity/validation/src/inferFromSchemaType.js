const Rule = require('./Rule')

// eslint-disable-next-line complexity
function inferFromSchemaType(typeDef, isRoot = true) {
  const isInitialized =
    Array.isArray(typeDef.validation) &&
    typeDef.validation.every(item => typeof item.validate === 'function')

  if (isInitialized) {
    return typeDef
  }

  const type = typeDef.type
  const typed = Rule[typeDef.jsonType] && Rule[typeDef.jsonType]
  let base = typed ? typed() : new Rule()

  if (type && type.name === 'datetime') {
    base = base.type('Date')
  }

  if (type && type.name === 'url') {
    base = base.uri()
  }

  if (type && type.name === 'reference') {
    base = base.reference()
  }

  if (type && type.name === 'email') {
    base = base.email()
  }

  if (typeDef.options && typeDef.options.list) {
    base = base.valid(typeDef.options.list)
  }

  typeDef.validation = inferValidation(typeDef, base)

  if (typeDef.fields) {
    typeDef.fields.forEach(field => inferFromSchemaType(field.type, false))
  }

  if (typeDef.of && typeDef.jsonType === 'array') {
    typeDef.of.forEach(candidate => inferFromSchemaType(candidate, false))
  }

  return typeDef
}

function inferValidation(field, baseRule) {
  if (!field.validation) {
    return [baseRule]
  }

  const isLazy = typeof field.validation === 'function'
  const validation = isLazy ? field.validation(baseRule) : field.validation
  return Array.isArray(validation) ? validation : [validation]
}

module.exports = inferFromSchemaType
