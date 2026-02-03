import {renderHook} from '@testing-library/react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import * as useDidUpdate from '../useDidUpdate'
import {useScrollIntoViewOnFocusWithin} from '../useScrollIntoViewOnFocusWithin'

vi.mock('scroll-into-view-if-needed', () => ({
  default: vi.fn(),
}))

describe('useScrollIntoViewOnFocusWithin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should scroll when hasFocusWithin is true', () => {
    const elementRef = {current: document.createElement('div')}
    const hasFocusWithin = true
    const useDidUpdateSpy = vi.spyOn(useDidUpdate, 'useDidUpdate')

    renderHook(() => useScrollIntoViewOnFocusWithin(elementRef, hasFocusWithin))

    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(hasFocusWithin)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  test('should scroll when hasFocusWithin changes from false to true', () => {
    const elementRef = {current: document.createElement('div')}
    const hasFocusWithin = false
    const useDidUpdateSpy = vi.spyOn(useDidUpdate, 'useDidUpdate')

    const {rerender} = renderHook(
      (props) => useScrollIntoViewOnFocusWithin(elementRef, props.hasFocusWithin),
      {
        initialProps: {hasFocusWithin},
      },
    )

    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(hasFocusWithin)
    expect(scrollIntoView).not.toHaveBeenCalled()

    // clear all mocks
    vi.clearAllMocks()

    const newHasFocusWithin = true
    rerender({hasFocusWithin: newHasFocusWithin})
    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(newHasFocusWithin)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).toHaveBeenCalledWith(elementRef.current, {scrollMode: 'always'})
  })

  test('should not scroll when hasFocusWithin changes from true to false', () => {
    const elementRef = {current: document.createElement('div')}
    const hasFocusWithin = true
    const useDidUpdateSpy = vi.spyOn(useDidUpdate, 'useDidUpdate')

    const {rerender} = renderHook(
      (props) => useScrollIntoViewOnFocusWithin(elementRef, props.hasFocusWithin),
      {
        initialProps: {hasFocusWithin},
      },
    )

    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(hasFocusWithin)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()

    const newHasFocusWithin = false
    rerender({hasFocusWithin: newHasFocusWithin})
    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(newHasFocusWithin)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('should not scroll when hasFocusWithin has not changed', () => {
    const elementRef = {current: document.createElement('div')}
    const hasFocusWithin = true
    const useDidUpdateSpy = vi.spyOn(useDidUpdate, 'useDidUpdate')

    const {rerender} = renderHook(
      (props) => useScrollIntoViewOnFocusWithin(elementRef, props.hasFocusWithin),
      {
        initialProps: {hasFocusWithin},
      },
    )

    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(hasFocusWithin)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()

    const newHasFocusWithin = true
    rerender({hasFocusWithin: newHasFocusWithin})
    expect(useDidUpdateSpy).toHaveBeenCalledTimes(1)
    expect(useDidUpdateSpy.mock.calls[0][0]).toBe(newHasFocusWithin)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
