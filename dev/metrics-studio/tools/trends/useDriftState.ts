import {useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'
import {useClient, useDocumentStore} from 'sanity'

import {ackIsActive, clearAck, type DriftAck, DRIFT_ACK_QUERY, writeAck} from './acks'
import {type TrendSeries} from './data'
import {computeDrift, type DriftBaseline, type DriftResult} from './drift'

const SNOOZE_DAYS = 7

/** Worst (largest-magnitude) fired baseline of a drift result. */
export function worstOf(entry: DriftResult): DriftBaseline {
  return entry.fired.reduce((a, b) =>
    Math.abs(b.deltaFraction) > Math.abs(a.deltaFraction) ? b : a,
  )
}

export interface DriftState {
  /** Drifted metrics not currently silenced/snoozed — the "to review" set. */
  active: DriftResult[]
  /** Drifted metrics muted by an active ack. */
  silenced: DriftResult[]
  /** Active regressions only (improvements excluded) — the badge count. */
  regressionCount: number
  now: number
  ack: (entry: DriftResult, state: 'silenced' | 'snoozed' | 'fixed') => void
  clear: (entry: DriftResult) => void
}

/**
 * Shared drift + acknowledgement state, computed once from the series so the
 * drift feed and the tab badges can never disagree. Realtime (listens to the
 * driftAck docs); the clock refreshes hourly for day-scale ack expiry.
 */
export function useDriftState(series: TrendSeries[]): DriftState {
  const client = useClient({apiVersion: '2025-02-19'})
  const documentStore = useDocumentStore()

  const acks$ = useMemo(
    () =>
      documentStore.listenQuery(DRIFT_ACK_QUERY, {}, {tag: 'metrics.driftAcks'}).pipe(
        map((result) => result as DriftAck[]),
        catchError(() => of<DriftAck[]>([])),
      ),
    [documentStore],
  )
  const acks = useObservable(acks$, [])

  const drift = useMemo(() => computeDrift(series), [series])
  // Lazy initializer reads the clock once (runs outside render commit, so it
  // satisfies react-compiler purity); the interval refreshes it hourly.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const {active, silenced} = useMemo(() => {
    const activeList: DriftResult[] = []
    const silencedList: DriftResult[] = []
    for (const entry of drift) {
      const found = acks.find((a) => a.metricKey === entry.seriesKey && a.branch === entry.branch)
      const recent = worstOf(entry).recent
      if (found && ackIsActive(found, recent, now)) silencedList.push(entry)
      else activeList.push(entry)
    }
    return {active: activeList, silenced: silencedList}
  }, [drift, acks, now])

  const regressionCount = active.filter((entry) => entry.direction === 'regression').length

  return {
    active,
    silenced,
    regressionCount,
    now,
    ack: (entry, state) =>
      void writeAck(client, {
        metricKey: entry.seriesKey,
        branch: entry.branch,
        baselineValue: worstOf(entry).recent,
        state,
        until:
          state === 'snoozed'
            ? new Date(now + SNOOZE_DAYS * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
      }),
    clear: (entry) => void clearAck(client, entry.seriesKey, entry.branch),
  }
}
