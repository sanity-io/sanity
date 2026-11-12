import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {activeASAPRelease, scheduledRelease} from '../../releases/__fixtures__/release.fixture'
import {
  getGroupSelectionState,
  getRangeIds,
  getRowToggle,
  getSelectionBlockedReason,
  getSetSelection,
} from './selection'

describe('getGroupSelectionState', () => {
  it('is checked only when every selectable row is selected', () => {
    expect(getGroupSelectionState(['a', 'b'], new Set(['a', 'b']))).toBe('checked')
    expect(getGroupSelectionState(['a', 'b'], new Set(['a']))).toBe('indeterminate')
    expect(getGroupSelectionState(['a', 'b'], new Set(['c']))).toBe('unchecked')
    expect(getGroupSelectionState([], new Set(['a']))).toBe('unchecked')
  })
})

describe('getRangeIds', () => {
  it('returns the ids between two ids in either direction', () => {
    expect(getRangeIds(['a', 'b', 'c', 'd'], 'b', 'd')).toEqual(['b', 'c', 'd'])
    expect(getRangeIds(['a', 'b', 'c', 'd'], 'c', 'a')).toEqual(['a', 'b', 'c'])
  })

  it('returns nothing when either end is outside the list', () => {
    expect(getRangeIds(['a', 'b'], 'a', 'z')).toEqual([])
  })
})

describe('getSelectionBlockedReason', () => {
  it('blocks a version in a scheduled release, and nothing else', () => {
    expect(getSelectionBlockedReason(scheduledRelease)).toBe('scheduled-release')
    expect(getSelectionBlockedReason(activeASAPRelease)).toBeUndefined()
    expect(getSelectionBlockedReason(undefined)).toBeUndefined()
  })
})

describe('getSetSelection', () => {
  const releases: Record<string, ReleaseDocument | undefined> = {
    scheduled: scheduledRelease,
    asap: activeASAPRelease,
  }

  it('leaves blocked rows out of the selectable rows and the group state', () => {
    const selection = getSetSelection({
      variants: [{id: 'asap'}, {id: 'scheduled'}, {id: 'draft'}],
      selectedIds: new Set(['asap', 'draft']),
      getRelease: ({id}) => releases[id],
    })

    expect(selection.selectableIds).toEqual(['asap', 'draft'])
    expect([...selection.blockedReasons]).toEqual([['scheduled', 'scheduled-release']])
    expect(selection.groupBlockedReason).toBeUndefined()
    expect(selection.state).toBe('checked')
  })

  it('blocks the group checkbox when no row can be selected', () => {
    const selection = getSetSelection({
      variants: [{id: 'scheduled'}],
      selectedIds: new Set(),
      getRelease: ({id}) => releases[id],
    })

    expect(selection.groupBlockedReason).toBe('scheduled-release')
    expect(selection.state).toBe('unchecked')
  })
})

describe('getRowToggle', () => {
  const base = {setKey: 'drafts', selectableIds: ['a', 'b', 'c'], selectedIds: new Set<string>()}

  it('toggles one row on a plain click, and anchors the next range on it', () => {
    expect(getRowToggle({...base, anchor: null, variantId: 'b', shiftKey: false})).toEqual({
      event: {type: 'selection.toggle', variantId: 'b'},
      anchor: {setKey: 'drafts', variantId: 'b'},
    })
  })

  it('gives a Shift-clicked range the state the clicked row is moving to', () => {
    const anchor = {setKey: 'drafts', variantId: 'a'}
    expect(getRowToggle({...base, anchor, variantId: 'c', shiftKey: true}).event).toEqual({
      type: 'selection.addMany',
      variantIds: ['a', 'b', 'c'],
    })
    expect(
      getRowToggle({...base, selectedIds: new Set(['c']), anchor, variantId: 'c', shiftKey: true})
        .event,
    ).toEqual({type: 'selection.removeMany', variantIds: ['a', 'b', 'c']})
  })

  it('never extends a range from another group', () => {
    const anchor = {setKey: 'published', variantId: 'a'}
    expect(getRowToggle({...base, anchor, variantId: 'c', shiftKey: true}).event).toEqual({
      type: 'selection.toggle',
      variantId: 'c',
    })
  })
})
