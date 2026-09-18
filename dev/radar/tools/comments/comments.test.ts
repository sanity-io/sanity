import {type PortableTextBlock} from 'sanity'
import {expect, test} from 'vitest'

import {
  commentExcerpt,
  type CommitComment,
  commentsNearRun,
  messageToPlainText,
  resolveCommentPositions,
  shaFromCommitDocumentId,
  threadsForSha,
} from './comments'

const DAY = 24 * 60 * 60 * 1000
const JAN = '2026-01-10T12:00:00.000Z'
const FEB = '2026-02-10T12:00:00.000Z'
const MAR = '2026-03-10T12:00:00.000Z'

const SHA_A = 'a'.repeat(40)
const SHA_B = 'b'.repeat(40)

function text(value: string): PortableTextBlock[] {
  return [{_type: 'block', _key: 'k', children: [{_type: 'span', _key: 's', text: value}]}]
}

let counter = 0
function comment(
  sha: string,
  overrides: Partial<
    Pick<CommitComment, 'parentCommentId' | 'createdAt' | 'committedAt' | 'seriesKey'>
  > = {},
): CommitComment {
  counter += 1
  return {
    _id: `comment-${counter}`,
    sha,
    threadId: `thread-${counter}`,
    parentCommentId: null,
    status: 'open',
    authorId: 'p123',
    message: text(`comment ${counter}`),
    createdAt: `2026-04-01T00:00:${String(counter).padStart(2, '0')}.000Z`,
    ...overrides,
  }
}

const point = (sha: string, dateIso: string) => ({sha, date: new Date(dateIso)})

/** A wide-open domain, so a test only constrains what it means to. */
const resolve = (comments: CommitComment[], points: {sha: string; date: Date}[] = []) =>
  resolveCommentPositions(comments, points, Date.parse(JAN) - DAY, Date.parse(MAR) + DAY)

const shas = (resolved: {sha: string}[]) => resolved.map((entry) => entry.sha)

test('maps a gitCommit document id back to its sha', () => {
  expect(shaFromCommitDocumentId(`git-commit-${SHA_A}`)).toBe(SHA_A)
  expect(shaFromCommitDocumentId('bench-run-abc')).toBeUndefined()
  expect(shaFromCommitDocumentId('git-commit-nope')).toBeUndefined()
})

test('no comments means no markers', () => {
  expect(resolve([])).toEqual([])
})

// The thread is about the commit; the run that measured it is where the
// reader sees the commit's effect, so the marker belongs on that point
test('anchors to the run that measured the commit', () => {
  const [resolved] = resolve([comment(SHA_A, {committedAt: FEB})], [point(SHA_A, MAR)])
  expect(resolved.atMs).toBe(Date.parse(MAR))
  expect(resolved.measured).toBe(true)
})

test('falls back to the commit date when no run measured it', () => {
  const [resolved] = resolve([comment(SHA_A, {committedAt: FEB})], [point(SHA_B, MAR)])
  expect(resolved.atMs).toBe(Date.parse(FEB))
  expect(resolved.measured).toBe(false)
})

test('a commit with no run and no known date has no marker', () => {
  expect(resolve([comment(SHA_A)])).toEqual([])
})

test('a re-measured commit anchors to its earliest run', () => {
  const [resolved] = resolve([comment(SHA_A)], [point(SHA_A, MAR), point(SHA_A, FEB)])
  expect(resolved.atMs).toBe(Date.parse(FEB))
})

test('one marker per commit, holding every thread on it but no replies', () => {
  const first = comment(SHA_A, {createdAt: '2026-04-02T00:00:00.000Z'})
  const second = comment(SHA_A, {createdAt: '2026-04-01T00:00:00.000Z'})
  const reply = comment(SHA_A, {parentCommentId: first._id})
  const resolved = resolve([first, second, reply], [point(SHA_A, FEB)])
  expect(resolved).toHaveLength(1)
  expect(resolved[0].threads.map((thread) => thread._id)).toEqual([second._id, first._id])
})

