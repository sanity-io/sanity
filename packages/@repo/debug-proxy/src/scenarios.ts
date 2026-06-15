import {partition, shuffle} from 'es-toolkit'
import {
  bufferTime,
  concatMap,
  delay,
  filter,
  mergeMap,
  type MonoTypeOperatorFunction,
  of,
  pipe,
} from 'rxjs'

import {type SSEEvent} from './proxy'

/**
 * Delay each event by a random duration in [min, max] ms. Uses `mergeMap` so
 * delays apply per-event (jitter) rather than accumulating in a queue — this
 * reorders events, which is consistent with {@link shuffleEventDelivery} and
 * fine for a fault-injection tool.
 */
export function randomLatency<T>(min: number, max: number) {
  return mergeMap((event: T) =>
    of(event).pipe(delay(Math.round(min + Math.random() * (max - min)))),
  )
}

export function sendReset<T extends SSEEvent>(probability: number) {
  return pipe(
    mergeMap((event: T) => {
      return event.type !== 'message' ||
        event.message.event !== 'mutation' ||
        Math.random() >= probability
        ? [event]
        : [
            {
              ...event,
              message: {
                id: event.message.id,
                event: 'reset',
                data: '{"listenerName": "debug!!"}',
              },
            },
          ]
    }),
  )
}

export function duplicateMutations<T extends SSEEvent>(probability: number) {
  return mergeMap((event: T) => {
    return event.type !== 'message' ||
      event.message.event !== 'mutation' ||
      Math.random() >= probability
      ? [event]
      : [event, event]
  })
}

export function dropMutations<T extends SSEEvent>(probability: number) {
  return filter(
    (event: T) =>
      event.type !== 'message' ||
      event.message.event !== 'mutation' ||
      Math.random() >= probability,
  )
}

export function shuffleEventDelivery<T extends SSEEvent>(
  bufferInterval: number,
): MonoTypeOperatorFunction<T> {
  return pipe(
    bufferTime(bufferInterval),
    concatMap((events) => {
      // welcome should always come first
      const [welcome, rest] = partition(
        events,
        (e) => e.type === 'message' && e.message.event === 'welcome',
      )
      return [...welcome, ...shuffle(rest)]
    }),
  )
}
