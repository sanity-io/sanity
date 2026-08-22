import {type MultipleMutationResult} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {type ComponentProps, type ReactNode} from 'react'
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

  it('fails if the preview is given more ids than the deletion machine holds', async () => {
    const wrapper = await createTestProvider()
    const deletionRef = createDeletionActor(['drafts.foo'])
    const previewCalls: string[][] = []

    function CapturingPreview({
      documentVersions,
    }: ComponentProps<typeof VersionsPreviewList> & {documentVersions: string[]}) {
      previewCalls.push(documentVersions)
      return <div data-testid="versions-preview">{documentVersions.join(',')}</div>
    }

    render(
      <ConfirmDeleteDialog
        documentId="foo"
        documentType="author"
        deletionRef={deletionRef}
        portalElementName="default"
        components={{
          DocTitle: () => <span>Title</span>,
          ReferencePreviewLink: () => null,
          VersionsPreviewList: CapturingPreview,
        }}
      />,
      {wrapper},
    )

    expect(previewCalls[0]).toEqual(['drafts.foo'])
    expect(previewCalls[0]).not.toEqual(['drafts.foo', 'foo'])
  })
})
