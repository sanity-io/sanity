import {memoBind} from '../memoBind'

describe('memoBind', () => {
  it('takes in an object and a method key and binds the object to the `this` value of the method', () => {
    class ExampleClass {
      data = 'example'

      aPrototype() {
        return this.data
      }
    }

    const instance = new ExampleClass()
    const bound = memoBind(instance, 'aPrototype')

    expect(bound()).toBe('example')
  })

  it('memoizes the bindings against the method names and instances', () => {
    class ExampleClass {
      data = 'example'

      aPrototype() {
        return this.data
      }
    }

    const instanceA = new ExampleClass()
    const boundA1 = memoBind(instanceA, 'aPrototype')
    const boundA2 = memoBind(instanceA, 'aPrototype')
    expect(boundA1).toBe(boundA2)

    const instanceB = new ExampleClass()
    const boundB1 = memoBind(instanceB, 'aPrototype')
    const boundB2 = memoBind(instanceB, 'aPrototype')
    expect(boundB1).toBe(boundB2)

    expect(boundA1).not.toBe(boundB1)
    expect(boundA2).not.toBe(boundB2)
  })
})
