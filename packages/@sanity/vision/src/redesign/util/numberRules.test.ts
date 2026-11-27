import {defineField, defineType, createSchema} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getNumberRules} from './numberRules'
import {inferQueryParams} from './paramInference'
import {getGroqSchema} from './typegen/evaluateQueryType'

const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'percentage',
      type: 'number',
      validation: (rule) => rule.min(0).max(100),
    }),
    defineType({
      name: 'stats',
      type: 'object',
      fields: [
        defineField({name: 'score', type: 'number', validation: (rule) => rule.precision(2)}),
      ],
    }),
    defineType({
      name: 'species',
      type: 'document',
      fields: [
        defineField({
          name: 'population',
          type: 'number',
          validation: (rule) => rule.required().integer().positive().max(5000),
        }),
        defineField({name: 'weight', type: 'number', validation: (rule) => rule.positive()}),
        defineField({name: 'share', type: 'percentage'}),
        defineField({name: 'stats', type: 'stats'}),
        defineField({name: 'height', type: 'number'}),
        defineField({
          name: 'span',
          type: 'number',
          validation: (rule) => rule.min(rule.valueOfField('height')),
        }),
        defineField({name: 'name', type: 'string', validation: (rule) => rule.max(10)}),
        defineField({
          name: 'depth',
          type: 'number',
          validation: (rule) => rule.positive().min(5).max(50).max(20).precision(3).precision(1),
        }),
        defineField({
          name: 'passRate',
          type: 'percentage',
          validation: (rule) => rule.min(10),
        }),
      ],
    }),
    defineType({
      name: 'habitat',
      type: 'document',
      fields: [
        defineField({
          name: 'population',
          type: 'number',
          validation: (rule) => rule.integer().min(10).max(100000),
        }),
        defineField({name: 'weight', type: 'number', validation: (rule) => rule.precision(1)}),
        defineField({name: 'height', type: 'number', validation: (rule) => rule.min(1)}),
      ],
    }),
  ],
})

describe('getNumberRules', () => {
  it('reads the bounds of a number field from its validation', () => {
    expect(getNumberRules(schema, 'species', ['population'])).toEqual({
      integer: true,
      min: 0,
      max: 5000,
    })
    expect(getNumberRules(schema, 'species', ['weight'])).toEqual({min: 0})
  })

  it('reads the rules of the number type a field has, and of nested fields', () => {
    expect(getNumberRules(schema, 'species', ['share'])).toEqual({min: 0, max: 100})
    expect(getNumberRules(schema, 'species', ['stats', 'score'])).toEqual({precision: 2})
  })

  it('takes the strictest of several bounds, since validation checks them all', () => {
    expect(getNumberRules(schema, 'species', ['depth'])).toEqual({min: 5, max: 20, precision: 1})
    // The field's own min(10) and the min(0) of the type it extends both apply
    expect(getNumberRules(schema, 'species', ['passRate'])).toEqual({min: 10, max: 100})
  })

  it('has no rules for number fields without bounds, and nothing for other fields', () => {
    expect(getNumberRules(schema, 'species', ['height'])).toEqual({})
    // A bound that refers to another field bounds nothing
    expect(getNumberRules(schema, 'species', ['span'])).toEqual({})
    expect(getNumberRules(schema, 'species', ['name'])).toBeUndefined()
    expect(getNumberRules(schema, 'species', ['missing'])).toBeUndefined()
    expect(getNumberRules(schema, 'missing', ['population'])).toBeUndefined()
  })
})

describe('inferQueryParams with number rules', () => {
  const options = {
    schema: getGroqSchema(schema),
    numberRules: (documentType: string, path: string[]) =>
      getNumberRules(schema, documentType, path),
  }
  const typeOf = (query: string, name: string) =>
    inferQueryParams(query, options).params.find((param) => param.name === name)?.type

  it('gives a param compared with a field the field’s bounds', () => {
    expect(typeOf('*[_type == "species" && population >= $population]', 'population')).toEqual({
      kind: 'integer',
      array: false,
      min: 0,
      max: 5000,
    })
    expect(typeOf('*[_type == "species" && $weight < weight]', 'weight')).toEqual({
      kind: 'number',
      array: false,
      min: 0,
    })
    expect(typeOf('*[_type == "species" && stats.score > $score]', 'score')).toEqual({
      kind: 'number',
      array: false,
      step: 0.01,
    })
  })

  it('gives both ends of a range the field’s bounds', () => {
    const population = {kind: 'integer', array: false, min: 0, max: 5000}
    const inference = inferQueryParams(
      '*[_type == "species" && population in $low...$high]',
      options,
    )
    expect(inference.params.map(({name, type}) => [name, type])).toEqual([
      ['low', population],
      ['high', population],
    ])
  })

  it('takes the loosest bounds of every document type the query can match', () => {
    // Integers from 0 (species) or from 10 (habitat): the query takes integers from 0 to 100000
    const population = {kind: 'integer', array: false, min: 0, max: 100000}
    expect(typeOf('*[population >= $p]', 'p')).toEqual(population)
    expect(typeOf('*[_type in ["species", "habitat"] && population >= $p]', 'p')).toEqual(
      population,
    )
    // Only species bounds weight below, and only habitat rounds it
    expect(typeOf('*[weight > $w]', 'w')).toEqual({kind: 'number', array: false})
    // A type with the field but no rules leaves the param unbounded
    expect(typeOf('*[height > $h]', 'h')).toEqual({kind: 'number', array: false})
    // A type that has no such number field matches nothing, and bounds nothing
    expect(typeOf('*[_type in ["habitat", "percentage"] && population >= $p]', 'p')).toEqual({
      kind: 'integer',
      array: false,
      min: 10,
      max: 100000,
    })
  })

  it('does not give a param used in arithmetic the field’s bounds', () => {
    expect(typeOf('*[_type == "species" && population * $scale > 1]', 'scale')).toEqual({
      kind: 'number',
      array: false,
    })
    expect(typeOf('*[_type == "species" && weight + $extra == 1]', 'extra')).toEqual({
      kind: 'number',
      array: false,
    })
  })

  it('leaves params of other kinds and fields without rules as they were', () => {
    expect(typeOf('*[_type == "species" && height > $height]', 'height')).toEqual({
      kind: 'number',
      array: false,
    })
    expect(typeOf('*[_type == "species" && name == $name]', 'name')).toEqual({
      kind: 'string',
      array: false,
    })
  })
})
