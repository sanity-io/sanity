import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config'
import {useDocumentOperation} from '../../../../hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../../../../hooks/useDocumentOperationEvent'
import {UnpublishVersionDialog} from '../UnpublishVersionDialog'

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(() => ({unpublish: {execute: vi.fn()}})),
}))

vi.mock('../../../../hooks/useDocumentOperationEvent', () => ({
  useDocumentOperationEvent: vi.fn(() => undefined),
}))

vi.mock('../../../store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({data: []})),
}))

vi.mock('../../../store/useArchivedReleases', () => ({
  useArchivedReleases: vi.fn(() => ({data: []})),
}))

vi.mock('../../../../preview/components/Preview', () => ({
  Preview: () => null,
}))

vi.mock('../../../../preview', () => ({
  useValuePreview: vi.fn(() => ({value: {title: 'Test document'}})),
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

describe('UnpublishVersionDialog', () => {
  beforeEach(() => {
    vi.mocked(useDocumentOperation).mockClear()
    vi.mocked(useDocumentOperationEvent).mockReturnValue(undefined)
    vi.mocked(useDocumentOperation).mockReturnValue({
      unpublish: {disabled: false, execute: vi.fn()},
    } as ReturnType<typeof useDocumentOperation>)
  })

  it('uses useDocumentOperation with the release id for version unpublish', async () => {
    const wrapper = await createTestProvider({config})
    render(
      <UnpublishVersionDialog
        onClose={vi.fn()}
        documentVersionId="versions.rSummer.my-doc"
        documentType="testDoc"
      />,
      {wrapper},
    )

    await waitFor(() =>
      expect(useDocumentOperation).toHaveBeenCalledWith('my-doc', 'testDoc', 'rSummer'),
    )
  })

  it('disables confirm when unpublish operation is disabled', async () => {
    vi.mocked(useDocumentOperation).mockReturnValue({
      unpublish: {disabled: 'ALREADY_UNPUBLISHED', execute: vi.fn()},
    } as ReturnType<typeof useDocumentOperation>)

    const wrapper = await createTestProvider({config})
    render(
      <UnpublishVersionDialog
        onClose={vi.fn()}
        documentVersionId="versions.rSummer.my-doc"
        documentType="testDoc"
      />,
      {wrapper},
    )

    await waitFor(() =>
      expect(
        screen.getByRole('button', {name: 'unpublish-dialog.action.unpublish'}),
      ).toBeDisabled(),
    )
  })

  it('ignores unpublish events for other versions on the same published document', async () => {
    const onClose = vi.fn()
    const wrapper = await createTestProvider({config})
    const dialogProps = {
      onClose,
      documentVersionId: 'versions.rSummer.my-doc',
      documentType: 'testDoc',
    } as const

    const {rerender} = render(<UnpublishVersionDialog {...dialogProps} />, {wrapper})

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', {name: 'unpublish-dialog.action.unpublish'}))

    vi.mocked(useDocumentOperationEvent).mockReturnValue({
      type: 'success',
      op: 'unpublish',
      id: 'my-doc',
      idPair: {
        publishedId: 'my-doc',
        draftId: 'drafts.my-doc',
        versionId: 'versions.other.my-doc',
      },
    })

    rerender(<UnpublishVersionDialog {...dialogProps} />)

    await waitFor(() => expect(useDocumentOperationEvent).toHaveBeenCalledWith('my-doc', 'testDoc'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes when unpublish succeeds for the matching version', async () => {
    const onClose = vi.fn()
    const wrapper = await createTestProvider({config})
    const dialogProps = {
      onClose,
      documentVersionId: 'versions.rSummer.my-doc',
      documentType: 'testDoc',
    } as const

    const {rerender} = render(<UnpublishVersionDialog {...dialogProps} />, {wrapper})

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', {name: 'unpublish-dialog.action.unpublish'}))

    vi.mocked(useDocumentOperationEvent).mockReturnValue({
      type: 'success',
      op: 'unpublish',
      id: 'my-doc',
      idPair: {
        publishedId: 'my-doc',
        draftId: 'drafts.my-doc',
        versionId: 'versions.rSummer.my-doc',
      },
    })

    rerender(<UnpublishVersionDialog {...dialogProps} />)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
