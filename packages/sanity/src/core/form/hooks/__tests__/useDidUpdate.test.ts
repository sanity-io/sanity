/* eslint-disable max-nested-callbacks */
import {renderHook} from '@testing-library/react'
import {StrictMode} from 'react'
import {useDidUpdate} from '../useDidUpdate'

describe('useDidUpdate', () => {
  describe('Normal Mode', () => {
    it('calls the didUpdate callback when the value changes', () => {
      const previousValue = {foo: 'bar'}
      const currentValue = {foo: 'baz'}
      const didUpdate = jest.fn()

      const {rerender} = renderHook(({value}) => useDidUpdate(value, didUpdate), {
        initialProps: {value: previousValue},
      })

      // The first time, didUpdate should be called
      expect(didUpdate).toHaveBeenCalledTimes(1)

      rerender({value: currentValue})

      expect(didUpdate).toHaveBeenCalledWith(previousValue, currentValue)
    })

    it('calls the compare function when it is passed', () => {
      const previousValue = {foo: 'bar'}
      const currentValue = {foo: 'baz'}
      const compare = jest.fn(() => false)
      const didUpdate = jest.fn()

      const {rerender} = renderHook(({value}) => useDidUpdate(value, didUpdate, compare), {
        initialProps: {value: previousValue},
      })

      // The first time, didUpdate and compare should be called
      expect(didUpdate).toHaveBeenCalledTimes(1)
      expect(compare).toHaveBeenCalledTimes(1)

      rerender({value: currentValue})

      expect(compare).toHaveBeenCalledWith(previousValue, currentValue)
      expect(didUpdate).toHaveBeenCalledWith(previousValue, currentValue)
    })

    it('does not call the didUpdate callback when the value does not change', () => {
      const previousValue = {foo: 'bar'}
      const currentValue = {foo: 'bar'}
      const didUpdate = jest.fn()

      const {rerender} = renderHook(({value}) => useDidUpdate(value, didUpdate), {
        initialProps: {value: previousValue},
      })

      // The first time, didUpdate should be called
      expect(didUpdate).toHaveBeenCalledTimes(1)

      didUpdate.mockClear()

      rerender({value: currentValue})

      expect(didUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Strict mode', () => {
    it('calls the didUpdate callback when the value changes', () => {
      const previousValue = {foo: 'bar'}
      const currentValue = {foo: 'baz'}
      const didUpdate = jest.fn()

      const {rerender} = renderHook(({value}) => useDidUpdate(value, didUpdate), {
        initialProps: {value: previousValue},
        wrapper: StrictMode,
      })

      // The first time, didUpdate should be called. StrictMode runs hooks twice https://react.dev/reference/react/StrictMode#strictmode
      expect(didUpdate).toHaveBeenCalledTimes(2)

      rerender({value: currentValue})

      expect(didUpdate).toHaveBeenCalledWith(previousValue, currentValue)
    })

    it('calls the compare function when it is passed', () => {
      const previousValue = {foo: 'bar'}
      const currentValue = {foo: 'baz'}
      const compare = jest.fn(() => false)
      const didUpdate = jest.fn()

      const {rerender} = renderHook(({value}) => useDidUpdate(value, didUpdate, compare), {
        initialProps: {value: previousValue},
        wrapper: StrictMode,
      })

      // The first time, didUpdate should be called. StrictMode runs hooks twice https://react.dev/reference/react/StrictMode#strictmode
      expect(didUpdate).toHaveBeenCalledTimes(2)
      expect(compare).toHaveBeenCalledTimes(2)

      rerender({value: currentValue})

      expect(compare).toHaveBeenCalledWith(previousValue, currentValue)
      expect(didUpdate).toHaveBeenCalledWith(previousValue, currentValue)
    })

    it('does not call the didUpdate callback when the value does not change', () => {
      const previousValue = {foo: 'bar'}
      const currentValue = {foo: 'bar'}
      const didUpdate = jest.fn()

      const {rerender} = renderHook(({value}) => useDidUpdate(value, didUpdate), {
        initialProps: {value: previousValue},
        wrapper: StrictMode,
      })

      // The first time, didUpdate should be called. StrictMode runs hooks twice https://react.dev/reference/react/StrictMode#strictmode
      expect(didUpdate).toHaveBeenCalledTimes(2)

      didUpdate.mockClear()

      rerender({value: currentValue})

      expect(didUpdate).not.toHaveBeenCalled()
    })
  })
})
