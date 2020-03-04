/* eslint-disable id-length */
import bateson, {isSameType} from '../src/differs/bateson'
import defaultSummarizers from '../src/differs/defaultSummarizers'

describe('when adding field', () => {
  test('should generate add operation', () => {
    const docA = {
      _type: 'book'
    }

    const docB = {
      _type: 'book',
      author: 'J. K. Rowling'
    }

    const result = bateson(docA, docB, {summarizers: defaultSummarizers})
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      operation: 'add',
      path: [],
      to: 'J. K. Rowling'
    })
  })
})

describe('when removing field', () => {
  test('should generate remove operation', () => {
    const docA = {
      _type: 'book',
      author: 'J. R. R. Tolkien'
    }

    const docB = {
      _type: 'book'
    }

    const result = bateson(docA, docB, {summarizers: defaultSummarizers})
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      operation: 'remove',
      path: [],
      from: 'J. R. R. Tolkien'
    })
  })
})

describe('when modifying strings', () => {
  test('given string is edited, should generate editText operation', () => {
    const docA = {
      _type: 'book',
      author: 'J. R. R. Tolkien'
    }

    const docB = {
      _type: 'book',
      author: 'J. K. Rowling'
    }

    const result = bateson(docA, docB, {summarizers: defaultSummarizers})
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      operation: 'editText',
      path: ['author'],
      from: 'J. R. R. Tolkien',
      to: 'J. K. Rowling'
    })
  })
})

describe('when modifying images', () => {
  test('given image is replaced, should generate replaceImage operation', () => {
    const docA = {
      _type: 'zoo',
      profile: {
        _type: 'image',
        asset: {
          _type: 'asset',
          _ref: 'ref-123'
        }
      }
    }

    const docB = {
      _type: 'zoo',
      profile: {
        _type: 'image',
        asset: {
          _type: 'asset',
          _ref: 'ref-456'
        }
      }
    }

    const result = bateson(docA, docB, {
      summarizers: defaultSummarizers
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      operation: 'replaceImage',
      path: ['profile'],
      from: 'ref-123',
      to: 'ref-456'
    })
  })
})

describe('when diffing', () => {
  const zooA = {
    _type: 'zoo',
    keeper: {
      _type: 'keeper',
      name: 'Steve Irwin'
    }
  }

  const zooB = {
    _type: 'zoo',
    keeper: {
      _type: 'keeper',
      name: 'Bindi Irwin 😭'
    }
  }

  test('given no summarizer for object, should use default summarizers', () => {
    const result = bateson(zooA, zooB, {summarizers: defaultSummarizers})
    expect(result[0]).toEqual({
      operation: 'editText',
      path: ['keeper', 'name'],
      from: 'Steve Irwin',
      to: 'Bindi Irwin 😭'
    })
  })

  test('given summarizer for object, should use custom summarizer', () => {
    const summarizers = {
      keeper: {
        resolve: (a, b) => {
          return {
            fields: [],
            changes: [{operation: 'keeperNameChanged', from: a.name, to: b.name}]
          }
        }
      }
    }
    const result = bateson(zooA, zooB, {
      summarizers: {...Object.entries(defaultSummarizers), ...summarizers}
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      operation: 'keeperNameChanged',
      path: ['keeper'],
      from: 'Steve Irwin',
      to: 'Bindi Irwin 😭'
    })
  })
})

describe('when diffing ignored fields', () => {
  test('should not generate diff entries', () => {
    const zooA = {
      _type: 'zoo',
      _id: '123',
      _updatedAt: '2019-02-02T00:00:00.000Z',
      _createdAt: '2019-02-01T00:00:00.000Z',
      _rev: '123',
      _weak: false
    }

    const zooB = {
      _type: 'zoo',
      _id: '456',
      _updatedAt: '2019-02-04T00:00:00.000Z',
      _createdAt: '2019-02-03T00:00:00.000Z',
      _rev: '456',
      _weak: true
    }

    const result = bateson(zooA, zooB, {summarizers: defaultSummarizers})
    expect(result).toEqual([])
  })
})

describe('when checking if two objects are of same Sanity type', () => {
  test.each([
    [null, null, true],
    [null, {_type: 'zoo'}, false],
    [{_type: 'zoo'}, null, false],
    [{}, {}, true],
    [[], [], true],
    [{_type: 'zoo'}, {_type: 'zoo'}, true]
  ])('isSameType(%o, %o)', (a, b, expected) => {
    const result = isSameType(a, b)
    expect(result).toBe(expected)
  })
})

describe('when diffing a document', () => {
  test('should generate a flat array of diff summaries', () => {
    const zooA = {
      _id: '123',
      _type: 'zoo',
      keeper: {
        age: 5,
        name: 'Alfred'
      },
      name: 'El Zooas Thomaxas'
    }

    const zooB = {
      _id: 'drafts.123',
      _type: 'zoo',
      keeper: {
        age: 6,
        name: 'Alice'
      },
      name: 'El Zooas Thomaxas'
    }

    const expectedNumberChange = {operation: 'edit', path: ['keeper', 'age'], from: 5, to: 6}
    const expectedTextChange = {
      operation: 'editText',
      path: ['keeper', 'name'],
      from: 'Alfred',
      to: 'Alice'
    }

    const result = bateson(zooA, zooB, {summarizers: defaultSummarizers})
    expect(result.length).toEqual(2)
    expect(result[0]).toEqual(expectedNumberChange)
    expect(result[1]).toEqual(expectedTextChange)
  })
})

describe('when an object has been added to an array', () => {
  test('should generate an "add" operation', () => {
    const zooA = {
      _id: '123',
      _type: 'zoo',
      openingHours: []
    }

    const zooB = {
      _id: 'drafts.123',
      _type: 'zoo',
      openingHours: [
        {
          _key: '7c842c8c8f38',
          _type: 'openDayAndTime',
          day: 'Tuesday',
          opensAt: '2020-03-03T11:45:22.336Z',
          closesAt: '2020-03-03T12:00:24.349Z'
        }
      ]
    }

    const result = bateson(zooA, zooB, {summarizers: defaultSummarizers})
    expect(result.length).toEqual(1)
    expect(result[0].operation).toEqual('add')
  })
})
