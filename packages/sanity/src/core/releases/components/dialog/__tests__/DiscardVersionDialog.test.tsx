import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config/defineConfig'
import {useDocumentOperation} from '../../../../hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../../../../hooks/useDocumentOperationEvent'
import {useTargetDocumentState} from '../../../../hooks/useTargetDocumentState'
import {DiscardVersionDialog} from '../DiscardVersionDialog'

const {previewSpy, toastPush} = vi.hoisted(() => ({previewSpy: vi.fn(), toastPush: vi.fn()}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useToast: () => ({push: toastPush}),
}))

// Capture the props the document preview is rendered with so we can assert the
// perspective the dialog resolves it under.
vi.mock('../../../../preview/components/Preview', () => ({
  Preview: (props: Record<string, unknown>) => {
    previewSpy(props)
    return null
  },
}))

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(),
}))

vi.mock('../../../../hooks/useDocumentOperationEvent', () => ({
  useDocumentOperationEvent: vi.fn(),
}))

// The target document lookup needs the document preview store (mocked away above), so it is
// mocked per test. The default resolves to the base draft/published pair (no scopeId).
vi.mock('../../../../hooks/useTargetDocumentState', async (importOriginal) => ({
  ...(await importOriginal()),
  useTargetDocumentState: vi.fn(),
}))

const READY_BASE_TARGET = {
  status: 'ready',
  targetDocument: undefined,
  scopeId: undefined,
  variant: undefined,
  publishedSibling: undefined,
} as const

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

const discardExecute = vi.fn()

function mockDiscardOperation(disabled: false | 'NO_CHANGES' = false) {
  vi.mocked(useDocumentOperation).mockReturnValue({
    discardChanges: {disabled, execute: discardExecute},
  } as unknown as ReturnType<typeof useDocumentOperation>)
}

async function renderDialog(props: {
  versionId: string
  isGoingToUnpublish?: boolean
  onClose?: () => void
}) {
  const onClose = props.onClose ?? vi.fn()
  // A fresh element per render: re-rendering the identical element lets React bail out of the
  // subtree, so the component would never observe a newly mocked operation event.
  const element = () => (
    <DiscardVersionDialog
      onClose={onClose}
      versionId={props.versionId}
      documentType="testDoc"
      fromPerspective="drafts"
      isGoingToUnpublish={props.isGoingToUnpublish ?? false}
    />
  )
  const wrapper = await createTestProvider({config})
  const result = render(element(), {wrapper})
  return {...result, rerender: () => result.rerender(element())}
}

const CONFIRM_RELEASE = 'discard-version-dialog.title-release'

beforeEach(() => {
  previewSpy.mockClear()
  toastPush.mockClear()
  discardExecute.mockClear()
  vi.mocked(useDocumentOperation).mockReset()
  vi.mocked(useDocumentOperationEvent).mockReturnValue(undefined)
  vi.mocked(useTargetDocumentState).mockReturnValue(READY_BASE_TARGET)
  mockDiscardOperation()
})

describe('DiscardVersionDialog preview perspective', () => {
  it('previews a discarded draft under the drafts perspective', async () => {
    await renderDialog({versionId: 'drafts.my-doc'})
    await waitFor(() => expect(previewSpy).toHaveBeenCalled())
    expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({perspectiveStack: ['drafts']}),
    )
  })

  it('previews a discarded release version under its release perspective', async () => {
    await renderDialog({versionId: 'versions.rSummer.my-doc'})
    await waitFor(() => expect(previewSpy).toHaveBeenCalled())
    expect(previewSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({perspectiveStack: ['rSummer']}),
    )
  })

  it('previews the published document (empty perspective) when unpublishing', async () => {
    await renderDialog({versionId: 'drafts.my-doc', isGoingToUnpublish: true})
    await waitFor(() => expect(previewSpy).toHaveBeenCalled())
    expect(previewSpy).toHaveBeenLastCalledWith(expect.objectContaining({perspectiveStack: []}))
  })
})

