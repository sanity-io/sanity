import {describe, expect, test} from 'vitest'

import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {
  createIdNamespace,
  documentIdsOf,
  mapRevisionPreconditions,
  mapStrings,
  namespacedId,
} from './namespace'

describe('namespacedId', () => {
  test('prefixes the published part of draft, version and published ids', () => {
    expect(namespacedId('fv-probe-x-f0-', 'article-gen')).toBe('fv-probe-x-f0-article-gen')
    expect(namespacedId('fv-probe-x-f0-', 'drafts.article-gen')).toBe(
      'drafts.fv-probe-x-f0-article-gen',
    )
    expect(namespacedId('fv-probe-x-f0-', 'versions.r1.article-gen')).toBe(
      'versions.r1.fv-probe-x-f0-article-gen',
    )
  })
})

describe('documentIdsOf', () => {
  test('collects the pair the failure seeds and touches', () => {
    expect(documentIdsOf(loadFixtureReport().failures[0])).toEqual([
      'article-gen',
      'drafts.article-gen',
    ])
  })
})

describe('createIdNamespace', () => {
  test('rewrites ids in requests and maps them back', () => {
    const namespace = createIdNamespace('fv-probe-x-f0-', ['article-gen', 'drafts.article-gen'])
    const request = {
      kind: 'actions',
      actions: [{draftId: 'drafts.article-gen', publishedId: 'article-gen', patch: {set: {a: 1}}}],
    }
    const real = mapStrings(request, namespace.toReal)
    expect(real.actions[0]).toMatchObject({
      draftId: 'drafts.fv-probe-x-f0-article-gen',
      publishedId: 'fv-probe-x-f0-article-gen',
    })
    expect(mapStrings(real, namespace.toFake)).toEqual(request)
  })
})

describe('mapRevisionPreconditions', () => {
  test('rewrites only ifRevisionID values', () => {
    const revisions = new Map([['seed', 'real-1']])
    expect(
      mapRevisionPreconditions(
        [{patch: {id: 'seed', ifRevisionID: 'seed', set: {title: 'seed'}}}],
        revisions,
      ),
    ).toEqual([{patch: {id: 'seed', ifRevisionID: 'real-1', set: {title: 'seed'}}}])
  })
})
