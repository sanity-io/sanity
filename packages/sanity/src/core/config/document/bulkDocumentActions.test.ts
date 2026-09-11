import {describe, expect, it} from 'vitest'

import {type DocumentActionComponent, type DocumentActionKeys} from './actions'
import {
  partitionBulkActionSelection,
  resolveDocumentActionIds,
  restrictIdsToConfiguredAction,
} from './bulkDocumentActions'

const DELETE_IDS: ReadonlySet<keyof DocumentActionKeys> = new Set(['delete'])
const DUPLICATE_IDS: ReadonlySet<keyof DocumentActionKeys> = new Set(['duplicate'])
const EMPTY_IDS: ReadonlySet<keyof DocumentActionKeys> = new Set()

const deleteAction: DocumentActionComponent = Object.assign(() => null, {action: 'delete' as const})
const scheduleAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'schedule' as const,
})
const editScheduleAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'schedule' as const,
})
const discardVersionAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'discardVersion' as const,
})
const unnamedAction: DocumentActionComponent = () => null

describe('resolveDocumentActionIds', () => {
  it('collects configured action ids and skips components without one', () => {
    expect(resolveDocumentActionIds([deleteAction, unnamedAction, discardVersionAction])).toEqual(
      new Set(['delete', 'discardVersion']),
    )
  })

  it('records a shared id once when two components claim it', () => {
    expect(
      resolveDocumentActionIds([scheduleAction, editScheduleAction, discardVersionAction]),
    ).toEqual(new Set(['schedule', 'discardVersion']))
  })
})

describe('partitionBulkActionSelection', () => {
  it('hides the control when the selection is empty', () => {
    const result = partitionBulkActionSelection({
      items: [],
      actionId: 'delete',
      getActionIds: () => DELETE_IDS,
    })

    expect(result).toEqual({included: [], excluded: [], shouldShowControl: false})
  })

  it('includes every row and shows the control when all rows have the id', () => {
    const items = ['draft', 'published']
    const result = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: () => DELETE_IDS,
    })

    expect(result).toEqual({included: items, excluded: [], shouldShowControl: true})
  })

  it('excludes every row and hides the control when no row has the id', () => {
    const items = ['version', 'scheduled-draft']
    const result = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: (item) => (item === 'version' ? EMPTY_IDS : DUPLICATE_IDS),
    })

    expect(result).toEqual({included: [], excluded: items, shouldShowControl: false})
  })

  it('shows the control and keeps only allowed rows for a mixed selection', () => {
    const items = ['draft', 'version', 'published']
    const result = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: (item) => (item === 'version' ? EMPTY_IDS : DELETE_IDS),
    })

    expect(result).toEqual({
      included: ['draft', 'published'],
      excluded: ['version'],
      shouldShowControl: true,
    })
  })

  it('treats a null action-id set as the id being absent', () => {
    const items = ['unready']
    const result = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: () => null,
    })

    expect(result).toEqual({included: [], excluded: items, shouldShowControl: false})
  })

  it('shows the control when some rows are ready and allowed and others are unready', () => {
    const items = ['draft', 'unready']
    const result = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: (item) => (item === 'unready' ? null : DELETE_IDS),
    })

    expect(result).toEqual({
      included: ['draft'],
      excluded: ['unready'],
      shouldShowControl: true,
    })
  })

  it('fails the hide assertion when the all-denied gate is forced open', () => {
    const items = ['version', 'scheduled-draft']
    const denied = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: () => EMPTY_IDS,
    })
    expect(denied.shouldShowControl).toBe(false)

    const forcedOpen = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: () => DELETE_IDS,
    })
    expect(forcedOpen.shouldShowControl).toBe(true)
    expect(forcedOpen.included).toEqual(items)
  })

  it('fails the exclude assertion when the mixed-selection gate is forced open', () => {
    const items = ['draft', 'version']
    const mixed = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: (item) => (item === 'version' ? EMPTY_IDS : DELETE_IDS),
    })
    expect(mixed.excluded).toEqual(['version'])

    const forcedOpen = partitionBulkActionSelection({
      items,
      actionId: 'delete',
      getActionIds: () => DELETE_IDS,
    })
    expect(forcedOpen.excluded).toEqual([])
    expect(forcedOpen.included).toEqual(items)
  })
})

describe('restrictIdsToConfiguredAction', () => {
  it('keeps every requested id when all of them are allowed', () => {
    expect(
      restrictIdsToConfiguredAction(['drafts.foo', 'foo'], new Set(['drafts.foo', 'foo'])),
    ).toEqual(['drafts.foo', 'foo'])
  })

  it('drops requested ids that are not in the allowed set', () => {
    expect(
      restrictIdsToConfiguredAction(
        ['drafts.foo', 'versions.rActive.foo'],
        new Set(['drafts.foo']),
      ),
    ).toEqual(['drafts.foo'])
  })

  it('returns an empty list when no requested id is allowed', () => {
    expect(
      restrictIdsToConfiguredAction(['versions.rActive.foo'], new Set(['drafts.foo'])),
    ).toEqual([])
  })

  it('fails the exclude assertion when the allowed set is forced open', () => {
    const requested = ['drafts.foo', 'versions.rActive.foo']
    const denied = restrictIdsToConfiguredAction(requested, new Set(['drafts.foo']))
    expect(denied).toEqual(['drafts.foo'])

    const forcedOpen = restrictIdsToConfiguredAction(requested, new Set(requested))
    expect(forcedOpen).toEqual(requested)
  })
})
