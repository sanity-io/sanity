import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useScrollMirror} from '../useScrollMirror'

const created: HTMLElement[][] = []
let destroyCount = 0

vi.mock('scrollmirror', () => ({
  default: class ScrollMirror {
    constructor(public elements: HTMLElement[]) {
      created.push(elements)
    }
    destroy() {
      destroyCount++
    }
  },
}))

describe('useScrollMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    created.length = 0
    destroyCount = 0
  })

  it('initializes and destroys ScrollMirror', () => {
    const el1 = document.createElement('div')
    const el2 = document.createElement('div')
    const {unmount} = renderHook(() => useScrollMirror([el1, el2]))

    expect(created).toEqual([[el1, el2]])
    unmount()
    expect(destroyCount).toBe(1)
  })

  it('does nothing when all elements are null', () => {
    const {unmount} = renderHook(() => useScrollMirror([null, null]))
    unmount()
    expect(created.length).toBe(0)
    expect(destroyCount).toBe(0)
  })
})
