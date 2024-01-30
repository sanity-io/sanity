import {renderHook, act} from '@testing-library/react'
import {useCallbackWithTelemetry} from './useCallbackWithTelemetry'

const mockedTelemetryLog = jest.fn()

jest.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({
    log: mockedTelemetryLog,
  }),
}))
describe('useCallbackWithTelemetry', () => {
  it('should preserve the return type of the callback if defined', () => {
    const callback = jest.fn(() => "I'm a string")
    const {result} = renderHook(() => useCallbackWithTelemetry(callback, [], 'testCallback'))

    let returnValue
    act(() => {
      returnValue = result.current()
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(returnValue).toBe("I'm a string")
  })
  it('should preserve the return type of the callback if undefined', () => {
    const callback = jest.fn(() => undefined)
    const {result} = renderHook(() => useCallbackWithTelemetry(callback, [], 'testCallback'))

    let returnValue
    act(() => {
      returnValue = result.current()
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(returnValue).toBe(undefined)
  })

  it('should log the error and rethrow it if the callback throws an error', () => {
    const callback = jest.fn(() => {
      throw new Error('test error')
    })
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const {result} = renderHook(() => useCallbackWithTelemetry(callback, [], 'shouldFail'))

    const action = () => {
      act(() => {
        result.current()
      })
    }
    expect(action).toThrow('test error')
    expect(callback).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(Error('test error'))
    expect(mockedTelemetryLog).toHaveBeenCalledTimes(1)
    expect(mockedTelemetryLog).toHaveBeenCalledWith(
      {
        description: 'The portable text editor encountered an error',
        name: 'Portable Text Editor error',
        type: 'log',
        version: 1,
      },
      {args: [], error: Error('test error'), fnName: 'shouldFail'},
    )
  })

  it('should update the callback when a dependency changes', () => {
    const initialDependency = 'initial'
    const updatedDependency = 'updated'

    const {result, rerender} = renderHook(
      ({dep}) => useCallbackWithTelemetry(() => dep, [dep], 'testCallback'),
      {initialProps: {dep: initialDependency}},
    )

    // Call the callback once with the initial dependency
    let returnValue = ''
    act(() => {
      returnValue = result.current()
    })
    expect(returnValue).toBe(initialDependency)

    // Rerender the hook with an updated dependency
    rerender({dep: updatedDependency})

    // Call the callback again after the dependency has changed
    act(() => {
      returnValue = result.current()
    })
    expect(returnValue).toBe(updatedDependency)
  })
})
