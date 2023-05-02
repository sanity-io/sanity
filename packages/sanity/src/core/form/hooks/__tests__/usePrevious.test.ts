import {renderHook} from '@testing-library/react'
import {usePrevious} from '../usePrevious'

describe('usePrevious', () => {
  it('should return undefined on the first render', () => {
    const {result} = renderHook(() => usePrevious('test'))
    expect(result.current).toBeNull()
  })

  it('should return the previous value on the next render', () => {
    const {result, rerender} = renderHook(({value}) => usePrevious(value), {
      initialProps: {value: 'test'},
    })

    rerender({value: 'updated'})
    expect(result.current).toEqual('test')

    rerender({value: 'changed'})
    expect(result.current).toEqual('updated')
  })

  it('should return the initial value if provided', () => {
    const {result, rerender} = renderHook(({value}) => usePrevious(value, 'initial'), {
      initialProps: {value: 'test'},
    })
    expect(result.current).toEqual('initial')

    rerender({value: 'updated'})
    expect(result.current).toEqual('test')
  })
})
