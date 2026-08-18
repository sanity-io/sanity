import {afterEach, describe, expect, it, vi} from 'vitest'

import {getOffsetsTo} from './getOffsetsTo'

function mockOffsetParent(tree: HTMLElement[]) {
  for (let index = 0; index < tree.length; index += 1) {
    const current = tree[index]
    const parent = tree[index + 1] ?? null
    Object.defineProperty(current, 'offsetParent', {
      configurable: true,
      get: () => parent,
    })
  }
}

function mockBox(
  element: HTMLElement,
  box: {offsetTop: number; offsetLeft: number; offsetHeight: number; offsetWidth: number},
) {
  Object.defineProperty(element, 'offsetTop', {configurable: true, value: box.offsetTop})
  Object.defineProperty(element, 'offsetLeft', {configurable: true, value: box.offsetLeft})
  Object.defineProperty(element, 'offsetHeight', {configurable: true, value: box.offsetHeight})
  Object.defineProperty(element, 'offsetWidth', {configurable: true, value: box.offsetWidth})
}

describe('getOffsetsTo', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('subtracts scrollTop from a positioned overflow scroller on the offsetParent walk', () => {
    const root = document.createElement('div')
    const scroller = document.createElement('div')
    const field = document.createElement('div')
    root.append(scroller)
    scroller.append(field)
    document.body.append(root)

    mockBox(root, {offsetTop: 0, offsetLeft: 0, offsetHeight: 600, offsetWidth: 800})
    mockBox(scroller, {offsetTop: 40, offsetLeft: 10, offsetHeight: 200, offsetWidth: 300})
    mockBox(field, {offsetTop: 180, offsetLeft: 8, offsetHeight: 20, offsetWidth: 100})
    scroller.scrollTop = 160
    mockOffsetParent([field, scroller, root])

    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const overflow = element === scroller ? 'auto' : 'visible'
      return {overflow} as CSSStyleDeclaration
    })

    const {rect} = getOffsetsTo(field, root)

    expect(rect.top).toBe(60)
    root.remove()
  })

  it('does not subtract scrollTop from an unpositioned overflow wrapper skipped by offsetParent', () => {
    const root = document.createElement('div')
    const wrapper = document.createElement('div')
    const field = document.createElement('div')
    root.append(wrapper)
    wrapper.append(field)
    document.body.append(root)

    mockBox(root, {offsetTop: 0, offsetLeft: 0, offsetHeight: 600, offsetWidth: 800})
    mockBox(wrapper, {offsetTop: 40, offsetLeft: 10, offsetHeight: 200, offsetWidth: 300})
    mockBox(field, {offsetTop: 180, offsetLeft: 8, offsetHeight: 20, offsetWidth: 100})
    wrapper.scrollTop = 160
    mockOffsetParent([field, root])

    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const overflow = element === wrapper ? 'auto' : 'visible'
      return {overflow} as CSSStyleDeclaration
    })

    const {rect} = getOffsetsTo(field, root)

    expect(rect.top).toBe(180)
    root.remove()
  })
})
