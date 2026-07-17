import {defineType} from '@sanity/types'
import {render, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config'
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

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(() => ({discardChanges: {execute: vi.fn()}})),
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

vi.mock('../../../hooks/useVersionOperations', () => ({
  useVersionOperations: vi.fn(() => ({discardVersion: vi.fn()})),
}))

vi.mock('../../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => ({selectedPerspective: 'drafts'})),
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
  })

  it('previews a discarded draft under the drafts perspective', async () => {
    await renderDialog({documentId: 'drafts.my-doc'})
    expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({perspectiveStack: ['drafts']}),
    )
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
})
