import {describe, expect, it} from 'vitest'

import {groupProblems} from '../../src/sanity/groupProblems'
import {validateSchema} from '../../src/sanity/validateSchema'

function problemsFor(types: any[]) {
  return groupProblems(validateSchema(types).getTypes())
}

function flatProblems(types: any[]) {
  return problemsFor(types).flatMap((group) => group.problems)
}

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

describe('union schema validation', () => {
  it('allows valid named object-backed unions', () => {
    const problems = flatProblems([
      productPromotion,
      articlePromotion,
      {
        name: 'promotion',
        type: 'union',
        of: [{type: 'productPromotion'}, {type: 'articlePromotion'}],
      },
    ])

    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('warns when a root type is named union but keeps it valid', () => {
    const problems = flatProblems([
      {
        name: 'union',
        type: 'object',
        fields: [{name: 'title', type: 'string'}],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        helpId: 'schema-type-name-union-conflict',
      }),
    )
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('allows fields to reference a user-defined type named union', () => {
    const problems = flatProblems([
      {
        name: 'union',
        type: 'object',
        fields: [{name: 'title', type: 'string'}],
      },
      {
        name: 'campaign',
        type: 'object',
        fields: [{name: 'legacyValue', type: 'union'}],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        helpId: 'schema-type-name-union-conflict',
      }),
    )
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('rejects primitive union members for the first version', () => {
    const problems = flatProblems([
      {
        name: 'promotion',
        type: 'union',
        of: [{type: 'string'}],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-invalid',
        message: expect.stringContaining('Primitive union members are not supported'),
      }),
    )
  })

  it('rejects missing or invalid union.of declarations', () => {
    const problems = flatProblems([
      {
        name: 'missingPromotion',
        type: 'union',
      },
      {
        name: 'invalidPromotion',
        type: 'union',
        of: {type: 'productPromotion'},
      },
    ])

    const invalidUnionProblems = problems.filter(
      (problem) => problem.severity === 'error' && problem.helpId === 'schema-union-of-invalid',
    )

    expect(invalidUnionProblems).toHaveLength(2)
    expect(invalidUnionProblems.every((problem) => problem.message.includes('"of"'))).toBe(true)
  })

  it('allows named union members to merge into another union', () => {
    const problems = flatProblems([
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
    ])

    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('rejects arrays and inline unions in union.of', () => {
    const problems = flatProblems([
      {
        name: 'promotion',
        type: 'union',
        of: [
          {type: 'array', of: [{type: 'string'}]},
          {type: 'union', of: [{type: 'object', name: 'productPromotion', fields: []}]},
        ],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-invalid',
        message: expect.stringContaining('array'),
      }),
    )
    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-invalid',
        message: expect.stringContaining('inline union'),
      }),
    )
  })

  it('requires anonymous object members to have names', () => {
    const problems = flatProblems([
      {
        name: 'promotion',
        type: 'union',
        of: [{type: 'object', fields: [{name: 'title', type: 'string'}]}],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-invalid',
        message: expect.stringContaining('must have a name'),
      }),
    )
  })

  it('rejects duplicate stored member names', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'promotion',
        type: 'union',
        of: [{type: 'productPromotion'}, {type: 'object', name: 'productPromotion', fields: []}],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-not-unique',
      }),
    )
  })

  it('warns when an array concrete member overrides a compatible union member', () => {
    const problems = flatProblems([
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
        of: [{type: 'promotion'}, {type: 'productPromotion', title: 'Featured product promotion'}],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        helpId: 'schema-array-of-union-member-override',
      }),
    )
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('collapses compatible members expanded from multiple named unions', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'featuredPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'heroPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'body',
        type: 'array',
        of: [{type: 'featuredPromotion'}, {type: 'heroPromotion'}],
      },
    ])

    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
    expect(problems).not.toContainEqual(
      expect.objectContaining({
        helpId: 'schema-array-of-invalid',
      }),
    )
  })

  it('lets one direct member override compatible members from multiple unions', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'featuredPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'heroPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'body',
        type: 'array',
        of: [
          {type: 'featuredPromotion'},
          {type: 'heroPromotion'},
          {type: 'productPromotion', title: 'Featured product promotion'},
        ],
      },
    ])

    const overrideWarnings = problems.filter(
      (problem) => problem.helpId === 'schema-array-of-union-member-override',
    )

    expect(overrideWarnings).toHaveLength(1)
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('warns once when earlier direct members override multiple later union members', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'featuredPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'heroPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'body',
        type: 'array',
        of: [
          {type: 'productPromotion', title: 'Featured product promotion'},
          {type: 'featuredPromotion'},
          {type: 'heroPromotion'},
        ],
      },
    ])

    const overrideWarnings = problems.filter(
      (problem) => problem.helpId === 'schema-array-of-union-member-override',
    )

    expect(overrideWarnings).toHaveLength(1)
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('warns once when compatible union members appear around a direct member', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'featuredPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'heroPromotion',
        type: 'union',
        of: [{type: 'productPromotion'}],
      },
      {
        name: 'body',
        type: 'array',
        of: [
          {type: 'featuredPromotion'},
          {type: 'productPromotion', title: 'Featured product promotion'},
          {type: 'heroPromotion'},
        ],
      },
    ])

    const overrideWarnings = problems.filter(
      (problem) => problem.helpId === 'schema-array-of-union-member-override',
    )

    expect(overrideWarnings).toHaveLength(1)
    expect(problems.filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('does not warn when same-name array members have incompatible concrete lineage', () => {
    const problems = flatProblems([
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
    ])

    expect(problems).not.toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        helpId: 'schema-array-of-union-member-override',
      }),
    )
  })

  it('rejects inline union declarations in fields', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'campaign',
        type: 'object',
        fields: [
          {
            name: 'promotion',
            type: 'union',
            of: [{type: 'productPromotion'}],
          },
        ],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-invalid',
        message: expect.stringContaining('Inline union declarations are not supported'),
      }),
    )
    expect(problems.some((problem) => problem.message.includes('Unknown type: union'))).toBe(false)
  })

  it('does not expand inline union declarations in arrays', () => {
    const problems = flatProblems([
      productPromotion,
      {
        name: 'body',
        type: 'array',
        of: [
          {type: 'union', of: [{type: 'productPromotion', name: 'promo'}]},
          {type: 'productPromotion', name: 'promo'},
        ],
      },
    ])

    expect(problems).toContainEqual(
      expect.objectContaining({
        severity: 'error',
        helpId: 'schema-union-of-invalid',
        message: expect.stringContaining('Inline union declarations are not supported'),
      }),
    )
    expect(problems.some((problem) => problem.message.includes('Unknown type: union'))).toBe(false)
    expect(problems).not.toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        helpId: 'schema-array-of-union-member-override',
      }),
    )
  })

  it('does not warn when same-name array members have different custom object lineages', () => {
    const problems = flatProblems([
      productPromotion,
      articlePromotion,
      {
        name: 'promotion',
        type: 'union',
        of: [{type: 'productPromotion', name: 'promo'}],
      },
      {
        name: 'body',
        type: 'array',
        of: [{type: 'promotion'}, {type: 'articlePromotion', name: 'promo'}],
      },
    ])

    expect(problems).not.toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        helpId: 'schema-array-of-union-member-override',
      }),
    )
  })
})
