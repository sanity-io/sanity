const createSchema = require('part:@sanity/base/schema-creator')
const schemaTypes = require('all:part:@sanity/base/schema-type')

module.exports = createSchema({
  name: 'default',
  types: schemaTypes.concat([
    /* Your types here! */
  ])
})
