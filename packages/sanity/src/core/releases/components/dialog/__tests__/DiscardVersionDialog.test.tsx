import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config'
import {useDocumentOperation} from '../../../../hooks/useDocumentOperation'
import {DiscardVersionDialog} from '../DiscardVersionDialog'

const {previewSpy} = vi.hoisted(() => ({previewSpy: vi.fn()}))

// Capture the props the document preview is rendered with so we can assert the
// perspective the dialog resolves it under.
vi.mock('../../../../preview', () => ({
  Preview: (props: Record<string, unknown>) => {
    previewSpy(props)
    return null
  },
}))

const mockDiscardChangesExecute = vi.fn()

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(() => ({discardChanges: {execute: mockDiscardChangesExecute}})),
}))

// The target document lookup needs the document preview store (mocked away above); these tests
// only assert the preview perspective, so the target resolves to a ready state with no document
// (base draft/published pair semantics, no scopeId).
vi.mock('../../../../hooks/useTargetDocumentState', async (importOriginal) => ({
  ...(await importOriginal()),
  useTargetDocumentState: vi.fn(() => ({
    status: 'ready',
    targetDocument: undefined,
    scopeId: undefined,
    variant: undefined,
    publishedSibling: undefined,
  })),
}))

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
  schema: {
    types: [
      defineType({
        name: 'testDoc',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  },
})

async function renderDialog(props: {documentId: string; isGoingToUnpublish?: boolean}) {
  const wrapper = await createTestProvider({config})
  render(
    <DiscardVersionDialog
      onClose={vi.fn()}
      documentId={props.documentId}
      documentType="testDoc"
      fromPerspective="drafts"
      isGoingToUnpublish={props.isGoingToUnpublish ?? false}
    />,
    {wrapper},
  )
  await waitFor(() => expect(previewSpy).toHaveBeenCalled())
}

describe('DiscardVersionDialog preview perspective', () => {
  beforeEach(() => {
    previewSpy.mockClear()
    mockDiscardChangesExecute.mockClear()
    vi.mocked(useDocumentOperation).mockClear()
  })

  it('previews a discarded draft under the drafts perspective', async () => {
    await renderDialog({documentId: 'drafts.my-doc'})
    expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({perspectiveStack: ['drafts']}),
    )
    expect(useDocumentOperation).toHaveBeenCalledWith('my-doc', 'testDoc', undefined)
  })

  it('previews a discarded release version under its release perspective', async () => {
    await renderDialog({documentId: 'versions.rSummer.my-doc'})
    expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({perspectiveStack: ['rSummer']}),
    )
  })

  it('previews the published document (empty perspective) when unpublishing', async () => {
    await renderDialog({documentId: 'drafts.my-doc', isGoingToUnpublish: true})
    expect(previewSpy).toHaveBeenLastCalledWith(expect.objectContaining({perspectiveStack: []}))
  })

  it('disables confirm when discard operation is disabled', async () => {
    vi.mocked(useDocumentOperation).mockReturnValue({
      discardChanges: {disabled: 'NO_CHANGES', execute: mockDiscardChangesExecute},
    } as ReturnType<typeof useDocumentOperation>)

    const wrapper = await createTestProvider({config})
    render(
      <DiscardVersionDialog
        onClose={vi.fn()}
        documentId="versions.rSummer.my-doc"
        documentType="testDoc"
        fromPerspective="drafts"
        isGoingToUnpublish={false}
      />,
      {wrapper},
    )

    await waitFor(() =>
      expect(
        screen.getByRole('button', {name: 'discard-version-dialog.title-release'}),
      ).toBeDisabled(),
    )
  })
})
