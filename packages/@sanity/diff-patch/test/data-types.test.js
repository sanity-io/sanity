const diffPatch = require('../src/diff-patch')
const dataTypes = require('./fixtures/data-types')

describe('diff data types', () => {
  test('same data type', () => {
    expect(diffPatch(dataTypes.a, dataTypes.b)).toEqual({
      set: {
        title: 'Die Hard with a Vengeance',
        rating: 4.24,
        isFeatured: false,
        'characters[0]': 'Simon Gruber',
        'slug.current': 'die-hard-with-a-vengeance',
        year: 1995
      }
    })
  })

  test('different data type', () => {
    expect(diffPatch(dataTypes.a, dataTypes.c)).toEqual({
      set: {
        characters: {simon: 'Simon Gruber'},
        isFeatured: 'yup',
        rating: {current: 4.24},
        slug: 'die-hard-with-a-vengeance',
        title: ['Die Hard with a Vengeance'],
        year: {released: 1995}
      }
    })
  })
})
