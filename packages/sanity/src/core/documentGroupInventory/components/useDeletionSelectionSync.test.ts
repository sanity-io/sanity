import {type MultipleMutationResult} from '@sanity/client'
import {renderHook} from '@testing-library/react'
import {of} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {createActor, fromObservable, fromPromise} from 'xstate'

import {deletionMachine, type ReferringDocuments} from '../machines/deletionMachine'
import {useDeletionSelectionSync} from './useDeletionSelectionSync'

function createDeletionActor() {
  const actor = createActor(
    deletionMachine.provide({
      actors: {
        referringDocuments: fromObservable<ReferringDocuments, unknown>(() =>
          of({
            isLoading: false,
            totalCount: 0,
            projectIds: [],
            datasetNames: [],
            hasUnknownDatasetNames: false,
          }),
        ),
        deleteVariants: fromPromise<MultipleMutationResult, {ids: string[]}>(async () => ({
          transactionId: 'stub',
          documentIds: [],
          results: [],
        })),
      },
    }),
    {input: {}},
  )
  actor.start()
  return actor
}

function mountSelectionSync(deletableIds: string[]) {
  const deletionRef = createDeletionActor()
  const allowlistRef = {current: new Set<string>()}

  const {rerender} = renderHook(
    (props: {deletableIds: string[]; isDeletionActive: boolean}) =>
      useDeletionSelectionSync({deletionRef, allowlistRef, ...props}),
    {initialProps: {deletableIds, isDeletionActive: false}},
  )

  return {
    deletionRef,
    allowlistRef,
    rerender,
    ids: () => deletionRef.getSnapshot().context.ids,
    allowlist: () => [...allowlistRef.current],
  }
}

describe('useDeletionSelectionSync', () => {
  it('sends the deletable ids and records them on the allowlist', () => {
    const sync = mountSelectionSync(['drafts.foo', 'foo'])

    expect(sync.ids()).toEqual(['drafts.foo', 'foo'])
    expect(sync.allowlist()).toEqual(['drafts.foo', 'foo'])
  })

  it('freezes the ids and the allowlist together while the dialog is open', () => {
    const sync = mountSelectionSync(['drafts.foo', 'foo', 'versions.rActive.foo'])

    sync.rerender({deletableIds: ['drafts.foo', 'foo'], isDeletionActive: true})

    expect(sync.ids()).toEqual(['drafts.foo', 'foo', 'versions.rActive.foo'])
    expect(sync.allowlist()).toEqual(['drafts.foo', 'foo', 'versions.rActive.foo'])
  })

  it('replays the update the open dialog dropped once the dialog closes', () => {
    const sync = mountSelectionSync(['drafts.foo', 'foo', 'versions.rActive.foo'])

    sync.rerender({deletableIds: ['drafts.foo', 'foo'], isDeletionActive: true})
    sync.rerender({deletableIds: ['drafts.foo', 'foo'], isDeletionActive: false})

    expect(sync.ids()).toEqual(['drafts.foo', 'foo'])
    expect(sync.allowlist()).toEqual(['drafts.foo', 'foo'])
  })
})
