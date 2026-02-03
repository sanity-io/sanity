import {expect, test} from 'vitest'

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

test('anonymous image and file subtypes inherit title', () => {
  const withSubtypes = new Schema(rawSchemas.arrays).get('withAnonymousMemberSubtypes')
  const assetsField = withSubtypes.fields.find((field: any) => field.name === 'assets')
  const [imageSubtype, fileSubtype] = assetsField.type.of
  expect(imageSubtype).toHaveProperty('title', 'Image')
  expect(fileSubtype).toHaveProperty('title', 'File')
})

test('named image and file subtypes infer title', () => {
  const withSubtypes = new Schema(rawSchemas.arrays).get('withNamedMemberSubtypes')
  const assetsField = withSubtypes.fields.find((field: any) => field.name === 'assets')
  const [imageSubtype, fileSubtype] = assetsField.type.of
  expect(imageSubtype).toHaveProperty('title', 'My Image')
  expect(fileSubtype).toHaveProperty('title', 'My File')
})

test('titled image and file subtypes use defined title', () => {
  const withSubtypes = new Schema(rawSchemas.arrays).get('withTitledMemberSubtypes')
  const assetsField = withSubtypes.fields.find((field: any) => field.name === 'assets')
  const [imageSubtype, fileSubtype] = assetsField.type.of
  expect(imageSubtype).toHaveProperty('title', 'My beautiful image')
  expect(fileSubtype).toHaveProperty('title', 'My wonderful file')
})
