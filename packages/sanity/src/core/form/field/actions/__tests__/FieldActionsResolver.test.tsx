import {defineType} from '@sanity/types'
import {act, render} from '@testing-library/react'
import {useSyncExternalStore} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {defineDocumentFieldAction} from '../../../../config/document/fieldActions/define'
import {type DocumentFieldActionNode} from '../../../../config/document/fieldActions/types'
import {createSchema} from '../../../../schema/createSchema'
import {FieldActionsResolver} from '../FieldActionsResolver'

const EMPTY_PATH: never[] = []

const schemaType = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'page',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    }),
  ],
}).get('page')!

// Stands in for studio state a field action reads through a hook (the router state, the
// document pane, a form value): a change to it re-renders every `FieldAction` that reads it.
let tick = 0
const listeners = new Set<() => void>()
const tickStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot: () => tick,
  bump: () => {
    tick++
    for (const listener of listeners) listener()
  },
}

// Written the way a field action in a studio config or a plugin is written: an object method
// with an inline `onAction`. Nothing memoizes it (React Compiler does not compile object methods,
// and consumer code is not compiled at all), so every render returns a new node with a new
// `onAction` function.
const unmemoizedAction = defineDocumentFieldAction({
  name: 'test/unmemoized',
  useAction({documentId}) {
    const current = useSyncExternalStore(tickStore.subscribe, tickStore.getSnapshot)
    return {
      type: 'action',
      title: `Open ${documentId}`,
      onAction() {
        void current
      },
    }
  },
})

function noop() {
  // no-op
}

const stableAction = defineDocumentFieldAction({
  name: 'test/stable',
  useAction({documentId}) {
    useSyncExternalStore(tickStore.subscribe, tickStore.getSnapshot)
    // A new object every render, but deep-equal to the previous one
    return {type: 'action', title: `Open ${documentId}`, onAction: noop}
  },
})

// Hoisted like `DocumentPaneProvider`'s memoized `fieldActions`: a new array would remount every
// `FieldAction` (fresh state) instead of re-rendering it.
const UNMEMOIZED_ACTIONS = [unmemoizedAction]
const STABLE_ACTIONS = [stableAction]

function Harness(props: {
  actions: Parameters<typeof FieldActionsResolver>[0]['actions']
  onActions: (nodes: DocumentFieldActionNode[]) => void
}) {
  const {actions, onActions} = props
  return (
    <FieldActionsResolver
      actions={actions}
      documentId="page-1"
      documentType="page"
      onActions={onActions}
      path={EMPTY_PATH}
      schemaType={schemaType}
    />
  )
}

describe('FieldActionsResolver', () => {
  it('settles when an unmemoized field action re-renders', () => {
    const onActions = vi.fn()
    render(<Harness actions={UNMEMOIZED_ACTIONS} onActions={onActions} />)
    expect(onActions).toHaveBeenLastCalledWith([
      expect.objectContaining({type: 'action', title: 'Open page-1'}),
    ])

    // State the action reads changes (in Presentation: the router state, when the preview iframe
    // loads). The action returns a new node, and the resolver must publish it once rather than
    // re-render itself until React throws "Too many re-renders".
    expect(() => act(() => tickStore.bump())).not.toThrow()

    expect(onActions).toHaveBeenCalledTimes(2)
    expect(onActions).toHaveBeenLastCalledWith([
      expect.objectContaining({type: 'action', title: 'Open page-1'}),
    ])
  })

  it('does not republish a node that is deep-equal to the previous one', () => {
    const onActions = vi.fn()
    render(<Harness actions={STABLE_ACTIONS} onActions={onActions} />)
    expect(onActions).toHaveBeenCalledTimes(1)

    act(() => tickStore.bump())

    expect(onActions).toHaveBeenCalledTimes(1)
  })
})
