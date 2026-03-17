import {type DefinedTelemetryLog} from '@sanity/telemetry'
import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {DeferredTelemetryProvider, useDeferredTelemetry} from '../DeferredTelemetryProvider'

const fakeEvent = {name: 'Test Event', version: 1} as DefinedTelemetryLog<{
  value: number
}>
function wrapper({children}: {children: ReactNode}) {
  return <DeferredTelemetryProvider>{children}</DeferredTelemetryProvider>
}

describe('DeferredTelemetryProvider', () => {
  it('buffers logged events', () => {
    const {result} = renderHook(() => useDeferredTelemetry(), {wrapper})

    result.current.log(fakeEvent, {value: 1})
    result.current.log(fakeEvent, {value: 2})

    const drained = result.current.consume()
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    expect(drained).toEqual([
      expect.objectContaining({
        createdAt: expect.stringMatching(ISO_DATE),
        event: fakeEvent,
        data: {value: 1},
      }),
      expect.objectContaining({
        createdAt: expect.stringMatching(ISO_DATE),
        event: fakeEvent,
        data: {value: 2},
      }),
    ])
  })

  it('clears the buffer after drain', () => {
    const {result} = renderHook(() => useDeferredTelemetry(), {wrapper})

    result.current.log(fakeEvent, {value: 1})
    result.current.consume()

    const second = result.current.consume()
    expect(second).toEqual([])
  })

  it('drops events logged after drain, warns if called', () => {
    const {result} = renderHook(() => useDeferredTelemetry(), {wrapper})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    result.current.consume()
    result.current.log(fakeEvent, {value: 99})

    const drained = result.current.consume()
    expect(warnSpy).toBeCalled()

    // You can also assert the message it was called with
    expect(warnSpy).toBeCalledWith(
      expect.objectContaining({
        message: 'Deferred telemetry events already consumed',
        stack: expect.any(String),
      }),
    )

    expect(drained).toEqual([])
  })

  it('throws when used outside the provider', () => {
    expect(() => {
      renderHook(() => useDeferredTelemetry())
    }).toThrow('useDeferredTelemetry must be used within DeferredTelemetryProvider')
  })
})
