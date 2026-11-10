// The cases of gradient's pkg/documents/variant/resolver_test.go (origin/main, 10 Nov 2026), plus the per-document fall-through.
import {describe, expect, it} from 'vitest'

import {firstWithVersion, MAX_RESOLVED, rankDefinitions, type Ranked} from './rank'

const cand = (
  name: string,
  priority: number,
  createdAt: string,
  conditions: Record<string, string>,
): Ranked => ({_id: `_.variants.${name}`, _createdAt: createdAt, conditions, priority})

const names = (list: Ranked[]) => list.map((v) => v._id.replace('_.variants.', ''))

describe('rankDefinitions (ADR-3, gradient Resolve)', () => {
  it('no conditions resolves to no variant', () => {
    expect(rankDefinitions({}, [cand('french', 0, 't1', {locale: 'fr'})])).toEqual([])
  })

  it('specificity ranks first (the ADR-3 worked example)', () => {
    const got = rankDefinitions({locale: 'fr', tier: 'premium'}, [
      cand('french', 0, 't1', {locale: 'fr'}),
      cand('french-premium', 0, 't2', {locale: 'fr', tier: 'premium'}),
      cand('german', 0, 't3', {locale: 'de'}),
    ])
    expect(names(got)).toEqual(['french-premium', 'french'])
  })

  it('a definition with an extra key does not match', () => {
    const got = rankDefinitions({locale: 'fr'}, [
      cand('french', 0, 't1', {locale: 'fr'}),
      cand('french-premium', 0, 't2', {locale: 'fr', tier: 'premium'}),
    ])
    expect(names(got)).toEqual(['french'])
    expect(
      rankDefinitions({locale: 'fr'}, [
        cand('french-premium', 0, 't2', {locale: 'fr', tier: 'premium'}),
      ]),
    ).toEqual([])
  })

  it('a definition with a subset of the conditions matches', () => {
    const got = rankDefinitions({locale: 'fr', tier: 'premium'}, [
      cand('french', 0, 't1', {locale: 'fr'}),
      cand('german', 0, 't3', {locale: 'de'}),
    ])
    expect(names(got)).toEqual(['french'])
  })

  it('empty-condition definitions never match', () => {
    expect(rankDefinitions({locale: 'fr'}, [cand('inert', 99, 't0', {})])).toEqual([])
  })

  it('priority breaks a specificity tie', () => {
    const got = rankDefinitions({locale: 'fr'}, [
      cand('a', 1, 't1', {locale: 'fr'}),
      cand('b', 5, 't2', {locale: 'fr'}),
    ])
    expect(names(got)).toEqual(['b', 'a'])
  })

  it('priority does not beat specificity (the old lens order)', () => {
    const got = rankDefinitions({locale: 'fr', tier: 'premium'}, [
      cand('french', 9, 't1', {locale: 'fr'}),
      cand('french-premium', 0, 't2', {locale: 'fr', tier: 'premium'}),
    ])
    expect(names(got)).toEqual(['french-premium', 'french'])
  })

  it('createdAt breaks a priority tie (earlier wins)', () => {
    const got = rankDefinitions({locale: 'fr'}, [
      cand('a', 1, '2026-01-02T00:00:00Z', {locale: 'fr'}),
      cand('b', 1, '2026-01-01T00:00:00Z', {locale: 'fr'}),
    ])
    expect(names(got)).toEqual(['b', 'a'])
  })

  it('the name breaks every other tie (earlier wins)', () => {
    const got = rankDefinitions({locale: 'fr'}, [
      cand('zeta', 1, 't1', {locale: 'fr'}),
      cand('alpha', 1, 't1', {locale: 'fr'}),
    ])
    expect(names(got)).toEqual(['alpha', 'zeta'])
  })

  it('a value mismatch does not match, byte for byte', () => {
    expect(rankDefinitions({locale: 'FR'}, [cand('french', 0, 't1', {locale: 'fr'})])).toEqual([])
  })

  it('specificity orders the whole ranking, not just the winner', () => {
    const got = rankDefinitions({locale: 'fr', tier: 'premium', market: 'us'}, [
      cand('french', 0, 't1', {locale: 'fr'}),
      cand('premium', 0, 't2', {tier: 'premium'}),
      cand('french-premium', 0, 't3', {locale: 'fr', tier: 'premium'}),
      cand('german', 0, 't4', {locale: 'de'}),
    ])
    expect(names(got)).toEqual(['french-premium', 'french', 'premium'])
  })

  it('a tie between one-condition definitions is decided by priority, not by dimension order', () => {
    const visitor = {audience: 'new', locale: 'fr'}
    const a = cand('new-visitors', 4, 't1', {audience: 'new'})
    const b = cand('french', 2, 't2', {locale: 'fr'})
    expect(names(rankDefinitions(visitor, [b, a]))).toEqual(['new-visitors', 'french'])
    expect(names(rankDefinitions(visitor, [a, b]))).toEqual(['new-visitors', 'french'])
    // Swap the priorities: the other one wins, whatever the dimensions are called.
    const a2 = cand('new-visitors', 1, 't1', {audience: 'new'})
    const b2 = cand('french', 2, 't2', {locale: 'fr'})
    expect(names(rankDefinitions(visitor, [a2, b2]))).toEqual(['french', 'new-visitors'])
  })

  it('keeps the top MAX_RESOLVED and drops the rest', () => {
    const many = Array.from({length: MAX_RESOLVED + 5}, (_, i) =>
      cand(`v${String(i).padStart(2, '0')}`, i, 't', {locale: 'fr'}),
    )
    const got = rankDefinitions({locale: 'fr'}, many)
    expect(got).toHaveLength(MAX_RESOLVED)
    expect(names(got)[0]).toBe(`v${MAX_RESOLVED + 4}`)
    expect(names(got)[MAX_RESOLVED - 1]).toBe('v05')
  })
})

describe('firstWithVersion (per-document fall-through)', () => {
  const ranked = [
    cand('french-premium', 0, 't1', {locale: 'fr', tier: 'premium'}),
    cand('french', 0, 't2', {locale: 'fr'}),
  ]
  it('serves the next-ranked definition when the top one has no version of this document', () => {
    const has = (v: Ranked) => v._id.endsWith('.french')
    expect(firstWithVersion(ranked, has)?._id).toBe('_.variants.french')
  })
  it('serves the base when no ranked definition has a version', () => {
    expect(firstWithVersion(ranked, () => false)).toBeNull()
  })
})
