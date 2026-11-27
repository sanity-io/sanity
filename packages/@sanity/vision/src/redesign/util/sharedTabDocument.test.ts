import {describe, expect, it} from 'vitest'

import {type VisionTab, type VisionTabOptions} from '../store/types'
import {
  mergeText,
  readSharedTabFields,
  sharedTabPatch,
  type SharedTabFields,
  toStoredOptions,
} from './sharedTabDocument'

const OPTIONS: VisionTabOptions = {
  datasetMode: 'auto',
  dataset: 'production',
  apiVersion: 'v2025-02-19',
  perspective: undefined,
  variant: 'none',
  includeSourceMap: false,
  useCdn: false,
}

const TAB: VisionTab = {
  id: 'tab-1',
  title: undefined,
  query: '*[_type == "post"]',
  rawParams: '{}',
  options: OPTIONS,
  autoRefetch: false,
  sharedId: 'shared-1',
}

const SYNCED: SharedTabFields = {
  query: TAB.query,
  rawParams: TAB.rawParams,
  options: OPTIONS,
  title: 'Posts',
}

describe('mergeText', () => {
  it('applies an edit made elsewhere to text with local edits it does not have', () => {
    expect(
      mergeText('*[_type == "post"]', '*[_type == "article"]', '*[_type == "post"]{title}'),
    ).toBe('*[_type == "article"]{title}')
  })

  it('takes the edit as it is when there is nothing local', () => {
    expect(mergeText('a', 'b', 'a')).toBe('b')
    expect(mergeText('a', 'a', 'ab')).toBe('ab')
  })
})

describe('readSharedTabFields', () => {
  it('reads the fields edited together', () => {
    expect(
      readSharedTabFields(
        {query: '*', params: '{"a": 1}', options: toStoredOptions(OPTIONS), title: 'All'},
        null,
      ),
    ).toEqual({query: '*', rawParams: '{"a": 1}', options: OPTIONS, title: 'All'})
  })

  it('reads a document shared before tabs were edited together from its URL', () => {
    const parsed = {query: '*[0]', rawParams: '{"b": 2}'} as never
    expect(readSharedTabFields({url: 'https://x', title: 'First'}, parsed)).toEqual({
      query: '*[0]',
      rawParams: '{"b": 2}',
      options: undefined,
      title: 'First',
    })
  })

  it('ignores options it does not understand', () => {
    expect(readSharedTabFields({query: '*', options: {dataset: 3}}, null).options).toBeUndefined()
  })
})

describe('sharedTabPatch', () => {
  it('is null while the tab holds what the document does', () => {
    expect(sharedTabPatch(SYNCED, TAB, 'https://url')).toBeNull()
  })

  it('sets the fields the tab changed, and the URL older studios read', () => {
    expect(sharedTabPatch(SYNCED, {...TAB, query: '*[_type == "post"][0]'}, 'https://url')).toEqual(
      {set: {query: '*[_type == "post"][0]', url: 'https://url'}},
    )
    expect(
      sharedTabPatch(SYNCED, {...TAB, options: {...OPTIONS, perspective: 'drafts'}}, undefined),
    ).toEqual({set: {options: toStoredOptions({...OPTIONS, perspective: 'drafts'})}})
  })

  it('stores no perspective as null, which survives JSON', () => {
    expect(toStoredOptions(OPTIONS).perspective).toBeNull()
    expect(readSharedTabFields({options: toStoredOptions(OPTIONS)}, null).options).toEqual(OPTIONS)
  })
})
