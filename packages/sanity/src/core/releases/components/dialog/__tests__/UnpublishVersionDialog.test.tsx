import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config/defineConfig'
import {useDocumentOperation} from '../../../../hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../../../../hooks/useDocumentOperationEvent'
import {UnpublishVersionDialog} from '../UnpublishVersionDialog'

const {toastPush} = vi.hoisted(() => ({toastPush: vi.fn()}))

vi.mock('@sanity/ui/toast', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => ({push: toastPush})),
}))

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(),
}))

vi.mock('../../../../hooks/useDocumentOperationEvent', () => ({
  useDocumentOperationEvent: vi.fn(),
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

vi.mock('../../../../preview/useValuePreview', () => ({
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

const VERSION_ID = 'versions.rSummer.my-doc'
const CONFIRM = 'unpublish-dialog.action.unpublish'
const unpublishExecute = vi.fn()

function mockUnpublishOperation(disabled: false | 'ALREADY_UNPUBLISHED' = false) {
  vi.mocked(useDocumentOperation).mockReturnValue({
    unpublish: {disabled, execute: unpublishExecute},
  } as unknown as ReturnType<typeof useDocumentOperation>)
}

function operationEvent(options: {type: 'success' | 'error'; versionId?: string}) {
  return {
    type: options.type,
    op: 'unpublish',
    id: 'my-doc',
    ...(options.type === 'error' ? {error: new Error('nope')} : {}),
    idPair: {
      publishedId: 'my-doc',
      draftId: 'drafts.my-doc',
      versionId: options.versionId ?? VERSION_ID,
    },
  } as unknown as ReturnType<typeof useDocumentOperationEvent>
}

async function renderDialog(
  props: {
    documentVersionId?: string
    onClose?: () => void
    showCompletionToasts?: boolean
  } = {},
) {
  const onClose = props.onClose ?? vi.fn()
  // A fresh element per render: re-rendering the identical element lets React bail out of the
  // subtree, so the component would never observe a newly mocked operation event.
  const element = () => (
    <UnpublishVersionDialog
      onClose={onClose}
      documentVersionId={props.documentVersionId ?? VERSION_ID}
      documentType="testDoc"
      showCompletionToasts={props.showCompletionToasts}
    />
  )
  const wrapper = await createTestProvider({config})
  const result = render(element(), {wrapper})
  return {...result, rerender: () => result.rerender(element())}
}

beforeEach(() => {
  toastPush.mockClear()
  unpublishExecute.mockClear()
  vi.mocked(useDocumentOperation).mockReset()
  vi.mocked(useDocumentOperationEvent).mockReturnValue(undefined)
  mockUnpublishOperation()
})

describe('UnpublishVersionDialog', () => {
  it('uses the release encoded in the version id as the operation target', async () => {
    await renderDialog()

    expect(useDocumentOperation).toHaveBeenCalledWith('my-doc', 'testDoc', 'rSummer')
  })

  it('does not execute and disables confirm when the operation is disabled', async () => {
    mockUnpublishOperation('ALREADY_UNPUBLISHED')

    await renderDialog()

    expect(screen.getByRole('button', {name: CONFIRM})).toBeDisabled()
    expect(unpublishExecute).not.toHaveBeenCalled()
  })

  it('disables confirm for an id without a release, rather than unpublishing the document', async () => {
    await renderDialog({documentVersionId: 'drafts.my-doc'})

    expect(screen.getByRole('button', {name: CONFIRM})).toBeDisabled()
  })

  it('stays open until the unpublish operation reports success', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({onClose})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM}))

    expect(unpublishExecute).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    vi.mocked(useDocumentOperationEvent).mockReturnValue(operationEvent({type: 'success'}))
    rerender()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(toastPush).toHaveBeenCalledWith(expect.objectContaining({status: 'success'}))
  })

  it('ignores operation events for another bundle of the same document', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({onClose})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM}))

    vi.mocked(useDocumentOperationEvent).mockReturnValue(
      operationEvent({type: 'success', versionId: 'versions.rWinter.my-doc'}),
    )
    rerender()

    await waitFor(() => expect(screen.getByRole('button', {name: CONFIRM})).toBeDisabled())
    expect(onClose).not.toHaveBeenCalled()
    expect(toastPush).not.toHaveBeenCalled()
  })

  it('reports a failed unpublish instead of closing silently', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({onClose})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM}))
    expect(toastPush).not.toHaveBeenCalled()

    vi.mocked(useDocumentOperationEvent).mockReturnValue(operationEvent({type: 'error'}))
    rerender()

    await waitFor(() =>
      expect(toastPush).toHaveBeenCalledWith(expect.objectContaining({status: 'error'})),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('leaves completion toasts to DocumentOperationResults when opted out', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({onClose, showCompletionToasts: false})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM}))

    vi.mocked(useDocumentOperationEvent).mockReturnValue(operationEvent({type: 'success'}))
    rerender()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(toastPush).not.toHaveBeenCalled()
  })
})
