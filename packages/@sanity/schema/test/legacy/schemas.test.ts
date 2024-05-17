import {expect, test} from '@jest/globals'

import {Schema} from '../../src/legacy/Schema'
import rawSchemas from './fixtures/schemas'

function parseSchema(schemaDef: any) {
  const schema = new Schema(schemaDef)
  schema.getTypeNames().forEach((typeName) => {
    schema.get(typeName)
  })
}

Object.keys(rawSchemas).forEach((name) => {
  test(`Legacy schema ${name}`, () => {
    expect(() => parseSchema((rawSchemas as any)[name])).not.toThrow()
  })
})
