const diffPatch = require('../src/diff-patch')
const dataTypes = require('./fixtures/data-types')
const typeChange = require('./fixtures/type-change')

describe('diff data types', () => {
  test('same data type', () => {
    expect(diffPatch(dataTypes.a, dataTypes.b)).toEqual([
      {
        patch: {
          id: dataTypes.a._id,
          set: {
            title: 'Die Hard with a Vengeance',
            rating: 4.24,
            isFeatured: false,
            'characters[0]': 'Simon Gruber',
            'slug.current': 'die-hard-with-a-vengeance',
            year: 1995
          }
        }
      }
    ])
  })

  test('different data type', () => {
    expect(diffPatch(dataTypes.a, dataTypes.c)).toEqual([
      {
        patch: {
          id: dataTypes.a._id,
          set: {
            characters: {simon: 'Simon Gruber'},
            isFeatured: 'yup',
            rating: {current: 4.24},
            slug: 'die-hard-with-a-vengeance',
            title: ['Die Hard with a Vengeance'],
            year: {released: 1995}
          }
        }
      }
    ])
  })

  test('different data type (object => array)', () => {
    expect(diffPatch(dataTypes.a, dataTypes.d)).toEqual([
      {
        patch: {
          id: dataTypes.a._id,
          set: {slug: ['die-hard-with-a-vengeance']}
        }
      }
    ])
  })

  test('type changes', () => {
    expect(diffPatch(typeChange.a, typeChange.b)).toEqual([
      {
        patch: {
          id: 'abc123',
          set: {
            'array[0]': 0,
            'array[1]': 'one',
            'array[2].two.levels.other': 'value',
            bool: false,
            number: 1337,
            'object["12"]': '12',
            'object["13"]': null,
            string: 'bar'
          }
        }
      },
      {patch: {id: 'abc123', unset: ['unset', 'array[2].two.levels.deep']}}
    ])
  })
})
