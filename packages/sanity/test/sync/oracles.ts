import {type SanityDocument} from '@sanity/types'
import {expect} from 'vitest'

import {type World} from './syncTest'

function content(document: SanityDocument | null): Record<string, unknown> | null {
  if (document === null) return null
  const {_rev, _updatedAt, _createdAt, ...rest} = document
  return rest
}

export function expectConverged(world: World): void {
  const ids = [world.idPair.draftId, world.idPair.publishedId]
  Object.values(world.clients).forEach((client) => {
    ids.forEach((id) => {
      expect(content(client.localDocument(id)), `${client.id} view of ${id}`).toEqual(
        world.lake.content(id),
      )
    })
  })
}

export function expectRevisionsAgree(world: World): void {
  const ids = [world.idPair.draftId, world.idPair.publishedId]
  Object.values(world.clients).forEach((client) => {
    ids.forEach((id) => {
      expect(client.localDocument(id)?._rev, `${client.id} revision of ${id}`).toBe(
        world.lake.get(id)?._rev,
      )
    })
  })
}

export function expectHealthy(world: World): void {
  Object.values(world.clients).forEach((client) => {
    expect(client.errors(), `${client.id} stream errors`).toEqual([])
    expect(client.consistent(), `${client.id} consistent`).toBe(true)
    expect(client.transactionLocked(), `${client.id} transaction lock`).toBe(false)
  })
}

export function keysOf(document: SanityDocument | null | undefined, field: string): string[] {
  const items = (document?.[field] ?? []) as Array<{_key: string}>
  return items.map((item) => item._key)
}

export function expectKeysConserved(
  before: string[],
  after: string[],
  changes: {added?: string[]; removed?: string[]} = {},
): void {
  const removed = new Set(changes.removed ?? [])
  const kept = before.flatMap((key) => (removed.has(key) ? [] : [key]))
  const expected = [...kept, ...(changes.added ?? [])]
  expect(after.toSorted(), 'array keys').toEqual(expected.toSorted())
  expect(new Set(after).size, 'duplicate keys').toBe(after.length)
}

export function fieldOf<T>(
  document: SanityDocument | null | undefined,
  field: string,
  key: string,
  name: string,
): T | undefined {
  const items = (document?.[field] ?? []) as Array<Record<string, unknown> & {_key: string}>
  return items.find((item) => item._key === key)?.[name] as T | undefined
}
