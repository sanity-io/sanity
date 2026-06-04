import {isObjectSchemaType, isUnionSchemaType, type ArraySchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

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

describe('legacy schema union compiler', () => {
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
      __experimental_union: true,
    })
    expect(promotion.of.map((member: any) => member.name)).toEqual([
      'productPromotion',
      'articlePromotion',
    ])
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
