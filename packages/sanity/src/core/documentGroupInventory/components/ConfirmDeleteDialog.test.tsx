import {type MultipleMutationResult} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'
import {createActor, fromObservable, fromPromise} from 'xstate'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {deletionMachine, type ReferringDocuments} from '../machines/deletionMachine'
import {ConfirmDeleteDialog} from './ConfirmDeleteDialog'

vi.mock('../../../ui-components/dialog/Dialog', () => ({
  Dialog: ({
    children,
    header,
    footer,
  }: {
    children: ReactNode
    header?: ReactNode
    footer?: {confirmButton?: {text?: string}}
  }) => (
    <div>
      <h1>{header}</h1>
      {children}
      {footer?.confirmButton?.text ? (
        <button type="button">{footer.confirmButton.text}</button>
      ) : null}
    </div>
  ),
}))

const VersionsPreviewList = vi.fn(function VersionsPreviewList({
  documentVersions,
}: {
  documentType: string
  documentVersions: string[]
}) {
  return <div data-testid="versions-preview">{documentVersions.join(',')}</div>
})

function createDeletionActor(ids: string[]) {
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
  actor.send({type: 'selection.changed', selectedIds: new Set(ids)})
  return actor
}

describe('ConfirmDeleteDialog', () => {
  it('lists and counts the deletion machine ids, not a broader selection', async () => {
    const wrapper = await createTestProvider()
    const deletionRef = createDeletionActor(['drafts.foo'])

    render(
      <ConfirmDeleteDialog
        documentId="foo"
        documentType="author"
        deletionRef={deletionRef}
        excludedCount={0}
        pendingCount={0}
        portalElementName="default"
        components={{
          DocTitle: () => <span>Title</span>,
          ReferencePreviewLink: () => null,
          VersionsPreviewList,
        }}
      />,
      {wrapper},
    )

    expect(VersionsPreviewList).toHaveBeenCalledWith(
      expect.objectContaining({documentVersions: ['drafts.foo']}),
      undefined,
    )
    expect(screen.getByTestId('versions-preview')).toHaveTextContent('drafts.foo')
    expect(screen.getByRole('button', {name: 'Delete (1)'})).toBeInTheDocument()
  })

  it('lists only the allowed subset when the machine holds fewer ids than were selected', async () => {
    const wrapper = await createTestProvider()
    const deletionRef = createDeletionActor(['drafts.foo', 'foo'])
    deletionRef.send({type: 'selection.changed', selectedIds: new Set(['drafts.foo'])})

    render(
      <ConfirmDeleteDialog
        documentId="foo"
        documentType="author"
        deletionRef={deletionRef}
        excludedCount={0}
        pendingCount={0}
        portalElementName="default"
        components={{
          DocTitle: () => <span>Title</span>,
          ReferencePreviewLink: () => null,
          VersionsPreviewList,
        }}
      />,
      {wrapper},
    )

    expect(screen.getByTestId('versions-preview')).toHaveTextContent('drafts.foo')
    expect(screen.getByTestId('versions-preview')).not.toHaveTextContent('drafts.foo,foo')
    expect(screen.getByRole('button', {name: 'Delete (1)'})).toBeInTheDocument()
    expect(screen.queryByTestId('excluded-count')).not.toBeInTheDocument()
  })

  it('names the rows the configuration left out', async () => {
    const wrapper = await createTestProvider()
    const deletionRef = createDeletionActor(['drafts.foo'])

    render(
      <ConfirmDeleteDialog
        documentId="foo"
        documentType="author"
        deletionRef={deletionRef}
        excludedCount={4}
        pendingCount={0}
        portalElementName="default"
        components={{
          DocTitle: () => <span>Title</span>,
          ReferencePreviewLink: () => null,
          VersionsPreviewList,
        }}
      />,
      {wrapper},
    )

    expect(screen.getByTestId('excluded-count')).toHaveTextContent(
      '4 selected versions will not be deleted. This studio does not allow deleting them.',
    )
    expect(screen.queryByTestId('pending-count')).not.toBeInTheDocument()
  })

  it('blames the studio configuration for nothing while a row is still resolving', async () => {
    const wrapper = await createTestProvider()
    const deletionRef = createDeletionActor(['drafts.foo'])

    render(
      <ConfirmDeleteDialog
        documentId="foo"
        documentType="author"
        deletionRef={deletionRef}
        excludedCount={0}
        pendingCount={1}
        portalElementName="default"
        components={{
          DocTitle: () => <span>Title</span>,
          ReferencePreviewLink: () => null,
          VersionsPreviewList,
        }}
      />,
      {wrapper},
    )

    expect(screen.getByTestId('pending-count')).toHaveTextContent(
      '1 selected version will not be deleted. This studio is still checking whether deleting it is allowed.',
    )
    expect(screen.queryByTestId('excluded-count')).not.toBeInTheDocument()
  })

  it('states both reasons when the configuration and an unresolved row each leave rows out', async () => {
    const wrapper = await createTestProvider()
    const deletionRef = createDeletionActor(['drafts.foo'])

    render(
      <ConfirmDeleteDialog
        documentId="foo"
        documentType="author"
        deletionRef={deletionRef}
        excludedCount={2}
        pendingCount={3}
        portalElementName="default"
        components={{
          DocTitle: () => <span>Title</span>,
          ReferencePreviewLink: () => null,
          VersionsPreviewList,
        }}
      />,
      {wrapper},
    )

    expect(screen.getByTestId('excluded-count')).toHaveTextContent(
      '2 selected versions will not be deleted. This studio does not allow deleting them.',
    )
    expect(screen.getByTestId('pending-count')).toHaveTextContent(
      '3 selected versions will not be deleted. This studio is still checking whether deleting them is allowed.',
    )
  })
})
