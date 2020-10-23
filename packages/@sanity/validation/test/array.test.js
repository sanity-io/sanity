const {Rule} = require('../src')

describe('array', () => {
  test('required constraint', async () => {
    const rule = Rule.array().required()
    await expect(rule.validate(null)).resolves.toMatchSnapshot('required: null')
    await expect(rule.validate(undefined)).resolves.toMatchSnapshot('required: undefined')
    await expect(rule.validate([])).resolves.toMatchSnapshot('required: empty array')
    await expect(rule.validate(['hei'])).resolves.toMatchSnapshot('required: valid')
  })

  test('min length constraint', async () => {
    const rule = Rule.array().min(2)
    await expect(rule.validate(['a'])).resolves.toMatchSnapshot('min length: too short')
    await expect(rule.validate(['a', 'b', 'c'])).resolves.toMatchSnapshot('min length: valid')
  })

  test('max length constraint', async () => {
    const rule = Rule.array().max(2)
    await expect(rule.validate(['a', 'b', 'c', 'd'])).resolves.toMatchSnapshot(
      'max length: too long'
    )
    await expect(rule.validate(['a'])).resolves.toMatchSnapshot('max length: valid')
  })

  test('exact length constraint', async () => {
    const rule = Rule.array().length(2)
    await expect(rule.validate(['a', 'b', 'c'])).resolves.toMatchSnapshot('exact length: too long')
    await expect(rule.validate(['a'])).resolves.toMatchSnapshot('exact length: too short')
    await expect(rule.validate(['a', 'b'])).resolves.toMatchSnapshot('exact length: valid')
  })

  test('unique constraint (default, simple values)', async () => {
    const rule = Rule.array().unique()
    await expect(rule.validate(['a', 'b', 'c', 'd'])).resolves.toMatchSnapshot(
      'simple unique: valid'
    )
    await expect(rule.validate(['a', 'b', 'c', 'a'])).resolves.toMatchSnapshot(
      'simple unique: duplicates'
    )
  })

  test('unique constraint (default, object values)', async () => {
    const rule = Rule.array().unique()
    const ref = (id) => ({_ref: id, _type: 'reference'})
    await expect(rule.validate(['a', 'b', 'c', 'd'].map(ref))).resolves.toMatchSnapshot(
      'object unique: valid'
    )
    await expect(rule.validate(['a', 'b', 'c', 'a'].map(ref))).resolves.toMatchSnapshot(
      'object unique: duplicates'
    )
  })

  test('unique constraint (default, array values)', async () => {
    const rule = Rule.array().unique()
    const refArr = (id) => [{_ref: id, _type: 'reference'}]
    await expect(rule.validate(['a', 'b', 'c', 'd'].map(refArr))).resolves.toMatchSnapshot(
      'array unique: valid'
    )
    await expect(rule.validate(['a', 'a', 'c', 'd'].map(refArr))).resolves.toMatchSnapshot(
      'array unique: duplicates'
    )
  })

  test('unique constraint (default, bool values)', async () => {
    const rule = Rule.array().unique()
    await expect(rule.validate([true, false])).resolves.toMatchSnapshot('boolean unique: valid')
    await expect(rule.validate([false, true, false])).resolves.toMatchSnapshot(
      'boolean unique: duplicates'
    )
  })

  test('unique constraint (default, numeric values)', async () => {
    const rule = Rule.array().unique()
    await expect(rule.validate([1, 3])).resolves.toMatchSnapshot('numeric unique: valid')
    await expect(rule.validate([3, 1, 3])).resolves.toMatchSnapshot('numeric unique: duplicates')
  })
})
