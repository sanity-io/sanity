import {describe, expect, test} from 'vitest'

import {
  cutTrace,
  findTraceWindow,
  mainThreadTasks,
  mainThreadTime,
  READY_MARK,
  type TraceEvent,
} from './trace'

const MAIN = {pid: 1, tid: 2}

function slice(name: string, startMs: number, durationMs: number, thread = MAIN): TraceEvent {
  return {
    cat: 'devtools.timeline',
    dur: durationMs * 1000,
    name,
    ph: 'X',
    ts: startMs * 1000,
    ...thread,
  }
}

// Navigation started at 1000 ms on the trace clock and ready was reached 100 ms later.
const events: TraceEvent[] = [
  {cat: '__metadata', name: 'thread_name', ph: 'M', ts: 0, ...MAIN},
  slice('RunTask', 1005, 20),
  slice('ParseHTML', 1006, 4),
  slice('RunTask', 1030, 40),
  slice('v8.evaluateModule', 1030, 30),
  // Unclassified V8 work counts toward the script that runs it, a compile inside it does not.
  slice('V8.StackGuard', 1035, 5),
  slice('v8.compile', 1045, 10),
  slice('Layout', 1062, 6),
  // Started before ready and ends after it: only the part up to ready counts.
  slice('RunTask', 1095, 20),
  slice('FunctionCall', 1095, 20),
  {cat: 'blink.user_timing', name: READY_MARK, ph: 'R', ts: 1_100_000, ...MAIN},
  // Another thread and the time after ready are left out.
  slice('RunTask', 1010, 50, {pid: 1, tid: 9}),
  slice('RunTask', 1120, 5),
]

describe('findTraceWindow', () => {
  test('places navigation start readyMs before the ready mark, on the mark’s thread', () => {
    expect(findTraceWindow(events, 100)).toEqual({
      navigationStart: 1_000_000,
      ready: 1_100_000,
      ...MAIN,
    })
    expect(
      findTraceWindow(
        events.filter((event) => event.name !== READY_MARK),
        100,
      ),
    ).toBeNull()
  })
})

describe('with the ready window', () => {
  const window = findTraceWindow(events, 100)!

  test('cutTrace keeps metadata and everything before ready', () => {
    expect(cutTrace(events, window).map((event) => event.ts / 1000)).not.toContain(1120)
    expect(cutTrace(events, window)[0].ph).toBe('M')
  })

  test('mainThreadTasks lists the top-level tasks in ms from navigation start', () => {
    expect(mainThreadTasks(events, window)).toEqual([
      [5, 25],
      [30, 70],
      [95, 115],
    ])
  })

  test('mainThreadTime splits busy time by self time', () => {
    expect(mainThreadTime(events, window)).toEqual({
      busyMs: 65,
      otherMs: 20,
      parseCompileMs: 14,
      renderMs: 6,
      scriptMs: 25,
      windowMs: 100,
    })
  })
})
