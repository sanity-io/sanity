import {expect, test} from 'vitest'

import {type TrendPoint} from './data'
import {
  monthTick,
  monthTickIndices,
  startOfWeek,
  weekLabel,
  weeklyBuckets,
  weekOverWeek,
} from './weekly'

const DAY = 24 * 60 * 60 * 1000
// Monday 2026-03-09
const MONDAY = Date.UTC(2026, 2, 9)

function point(dayOffset: number, value: number, id = `run-${dayOffset}`): TrendPoint {
  return {date: new Date(MONDAY + dayOffset * DAY), value, sha: `sha-${dayOffset}`, runId: id}
}

test('weeks start on Monday, in UTC', () => {
  expect(startOfWeek(new Date(MONDAY)).getTime()).toBe(MONDAY)
  // Sunday belongs to the week that started the previous Monday
  expect(startOfWeek(new Date(MONDAY + 6 * DAY)).getTime()).toBe(MONDAY)
  expect(startOfWeek(new Date(MONDAY + 7 * DAY)).getTime()).toBe(MONDAY + 7 * DAY)
  // Late in the day, still the same week regardless of local time zone
  expect(startOfWeek(new Date(MONDAY + 6 * DAY + 23 * 60 * 60 * 1000)).getTime()).toBe(MONDAY)
})

test('a week is the median of its points, keeping the newest as the anchor', () => {
  const buckets = weeklyBuckets([point(0, 30), point(2, 34, 'newest'), point(1, 100)])
  expect(buckets).toHaveLength(1)
  expect(buckets[0].value).toBe(34)
  expect(buckets[0].runs).toBe(3)
  expect(buckets[0].latest?.runId).toBe('newest')
})

test('empty weeks stay on the axis as gaps', () => {
  const buckets = weeklyBuckets([point(0, 10), point(21, 40)])
  expect(buckets.map((bucket) => bucket.value)).toEqual([10, null, null, 40])
  expect(buckets.map((bucket) => bucket.runs)).toEqual([1, 0, 0, 1])
  expect(buckets[1].latest).toBeUndefined()
  expect(buckets.map((bucket) => bucket.weekStart.getTime())).toEqual([
    MONDAY,
    MONDAY + 7 * DAY,
    MONDAY + 14 * DAY,
    MONDAY + 21 * DAY,
  ])
})

test('no points, no buckets', () => {
  expect(weeklyBuckets([])).toEqual([])
})

test('week over week compares the newest two measured weeks, skipping gaps', () => {
  const buckets = weeklyBuckets([point(0, 10), point(7, 20), point(28, 26)])
  const move = weekOverWeek(buckets)
  expect(move?.latest.weekStart.getTime()).toBe(MONDAY + 28 * DAY)
  expect(move?.delta).toBe(6)
  expect(weekOverWeek(weeklyBuckets([point(0, 10)]))).toBeNull()
})

test('labels read as dates and year-months', () => {
  expect(weekLabel(new Date(MONDAY))).toBe('Mar 9, 2026')
  expect(monthTick(new Date(MONDAY))).toBe('2026-03')
})

test('a tick marks the first week of each month, and the origin', () => {
  const buckets = weeklyBuckets([point(0, 1), point(49, 1)])
  // Mar 9, 16, 23, 30, Apr 6, 13, 20, 27
  expect(monthTickIndices(buckets)).toEqual([0, 4])
})
