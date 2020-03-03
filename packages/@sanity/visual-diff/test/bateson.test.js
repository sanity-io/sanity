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
    expect(result).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
  })
})

describe('bateson tests', () => {
  test('image test', () => {
    const docA = {
      _type: 'zoo',
      profile: {
        _type: 'image',
        asset: {
          _type: 'asset',
          _ref: 'ref-123'
        },
        source: 'my-fancy-source'
      }
    }

    const docB = {
      _type: 'zoo',
      profile: {
        _type: 'image',
        asset: {
          _type: 'asset',
          _ref: 'ref-456'
        },
        source: 'my-fancy-source-2'
      }
    }

    const summarizers = {
      image: {
        resolve: (a, b) => {
          if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
            return [{op: 'my-custom-action', from: a.asset._ref, to: b.asset._ref}]
          }
          // TODO: Call SUMMARIZE()?
          return null
        }
      }
    }

    const result = bateson(docA, docB, {
      summarizers: {...Object.entries(defaultSummarizers), ...summarizers}
    })
    expect(result).toMatchSnapshot()
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
    expect(result).toMatchSnapshot()
  })

  test('given summarizer for object, should use custom summarizer', () => {
    const summarizers = {
      keeper: {
        resolve: (a, b) => {
          return [{op: 'keeperNameChanged', from: a.name, to: b.name}]
        }
      }
    }
    const result = bateson(zooA, zooB, {
      summarizers: {...Object.entries(defaultSummarizers), ...summarizers}
    })
    expect(result).toMatchSnapshot()
  })
})

describe('bateson tests', () => {
  test('bateson stuff', () => {
    const zooA = {
      _type: 'zoo',
      keeper: {
        _type: 'keeper',
        face: {
          _type: 'face',
          nose: 'slim'
        }
      },
      zebra: {
        _type: 'zebra',
        face: {
          _type: 'face',
          nose: 'long',
          eyes: 2
        }
      }
    }

    const zooB = {
      _type: 'zoo',
      keeper: {
        _type: 'keeper',
        face: {
          _type: 'face',
          nose: 'big'
        }
      },
      zebra: {
        _type: 'zebra',
        face: {
          _type: 'face',
          nose: 'longandbig',
          eyes: 3
        }
      }
    }

    // TODO: When zebra is defined as a summarizer, it "takes over" the processing of
    //  everything deeper in the structure. By introducing `fields` (as below), bateson can
    //  keep track of what has been processed already and not. We could also potentially
    //  make 'zebra.face.nose' take prescedence over 'face.nose' as 'zebra.face.nose'
    //  is more specific.
    const summarizers = {
      zebra: {
        resolve: (previous, current, path) => {
          return [{op: 'only-zebra-stuff', from: previous, to: current}]
        },
        fields: ['zebra.face.nose']
      },
      face: {
        resolve: (previous, current, path) => {
          return [{op: 'wut', from: previous, to: current}]
        },
        fields: ['face.nose']
      }
    }

    const result = bateson(zooA, zooB, {summarizers})
    expect(result).toMatchSnapshot()
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
  test('should generate a flat array of sumaries', () => {
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

    const expectedNumberChange = {op: 'edit', from: 5, to: 6}
    const expectedTextChange = {op: 'editText', type: 'string', from: 'Alfred', to: 'Alice'}

    const result = bateson(zooA, zooB, {summarizers: defaultSummarizers})
    expect(result.length).toEqual(2)
    expect(result[0]).toEqual(expectedNumberChange)
    expect(result[1]).toEqual(expectedTextChange)
  })
})

describe('when an object has been added to an array', () => {
  test('should generate a "set" operation', () => {
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
    expect(result[0].op).toEqual('set')
  })
})
