import {memoBind, assignId} from './helpers'

describe('memoBind', () => {
  it('takes in an object and a method key and binds the object to the `this` value of the method', () => {
    class IHateClasses {
      data = 'example'

      aPrototype() {
        return this.data
      }
    }

    const instance = new IHateClasses()
    const bound = memoBind(instance, 'aPrototype')

    expect(bound()).toBe('example')
  })

  it('memoizes the bindings against the method names and instances', () => {
    class IHateClasses {
      data = 'example'

      aPrototype() {
        return this.data
      }
    }

    const instanceA = new IHateClasses()
    const boundA1 = memoBind(instanceA, 'aPrototype')
    const boundA2 = memoBind(instanceA, 'aPrototype')
    expect(boundA1).toBe(boundA2)

    const instanceB = new IHateClasses()
    const boundB1 = memoBind(instanceB, 'aPrototype')
    const boundB2 = memoBind(instanceB, 'aPrototype')
    expect(boundB1).toBe(boundB2)

    expect(boundA1).not.toBe(boundB1)
    expect(boundA2).not.toBe(boundB2)
  })
})

describe('assignId', () => {
  it('takes in an object and assigns it an ID, on subsequent requests, the same ID will be returned', () => {
    const foo = {}
    const bar = {}
    const baz = {}

    const fooAlias = foo

    expect(assignId(foo)).toBe(assignId(foo))
    expect(assignId(fooAlias)).toBe(assignId(foo))
    expect(assignId(bar)).toBe(assignId(bar))
    expect(assignId(baz)).toBe(assignId(baz))
  })
})