// Anchor before filtering: a commit that landed just before the window but
// was measured inside it is part of the window's story
test('domain filtering uses the anchored position', () => {
  const inside = resolveCommentPositions(
    [comment(SHA_A, {committedAt: JAN})],
    [point(SHA_A, FEB)],
    Date.parse(FEB) - DAY,
    Date.parse(FEB) + DAY,
  )
  expect(shas(inside)).toEqual([SHA_A])
  const outside = resolveCommentPositions(
    [comment(SHA_A, {committedAt: JAN})],
    [],
    Date.parse(FEB) - DAY,
    Date.parse(FEB) + DAY,
  )
  expect(outside).toEqual([])
})

test('the domain boundaries are inclusive', () => {
  const inside = resolveCommentPositions(
    [comment(SHA_A, {committedAt: JAN}), comment(SHA_B, {committedAt: MAR})],
    [],
    Date.parse(JAN),
    Date.parse(MAR),
  )
  expect(shas(inside)).toEqual([SHA_A, SHA_B])
})

test('output is ordered by drawn position', () => {
  const late = comment(SHA_B, {committedAt: MAR})
  const early = comment(SHA_A, {committedAt: JAN})
  expect(shas(resolve([late, early]))).toEqual([SHA_A, SHA_B])
})

test('a thread scoped to one chart is drawn only on that chart', () => {
  const scoped = comment(SHA_A, {committedAt: FEB, seriesKey: 'interaction:article:body'})
  const whole = comment(SHA_B, {committedAt: MAR})
  const onItsChart = resolveCommentPositions(
    [scoped, whole],
    [],
    Date.parse(JAN),
    Date.parse(MAR),
    'interaction:article:body',
  )
  expect(shas(onItsChart)).toEqual([SHA_A, SHA_B])
  const elsewhere = resolveCommentPositions(
    [scoped, whole],
    [],
    Date.parse(JAN),
    Date.parse(MAR),
    'pageload:singleString:LCP',
  )
  expect(shas(elsewhere)).toEqual([SHA_B])
  // No chart (the bisect stepper): every thread counts
  expect(shas(resolve([scoped, whole]))).toEqual([SHA_A, SHA_B])
})

test('threadsForSha keeps the parent comments of one commit', () => {
  const parent = comment(SHA_A)
  const reply = comment(SHA_A, {parentCommentId: parent._id})
  const elsewhere = comment(SHA_B)
  expect(threadsForSha([parent, reply, elsewhere], SHA_A).map((c) => c._id)).toEqual([parent._id])
})

test('threadsForSha honours the chart scope when given one', () => {
  const scoped = comment(SHA_A, {seriesKey: 'k'})
  const other = comment(SHA_A, {seriesKey: 'other'})
  const whole = comment(SHA_A)
  expect(threadsForSha([scoped, other, whole], SHA_A, 'k').map((c) => c._id)).toEqual([
    scoped._id,
    whole._id,
  ])
  expect(threadsForSha([scoped, other, whole], SHA_A).map((c) => c._id)).toEqual([
    scoped._id,
    other._id,
    whole._id,
  ])
})

test('commentsNearRun keeps the markers within tolerance of the run', () => {
  const near = comment(SHA_A, {committedAt: FEB})
  const far = comment(SHA_B, {committedAt: MAR})
  const resolved = resolve([near, far])
  expect(shas(commentsNearRun(resolved, Date.parse(FEB) + DAY, 2 * DAY))).toEqual([SHA_A])
})

test('messageToPlainText joins blocks and names mentions generically', () => {
  const message: PortableTextBlock[] = [
    {
      _type: 'block',
      _key: 'a',
      children: [
        {_type: 'span', _key: '1', text: 'Bisected to '},
        {_type: 'mention', _key: '2', userId: 'p123'},
        {_type: 'span', _key: '3', text: "'s   PR"},
      ],
    },
    {_type: 'block', _key: 'b', children: [{_type: 'span', _key: '4', text: 'Fix pending.'}]},
  ]
  expect(messageToPlainText(message)).toBe("Bisected to @mention's PR Fix pending.")
  expect(messageToPlainText(null)).toBe('')
})

test('commentExcerpt clips long messages with an ellipsis', () => {
  const excerpt = commentExcerpt(text('word '.repeat(40)), 20)
  expect(excerpt.length).toBeLessThanOrEqual(20)
  expect(excerpt.endsWith('…')).toBe(true)
  expect(commentExcerpt(text('short'), 20)).toBe('short')
})
