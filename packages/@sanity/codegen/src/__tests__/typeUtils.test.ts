import {describe, expectTypeOf, it} from 'vitest'

import {type FilterByType, type Get} from '../typeUtils'

// Test types that mimic generated Sanity types
type Tag = {
  _key: string
  _type: 'tag'
  label?: string
}

type Category = {
  _key: string
  _type: 'category'
  name?: string
  priority?: number
}

type Section = {
  _key: string
  _type: 'section'
  title?: string
  nestedProp?: {
    somethingInHere?: Array<string> | null
  } | null
}

type Post = {
  _id: string
  _type: 'post'
  sections?: Array<Section> | null
  tags?: Array<Tag | Category> | null
  tuple?: [string, number, {nested: boolean}] | null
  indexed?: {
    0: string
    1: number
    named: boolean
  } | null
}

describe('FilterByType', () => {
  it('filters union type by _type discriminator', () => {
    expectTypeOf<FilterByType<Tag | Category, 'tag'>>().toEqualTypeOf<Tag>()
    expectTypeOf<FilterByType<Tag | Category, 'category'>>().toEqualTypeOf<Category>()
  })

  it('works with array element unions', () => {
    type TagOrCategory = NonNullable<Post['tags']>[number]
    expectTypeOf<FilterByType<TagOrCategory, 'tag'>>().toEqualTypeOf<Tag>()
  })

  it('returns never for non-matching type', () => {
    // @ts-expect-error - 'invalid' is not a valid _type
    type Invalid = FilterByType<Tag | Category, 'invalid'>
  })
})

describe('Get', () => {
  it('accesses single-level properties preserving their type', () => {
    expectTypeOf<Get<Post, '_id'>>().toEqualTypeOf<string>()
  })

  it('accesses nested properties preserving null/undefined', () => {
    // Section.title is optional (string | undefined)
    expectTypeOf<Get<Post, 'sections', number, 'title'>>().toEqualTypeOf<string | undefined>()
  })

  it('accesses deeply nested properties preserving null unions', () => {
    // nestedProp.somethingInHere is Array<string> | null | undefined
    expectTypeOf<Get<Post, 'sections', number, 'nestedProp', 'somethingInHere'>>().toEqualTypeOf<
      Array<string> | null | undefined
    >()
  })

  it('accesses tuple elements with number keys', () => {
    expectTypeOf<Get<Post, 'tuple', 0>>().toEqualTypeOf<string>()
    expectTypeOf<Get<Post, 'tuple', 1>>().toEqualTypeOf<number>()
    expectTypeOf<Get<Post, 'tuple', 2>>().toEqualTypeOf<{nested: boolean}>()
  })

  it('accesses all tuple elements with number type', () => {
    expectTypeOf<Get<Post, 'tuple', number>>().toEqualTypeOf<string | number | {nested: boolean}>()
  })

  it('accesses nested properties within tuple elements', () => {
    expectTypeOf<Get<Post, 'tuple', 2, 'nested'>>().toEqualTypeOf<boolean>()
  })

  it('accesses objects with numeric keys', () => {
    expectTypeOf<Get<Post, 'indexed', 0>>().toEqualTypeOf<string>()
    expectTypeOf<Get<Post, 'indexed', 1>>().toEqualTypeOf<number>()
    expectTypeOf<Get<Post, 'indexed', 'named'>>().toEqualTypeOf<boolean>()
  })

  it('preserves null union at top level', () => {
    // sections is Array<Section> | null | undefined
    expectTypeOf<Get<Post, 'sections'>>().toEqualTypeOf<Array<Section> | null | undefined>()
  })
})
