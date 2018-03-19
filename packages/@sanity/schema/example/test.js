import assert from 'assert'
import Schema from '../src/Schema'
import schemaDef from './schema-def'

const schema = new Schema(schemaDef)

const person = schema.get('person')
assert.equal(person.type, schema.get('object'))
assert.equal(person.title, 'Person')

const FIRSTNAME = 0
const ADDRESS = 1
const CUSTOMER = 3
// console.log(person)
assert.equal(person.fields[FIRSTNAME].name, 'firstName')
// console.log(person.fields[FIRSTNAME].type)
assert.equal(person.fields[FIRSTNAME].type.type.name, 'string')
assert.equal(person.fields[FIRSTNAME].type.title, 'First name')
// address
assert.equal(person.fields[ADDRESS].name, 'address')
assert.equal(person.fields[ADDRESS].type.name, 'address')
assert.equal(person.fields[ADDRESS].type.title, 'Address of person')

// console.log(person.fields[1].type.of[0])
// assert.equal(person.fields[1].type.of[0].type.name, 'relation')
// assert.equal(person.fields[1].type.type.name, 'array')
// assert.equal(person.fields[2].type.type.name, 'image')
// assert.equal(person.fields[3].type.type.name, 'object')

assert.equal(person.fields[CUSTOMER].type.type.name, 'reference')
assert.equal(person.fields[CUSTOMER].type.to[0].name, 'customer')

// const ANY_SOMETHING = 4
// assert.equal(person.fields[ANY_SOMETHING].type.fields[0].type.name, '<member>')
// assert.equal(person.fields[ANY_SOMETHING].type.fields[0].type.name, '<member>')
// assert.equal(person.fields[ANY_SOMETHING].type.fields[0].type.type.name, 'string')

// const relation = schema.get('relation')
//
// console.log(relation)
// // assert.equal(relation.getJSONType(), 'object')
// // assert(relation.isTypeOf('object'))
// assert.equal(relation.type.name, 'object')
// assert.equal(relation.type.type.type, null)
// assert.equal(relation.fields[1].name, 'related')
// assert.equal(relation.fields[1].type.name, '<member>')
// assert.deepEqual(relation.fields[1].type.options.preview.fields, ['bar'])
// assert.deepEqual(relation.fields[1].type.type.options.preview.fields, ['foo'])
// assert.equal(relation.fields[1].type.type.name, 'person')
// assert.equal(relation.fields[1].type.type.type.name, 'object')
//
const customer = schema.get('customer')
const string = schema.get('string')
assert.equal(customer.type.name, 'object')
assert.equal(customer.name, 'customer')
assert.equal(customer.fields[0].name, 'customerId')
assert.equal(customer.fields[0].type.title, 'Customer ID')
assert.equal(customer.fields[0].type.type, string)
assert.equal(customer.fields[0].type.type.name, 'string')

const object = schema.get('object')
assert.equal(schema.get('customer').type.name, 'object')
assert.equal(customer.fields[0].type.name, 'string')

assert.equal(object.jsonType, 'object')
assert.equal(customer.jsonType, 'object')
assert.equal(schema.get('person').fields[0].type.jsonType, 'string')
// debugger
