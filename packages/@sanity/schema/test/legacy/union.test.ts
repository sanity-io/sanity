import {isObjectSchemaType, isUnionSchemaType, type ArraySchemaType} from '@sanity/types'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {Schema} from '../../src/legacy/Schema'

const productPromotion = {
  name: 'productPromotion',
  type: 'object',
  fields: [{name: 'title', type: 'string'}],
}

const articlePromotion = {
  name: 'articlePromotion',
  type: 'object',
  fields: [{name: 'headline', type: 'string'}],
}

function readFieldsFromFirstCaller(type: any) {
  return type.fields
}

function readFieldsFromSecondCaller(type: any) {
  return type.fields
}

function readFieldsFromObjectField(type: any) {
  return type.fields[0].type.fields
}

describe('legacy schema union compiler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('compiles named object-backed unions', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        productPromotion,
        articlePromotion,
        {
          name: 'promotion',
          type: 'union',
          of: [{type: 'productPromotion'}, {type: 'articlePromotion'}],
        },
      ],
    })

    const promotion = schema.get('promotion')!

    expect(isUnionSchemaType(promotion)).toBe(true)
    expect(isObjectSchemaType(promotion)).toBe(false)
    expect(promotion).toMatchObject({
      name: 'promotion',
      jsonType: 'object',
      unionKind: 'object',
      // eslint-disable-next-line camelcase
      __experimental_union: true,
    })
    expect(promotion.of.map((member: any) => member.name)).toEqual([
      'productPromotion',
      'articlePromotion',
    ])
  })

  it('warns once per caller location when accessing fields on union types', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const schema = new Schema({
      name: 'test',
      types: [
        productPromotion,
        articlePromotion,
        {
          name: 'promotion',
          type: 'union',
          of: [{type: 'productPromotion'}, {type: 'articlePromotion'}],
        },
      ],
    })

    const promotion = schema.get('promotion')!

    expect(readFieldsFromFirstCaller(promotion)).toEqual([])
    expect(readFieldsFromFirstCaller(promotion)).toEqual([])
    expect(readFieldsFromSecondCaller(promotion)).toEqual([])

    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0][0]).toContain('Accessed `fields` on union schema type "promotion".')
    expect(warn.mock.calls[0][0]).toContain('Union types do not have stable fields.')
    expect(warn.mock.calls[0][0]).toContain('readFieldsFromFirstCaller')
    expect(warn.mock.calls[1][0]).toContain('readFieldsFromSecondCaller')
  })

  it('keeps the fields compatibility getter on fields that reference union types', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const schema = new Schema({
      name: 'test',
      types: [
        productPromotion,
        articlePromotion,
        {
          name: 'promotion',
          type: 'union',
          of: [{type: 'productPromotion'}, {type: 'articlePromotion'}],
        },
        {
          name: 'campaign',
          type: 'document',
          fields: [{name: 'featuredPromotion', type: 'promotion'}],
        },
      ],
    })

    const campaign = schema.get('campaign')!
    const fieldType = campaign.fields[0].type

    expect(isUnionSchemaType(fieldType)).toBe(true)
    expect(readFieldsFromObjectField(campaign)).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('Accessed `fields` on union schema type "promotion".')
    expect(warn.mock.calls[0][0]).toContain('readFieldsFromObjectField')
  })

  it('preserves existing user-defined schema types named union', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        {
          name: 'union',
          type: 'object',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'container',
          type: 'object',
          fields: [{name: 'legacyValue', type: 'union'}],
        },
      ],
    })

    const legacyUnion = schema.get('union')!
    const container = schema.get('container')!

    expect(isUnionSchemaType(legacyUnion)).toBe(false)
    expect(isObjectSchemaType(legacyUnion)).toBe(true)
    expect(container.fields[0].type.name).toBe('union')
    expect(container.fields[0].type.fields[0].name).toBe('title')
  })

  it('expands named unions inside array.of to concrete members', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        productPromotion,
        articlePromotion,
        {
          name: 'promotion',
          type: 'union',
          of: [{type: 'productPromotion'}, {type: 'articlePromotion'}],
        },
        {
          name: 'body',
          type: 'array',
          of: [{type: 'promotion'}],
        },
      ],
    })

    const body = schema.get('body')! as ArraySchemaType

    expect(body.of.map((member) => member.name)).toEqual(['productPromotion', 'articlePromotion'])
    expect(body.of.some(isUnionSchemaType)).toBe(false)
  })

  it('expands named unions inside union.of to concrete members', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        productPromotion,
        articlePromotion,
        {
          name: 'secondaryPromotion',
          type: 'union',
          of: [{type: 'articlePromotion'}],
        },
        {
          name: 'promotion',
          type: 'union',
          of: [{type: 'productPromotion'}, {type: 'secondaryPromotion'}],
        },
      ],
    })

    const promotion = schema.get('promotion')!

    expect(promotion.of.map((member: any) => member.name)).toEqual([
      'productPromotion',
      'articlePromotion',
    ])
    expect(promotion.of.some(isUnionSchemaType)).toBe(false)
  })

  it('expands named document unions inside reference.to to concrete targets', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        {
          name: 'book',
          type: 'document',
          fields: [{name: 'title', type: 'string'}],
        },
        {
          name: 'author',
          type: 'document',
          fields: [{name: 'name', type: 'string'}],
        },
        {
          name: 'editorialTarget',
          type: 'union',
          of: [{type: 'book'}, {type: 'author'}],
        },
        {
          name: 'featuredTarget',
          type: 'reference',
          to: [{type: 'editorialTarget'}],
        },
      ],
    })

    const reference = schema.get('featuredTarget')!

    expect(reference.to.map((member: any) => member.name)).toEqual(['book', 'author'])
    expect(reference.to.some(isUnionSchemaType)).toBe(false)
  })

  it('lets concrete array members override compatible members expanded from unions', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        productPromotion,
        articlePromotion,
        {
          name: 'promotion',
          type: 'union',
          of: [{type: 'productPromotion'}, {type: 'articlePromotion'}],
        },
        {
          name: 'body',
          type: 'array',
          of: [
            {type: 'promotion'},
            {type: 'productPromotion', title: 'Featured product promotion'},
          ],
        },
      ],
    })

    const body = schema.get('body')! as ArraySchemaType
    const product = body.of.find((member) => member.name === 'productPromotion')!

    expect(body.of.map((member) => member.name)).toEqual(['productPromotion', 'articlePromotion'])
    expect(product.title).toBe('Featured product promotion')
  })

  it('keeps incompatible direct members when they share a name with union members', () => {
    const schema = new Schema({
      name: 'test',
      types: [
        {
          name: 'promotionAsset',
          type: 'union',
          of: [{type: 'image', name: 'promo'}],
        },
        {
          name: 'body',
          type: 'array',
          of: [{type: 'promotionAsset'}, {type: 'file', name: 'promo'}],
        },
      ],
    })

    const body = schema.get('body')! as ArraySchemaType

    expect(body.of.map((member) => [member.name, member.type?.name])).toEqual([
      ['promo', 'image'],
      ['promo', 'file'],
    ])
  })
})
