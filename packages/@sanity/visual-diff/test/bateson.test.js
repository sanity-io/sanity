import bateson, {isSameType} from '../src/differs/bateson'
import defaultSummarizers from '../src/differs/defaultSummarizers'

describe('simple string operations', () => {
  test('string edit', () => {
    const docA = {
      _type: 'book',
      author: 'J. R. R. Tolkien'
    }

    const docB = {
      _type: 'book',
      author: 'J. K. Rowling'
    }

    const result = bateson(docA, docB, {summarizers: defaultSummarizers})
    expect(result[0].changes[0].op).toBe('editText')
  })

  test('string set', () => {
    const docA = {
      _type: 'book'
    }

    const docB = {
      _type: 'book',
      author: 'J. K. Rowling'
    }

    const result = bateson(docA, docB, {summarizers: defaultSummarizers})
    expect(result[0].op).toBe('set')
  })

  test('string unset', () => {
    const docA = {
      _type: 'book',
      author: 'J. R. R. Tolkien'
    }

    const docB = {
      _type: 'book'
    }

    const result = bateson(docA, docB, {summarizers: defaultSummarizers})
    expect(result[0].op).toBe('remove')
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
        resolve: (a, b, path) => {
          if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
            return [{op: 'replaceImage', from: a.asset._ref, to: b.asset._ref}]
          }
          return null
        }
      }
    }

    const result = bateson(docA, docB, {
      summarizers: {...Object.entries(defaultSummarizers), ...summarizers}
    })
    expect(result[0].changes[0].op).toBe('replaceImage')
  })
})

describe('bateson tests', () => {
  test('isSameType returns true on both null objects', () => {
    const result = isSameType(null, null)
    expect(result).toBe(true)
  })

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
          console.log('path', path)
          return [{op: 'only-zebra-stuff', from: previous, to: current}]
        },
        fields: ['zebra.face.nose']
      },
      face: {
        resolve: (previous, current, path) => {
          console.log('path', path)
          expect(path).not.toBeUndefined()
          return [{op: 'wut', from: previous, to: current}]
        },
        fields: ['face.nose']
      }
    }

    const stuff = bateson(zooA, zooB, {summarizers})
    console.log(JSON.stringify(stuff, null, 2))
  })
})


// TODO: Ignored fields test
