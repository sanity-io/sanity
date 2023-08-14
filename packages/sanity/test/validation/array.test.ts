import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {Rule} from '../../src/core/validation'

const context: any = {client: {}, i18n: getFallbackLocaleSource()}

describe('array', () => {
  test('required constraint', async () => {
    const rule = Rule.array().required()
    await expect(rule.validate(null, context)).resolves.toMatchSnapshot('required: null')
    await expect(rule.validate(undefined, context)).resolves.toMatchSnapshot('required: undefined')
    await expect(rule.validate([], context)).resolves.toMatchSnapshot('required: empty array')
    await expect(rule.validate(['hei'], context)).resolves.toMatchSnapshot('required: valid')
  })

  test('min length constraint', async () => {
    const rule = Rule.array().min(2)
    await expect(rule.validate(['a'], context)).resolves.toMatchSnapshot('min length: too short')
    await expect(rule.validate(['a', 'b', 'c'], context)).resolves.toMatchSnapshot(
      'min length: valid'
    )
  })

  test('max length constraint', async () => {
    const rule = Rule.array().max(2)
    await expect(rule.validate(['a', 'b', 'c', 'd'], context)).resolves.toMatchSnapshot(
      'max length: too long'
    )
    await expect(rule.validate(['a'], context)).resolves.toMatchSnapshot('max length: valid')
  })

  test('exact length constraint', async () => {
    const rule = Rule.array().length(2)
    await expect(rule.validate(['a', 'b', 'c'], context)).resolves.toMatchSnapshot(
      'exact length: too long'
    )
    await expect(rule.validate(['a'], context)).resolves.toMatchSnapshot('exact length: too short')
    await expect(rule.validate(['a', 'b'], context)).resolves.toMatchSnapshot('exact length: valid')
  })

  test('unique constraint (default, simple values)', async () => {
    const rule = Rule.array().unique()
    await expect(rule.validate(['a', 'b', 'c', 'd'], context)).resolves.toMatchSnapshot(
      'simple unique: valid'
    )
    await expect(rule.validate(['a', 'b', 'c', 'a'], context)).resolves.toMatchSnapshot(
      'simple unique: duplicates'
    )
  })

  test('unique constraint (default, object values)', async () => {
    const rule = Rule.array().unique()
    const ref = (id: string) => ({_ref: id, _type: 'reference'})
    await expect(rule.validate(['a', 'b', 'c', 'd'].map(ref), context)).resolves.toMatchSnapshot(
      'object unique: valid'
    )
    await expect(rule.validate(['a', 'b', 'c', 'a'].map(ref), context)).resolves.toMatchSnapshot(
      'object unique: duplicates'
    )
  })

  test('unique constraint (default, array values)', async () => {
    const rule = Rule.array().unique()
    const refArr = (id: string) => [{_ref: id, _type: 'reference'}]
    await expect(rule.validate(['a', 'b', 'c', 'd'].map(refArr), context)).resolves.toMatchSnapshot(
      'array unique: valid'
    )
    await expect(rule.validate(['a', 'a', 'c', 'd'].map(refArr), context)).resolves.toMatchSnapshot(
      'array unique: duplicates'
    )
  })

  test('unique constraint (default, bool values)', async () => {
    const rule = Rule.array().unique()
    await expect(rule.validate([true, false], context)).resolves.toMatchSnapshot(
      'boolean unique: valid'
    )
    await expect(rule.validate([false, true, false], context)).resolves.toMatchSnapshot(
      'boolean unique: duplicates'
    )
  })

  test('unique constraint (default, numeric values)', async () => {
    const rule = Rule.array().unique()
    await expect(rule.validate([1, 3], context)).resolves.toMatchSnapshot('numeric unique: valid')
    await expect(rule.validate([3, 1, 3], context)).resolves.toMatchSnapshot(
      'numeric unique: duplicates'
    )
  })
})