describe('DiscardVersionDialog operation target', () => {
  it('targets the release encoded in the version id, not the selected perspective', async () => {
    // A variant of another bundle is selected while the dialog is opened for a release version.
    vi.mocked(useTargetDocumentState).mockReturnValue({
      status: 'ready',
      targetDocument: undefined,
      scopeId: 'someVariantScope',
      variant: {_id: 'variant-doc'},
      publishedSibling: undefined,
    } as unknown as ReturnType<typeof useTargetDocumentState>)

    await renderDialog({versionId: 'versions.rSummer.my-doc'})

    expect(useDocumentOperation).toHaveBeenCalledWith('my-doc', 'testDoc', 'rSummer')
  })

  it('follows the selected perspective when discarding a draft', async () => {
    await renderDialog({versionId: 'drafts.my-doc'})

    expect(useDocumentOperation).toHaveBeenCalledWith('my-doc', 'testDoc', undefined)
  })

  it('disables confirm while the perspective target is still resolving for a draft', async () => {
    vi.mocked(useTargetDocumentState).mockReturnValue({status: 'resolving'})

    await renderDialog({versionId: 'drafts.my-doc'})

    expect(screen.getByRole('button', {name: 'discard-version-dialog.title-draft'})).toBeDisabled()
  })

  it('confirms a release version even while the perspective target is resolving', async () => {
    vi.mocked(useTargetDocumentState).mockReturnValue({status: 'resolving'})

    await renderDialog({versionId: 'versions.rSummer.my-doc'})

    expect(screen.getByRole('button', {name: CONFIRM_RELEASE})).toBeEnabled()
  })
})

describe('DiscardVersionDialog completion', () => {
  it('does not execute and disables confirm when the operation is disabled', async () => {
    mockDiscardOperation('NO_CHANGES')

    await renderDialog({versionId: 'versions.rSummer.my-doc'})

    expect(screen.getByRole('button', {name: CONFIRM_RELEASE})).toBeDisabled()
    expect(discardExecute).not.toHaveBeenCalled()
  })

  it('stays open until the discard operation reports success', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({versionId: 'versions.rSummer.my-doc', onClose})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM_RELEASE}))

    expect(discardExecute).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    vi.mocked(useDocumentOperationEvent).mockReturnValue({
      type: 'success',
      op: 'discardChanges',
      id: 'my-doc',
      idPair: {
        publishedId: 'my-doc',
        draftId: 'drafts.my-doc',
        versionId: 'versions.rSummer.my-doc',
      },
    })
    rerender()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('ignores operation events for another bundle of the same document', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({versionId: 'versions.rSummer.my-doc', onClose})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM_RELEASE}))

    vi.mocked(useDocumentOperationEvent).mockReturnValue({
      type: 'success',
      op: 'discardChanges',
      id: 'my-doc',
      idPair: {
        publishedId: 'my-doc',
        draftId: 'drafts.my-doc',
        versionId: 'versions.rWinter.my-doc',
      },
    })
    rerender()

    await waitFor(() => expect(screen.getByRole('button', {name: CONFIRM_RELEASE})).toBeDisabled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('reports a failed discard instead of closing silently', async () => {
    const onClose = vi.fn()
    const {rerender} = await renderDialog({versionId: 'versions.rSummer.my-doc', onClose})

    await userEvent.click(screen.getByRole('button', {name: CONFIRM_RELEASE}))
    expect(toastPush).not.toHaveBeenCalled()

    vi.mocked(useDocumentOperationEvent).mockReturnValue({
      type: 'error',
      op: 'discardChanges',
      id: 'my-doc',
      error: new Error('nope'),
      idPair: {
        publishedId: 'my-doc',
        draftId: 'drafts.my-doc',
        versionId: 'versions.rSummer.my-doc',
      },
    })
    rerender()

    await waitFor(() =>
      expect(toastPush).toHaveBeenCalledWith(expect.objectContaining({status: 'error'})),
    )
    expect(onClose).toHaveBeenCalled()
  })
})
