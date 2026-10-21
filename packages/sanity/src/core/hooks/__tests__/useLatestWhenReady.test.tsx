import {renderHook} from '@testing-library/react'
import {firstValueFrom} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {useLatestWhenReady} from '../useLatestWhenReady'

describe('useLatestWhenReady', () => {
  it('holds subscribers back until the value is ready, then emits the latest value', async () => {
    const {result, rerender} = renderHook(({value, ready}) => useLatestWhenReady(value, ready), {
      initialProps: {value: 'loading default', ready: false},
    })
    const value$ = result.current
    const received = firstValueFrom(value$)

    rerender({value: 'resolved', ready: true})

    await expect(received).resolves.toBe('resolved')
    expect(result.current).toBe(value$)
  })

  it('replays the latest ready value to later subscribers', async () => {
    const {result, rerender} = renderHook(({value, ready}) => useLatestWhenReady(value, ready), {
      initialProps: {value: 'first', ready: true},
    })

    rerender({value: 'second', ready: true})

    await expect(firstValueFrom(result.current)).resolves.toBe('second')
  })
})
