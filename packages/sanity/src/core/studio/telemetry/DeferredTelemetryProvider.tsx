import {type DefinedTelemetryLog} from '@sanity/telemetry'
import {type ReactNode, useContext, useMemo, useRef} from 'react'

import {createContext} from '../../../_createContext'

/** A buffered deferred telemetry event. */
export interface BufferedTelemetryEvent<Data = unknown> {
  createdAt: string
  event: DefinedTelemetryLog<Data>
  data: Data
}

interface DeferredTelemetryContextValue<Data = unknown> {
  log: (event: DefinedTelemetryLog<Data>, data?: Data) => void
  consume: () => BufferedTelemetryEvent<Data>[]
}

const DeferredTelemetryContext = createContext<DeferredTelemetryContextValue | null>(
  'sanity/_singletons/context/deferred-telemetry',
  null,
)

/**
 * Provides a buffer for telemetry events logged before StudioTelemetryProvider mounts.
 * Place this above AuthBoundary so pre-auth events can be captured and replayed
 * once the real telemetry pipeline is available.
 *
 * @internal
 */
export function DeferredTelemetryProvider({children}: {children: ReactNode}) {
  const bufferRef = useRef<BufferedTelemetryEvent[]>([])
  const consumedRef = useRef(false)

  const value = useMemo(
    (): DeferredTelemetryContextValue => ({
      log: (event, data) => {
        if (consumedRef.current) {
          console.warn(new Error('Deferred telemetry events already consumed'))
        } else {
          bufferRef.current.push({createdAt: new Date().toISOString(), event, data})
        }
      },
      consume: () => {
        consumedRef.current = true
        const events = bufferRef.current
        bufferRef.current = []
        return events
      },
    }),
    [],
  )

  return (
    <DeferredTelemetryContext.Provider value={value}>{children}</DeferredTelemetryContext.Provider>
  )
}

/**
 * Returns the deferred telemetry buffer for logging events before telemetry store is set up.
 *
 * @internal
 */
export function useDeferredTelemetry(): DeferredTelemetryContextValue {
  const ctx = useContext(DeferredTelemetryContext)
  if (!ctx) {
    throw new Error('useDeferredTelemetry must be used within DeferredTelemetryProvider')
  }
  return ctx
}
