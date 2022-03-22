import type React from 'react'
import {TrackerContext} from './types'
export declare type ReporterHook<Payload> = (
  id: string | null,
  value: Payload | (() => Payload),
  isEqual?: (a: Payload, b: Payload) => boolean
) => void
export declare type IsEqualFunction<Value> = (a: Value, b: Value) => boolean
export declare function createUseReporter<Value>(
  Context: React.Context<TrackerContext<Value>>
): ReporterHook<Value>
