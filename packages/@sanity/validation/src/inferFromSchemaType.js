const Rule = require('./Rule')
const {slugValidator} = require('./validators/slugValidator')
const {blockValidator} = require('./validators/blockValidator')

// eslint-disable-next-line complexity
function inferFromSchemaType(typeDef, schema, visited = new Set()) {
  if (visited.has(typeDef)) {
    return typeDef
  }

  visited.add(typeDef)

  if (typeDef.validation === false) {
    typeDef.validation = []
    return typeDef
  }

  const isInitialized =
    Array.isArray(typeDef.validation) &&
    typeDef.validation.every(item => typeof item.validate === 'function')

  if (isInitialized) {
    inferForFields(typeDef, schema, visited)
    inferForMemberTypes(typeDef, schema, visited)
    return typeDef
  }

  const type = typeDef.type
  const typed = Rule[typeDef.jsonType]
  let base = typed ? typed(typeDef) : new Rule(typeDef)

  if (type && type.name === 'datetime') {
    base = base.type('Date')
  }

  if (type && type.name === 'url') {
    base = base.uri()
  }

  if (type && type.name === 'slug') {
    base = base.custom(slugValidator)
  }

  if (type && type.name === 'reference') {
    base = base.reference()
  }

  if (type && type.name === 'email') {
    base = base.email()
  }

  if (type && type.name === 'block') {
    base = base.custom(blockValidator)
  }

  if (typeDef.annotations) {
    typeDef.annotations.forEach(annotation => inferFromSchemaType(annotation))
  }

  if (typeDef.options && typeDef.options.list) {
    base = base.valid(typeDef.options.list.map(extractValueFromListOption))
  }

  typeDef.validation = inferValidation(typeDef, base)
  inferForFields(typeDef, schema, visited)
  inferForMemberTypes(typeDef, schema, visited)

  return typeDef
}

function inferForFields(typeDef, schema, visited) {
  if (!typeDef.fields) {
    return
  }

  const fieldRules = typeDef.validation
    .map(rule => rule._fieldRules)
    .filter(Boolean)
    .reduce((acc, current) => ({fields: {...acc.fields, ...current}, hasRules: true}), {
      fields: {},
      hasRules: false
    })

  typeDef.fields.forEach(field => {
    field.type.validation = fieldRules.fields[field.name] || field.type.validation
    inferFromSchemaType(field.type, schema, visited)
  })
}

function inferForMemberTypes(typeDef, schema, visited) {
  if (typeDef.of && typeDef.jsonType === 'array') {
    typeDef.of.forEach(candidate => inferFromSchemaType(candidate, schema, visited))
  }
}

function extractValueFromListOption(option) {
  return option.value || option
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
