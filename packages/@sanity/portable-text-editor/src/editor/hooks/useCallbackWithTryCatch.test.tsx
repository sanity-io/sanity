import {renderHook} from '@testing-library/react'
import {PortableTextEditorError, useCallbackWithTryCatch} from './useCallbackWithTryCatch'

describe('useCallbackWithTryCatch', () => {
  it('should preserve the return type of the callback if defined', () => {
    const callback = jest.fn(() => "I'm a string")
    const {result} = renderHook(() => useCallbackWithTryCatch(callback, [], 'testCallback'))

    const returnValue = result.current()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(returnValue).toBe("I'm a string")
  })
  it('should preserve the return type of the callback if undefined', () => {
    const callback = jest.fn(() => undefined)
    const {result} = renderHook(() => useCallbackWithTryCatch(callback, [], 'testCallback'))

    const returnValue = result.current()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(returnValue).toBe(undefined)
  })

  it('should log the error and rethrow it if the callback throws an error', () => {
    const callback = jest.fn(() => {
      throw new Error('Test error')
    })
    const {result} = renderHook(() => useCallbackWithTryCatch(callback, [], 'functionName'))
    try {
      result.current()
    } catch (e) {
      expect(e.message).toBe('Test error')
      expect(e.cause).toBe('functionName')
      expect(e).toBeInstanceOf(PortableTextEditorError)
      expect(callback).toHaveBeenCalledTimes(1)
    }
  })
  it('should update the callback when a dependency changes', () => {
    const initialDependency = 'initial'
    const updatedDependency = 'updated'

    const {result, rerender} = renderHook(
      // eslint-disable-next-line max-nested-callbacks
      ({dep}) => useCallbackWithTryCatch(() => dep, [dep], 'testCallback'),
      {initialProps: {dep: initialDependency}},
    )

    // Call the callback once with the initial dependency
    let returnValue = result.current()

    expect(returnValue).toBe(initialDependency)

    // Rerender the hook with an updated dependency
    rerender({dep: updatedDependency})

    // Call the callback again after the dependency has changed
    returnValue = result.current()
    expect(returnValue).toBe(updatedDependency)
  })

  it('should preserve the correct return type', () => {
    const callback = () => "I'm a string"
    const {result} = renderHook(() => useCallbackWithTryCatch(callback, [], 'testCallback'))
    // @ts-expect-error the return type of the function is a string
    const returnValue: number = result.current()
    expect(returnValue).toBe("I'm a string")
  })
  it('should preserve the correct function params', () => {
    const callback = (a: number, b: number) => a + b
    const {result} = renderHook(() => useCallbackWithTryCatch(callback, [], 'testCallback'))
    // @ts-expect-error the return type of the function is a string
    result.current()
  })
})
