import {describe, expect, it} from 'vitest'

import {resolveBundlePerspective, resolvePerspectiveOptions} from '../resolvePerspective'

describe('resolveBundlePerspective', () => {
  it('returns the perspective with the `bundle.` prefix removed', () => {
    expect(resolveBundlePerspective('bundle.x')).toBe('x')
  })

  it('returns `undefined` if the provided perspective has no `bundle.` prefix', () => {
    expect(resolveBundlePerspective('x')).toBeUndefined()
  })

  it('returns `undefined` if no perspective is provided', () => {
    expect(resolveBundlePerspective()).toBeUndefined()
  })
})

describe('resolvePerspectiveOptions', () => {
  it('includes the `bundlePerspective` property if a bundle is provided', () => {
    expect(resolvePerspectiveOptions('bundle.x')).toHaveProperty('bundlePerspective')
    expect(resolvePerspectiveOptions('bundle.x')).not.toHaveProperty('perspective')
  })

  it('includes the `perspective` property if a system perspective is provided', () => {
    expect(resolvePerspectiveOptions('x')).toHaveProperty('perspective')
    expect(resolvePerspectiveOptions('x')).not.toHaveProperty('bundlePerspective')
  })

  it(`removes the bundle prefix if it exists`, () => {
    expect(resolvePerspectiveOptions('bundle.x').bundlePerspective).toEqual('x')
    expect(resolvePerspectiveOptions('x').perspective).toEqual('x')
  })

  it('allows the extracted perspectives to be transformed', () => {
    expect(resolvePerspectiveOptions('x', () => ['y'])).toEqual({
      perspective: 'y',
    })
  })

  it('passes the perspective to the `transformPerspectives` function', () => {
    expect.assertions(2)

    resolvePerspectiveOptions('x', (perspectives) => {
      expect(perspectives).toEqual(['x'])
      return perspectives
    })

    resolvePerspectiveOptions('bundle.x', (perspectives) => {
      expect(perspectives).toEqual(['x'])
      return perspectives
    })
  })

  it('passes the perspective type to the `transformPerspectives` function', () => {
    expect.assertions(2)

    resolvePerspectiveOptions('x', (perspectives, isSystemPerspective) => {
      expect(isSystemPerspective).toBe(true)
      return perspectives
    })

    resolvePerspectiveOptions('bundle.x', (perspectives, isSystemPerspective) => {
      expect(isSystemPerspective).toBe(false)
      return perspectives
    })
  })

  it('produces a correctly formatted list of perspectives', () => {
    expect(resolvePerspectiveOptions('x', (perspectives) => perspectives.concat('y'))).toEqual({
      perspective: 'x,y',
    })
  })
})
