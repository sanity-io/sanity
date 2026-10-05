import {type AssetSource} from '@sanity/types'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {resolveSchemaAssetSources} from '../resolveSchemaAssetSources'

function source(name: string): AssetSource {
  return {name, i18nKey: '', component: () => null}
}

const configured = [
  source('sanity-default'),
  source('sanity-media-library'),
  source('app1:dropbox'),
]

describe('resolveSchemaAssetSources', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes the configured sources through when the schema sets nothing', () => {
    expect(resolveSchemaAssetSources(undefined, configured)).toBe(configured)
  })

  it('keeps the legacy override semantics for AssetSource arrays', () => {
    const custom = [source('custom')]
    expect(resolveSchemaAssetSources(custom, configured)).toEqual(custom)
    expect(resolveSchemaAssetSources([], configured)).toEqual([])
  })

  it('resolves string entries against the configured sources by name, in schema order', () => {
    expect(resolveSchemaAssetSources(['app1:dropbox', 'sanity-default'], configured)).toEqual([
      configured[2],
      configured[0],
    ])
  })

  it('supports mixing names and AssetSource objects', () => {
    const custom = source('custom')
    expect(resolveSchemaAssetSources([custom, 'sanity-default'], configured)).toEqual([
      custom,
      configured[0],
    ])
  })

  it('drops unknown names with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(resolveSchemaAssetSources(['nope', 'sanity-default'], configured)).toEqual([
      configured[0],
    ])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("'nope'"))
  })

  it('filters the configured sources with the predicate form', () => {
    expect(
      resolveSchemaAssetSources((s: AssetSource) => s.name.endsWith(':dropbox'), configured),
    ).toEqual([configured[2]])
    expect(resolveSchemaAssetSources(() => false, configured)).toEqual([])
  })
})
