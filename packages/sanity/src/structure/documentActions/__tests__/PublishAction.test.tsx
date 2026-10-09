import {type SanityDocument, type ValidationMarker} from '@sanity/types'
import {act, render, renderHook, screen, waitFor} from '@testing-library/react'
import deepCompare from 'react-fast-compare'
import {
  type DocumentActionProps,
  type EditStateFor,
  type TargetDocumentState,
  useDocumentOperation,
  useDocumentOperationEvent,
  useDocumentPairPermissions,
  useEditState,
  useImmediateValidation,
  useSyncState,
  useValidationStatus,
} from 'sanity'
import {afterEach, beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {usePublishAction} from '../PublishAction'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentOperation: vi.fn(),
  useDocumentOperationEvent: vi.fn(),
  useDocumentPairPermissions: vi.fn(),
  useEditState: vi.fn(),
  useImmediateValidation: vi.fn(),
  useSyncState: vi.fn(),
  useValidationStatus: vi.fn(),
}))

vi.mock('../../panes/document/useDocumentPane')

const telemetry = vi.hoisted(() => ({log: vi.fn()}))
vi.mock('@sanity/telemetry/react', () => ({useTelemetry: () => telemetry}))

const mockUseDocumentOperation = useDocumentOperation as Mock<typeof useDocumentOperation>
const mockUseDocumentPairPermissions = useDocumentPairPermissions as Mock<
  typeof useDocumentPairPermissions
>
const mockUseEditState = useEditState as Mock<typeof useEditState>
const mockUseSyncState = useSyncState as Mock<typeof useSyncState>
const mockUseValidationStatus = useValidationStatus as Mock<typeof useValidationStatus>
const mockUseImmediateValidation = useImmediateValidation as Mock<typeof useImmediateValidation>
const mockUseDocumentOperationEvent = useDocumentOperationEvent as Mock<
  typeof useDocumentOperationEvent
>
const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>

const ID = 'author-1'
const PUBLISHED: SanityDocument = doc(ID, 'published-1')
const PERMITTED = [{granted: true, reason: ''}, false] as unknown as ReturnType<
  typeof useDocumentPairPermissions
>
const REQUIRED_NAME: ValidationMarker = {
  level: 'error',
  message: 'Required',
  path: ['name'],
}

function doc(id: string, rev: string): SanityDocument {
  return {
    _id: id,
    _type: 'author',
    _rev: rev,
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
  }
}

/**
 * The store state after one keystroke: a draft with a new revision, and (as `useDocumentVersions`
 * re-emits fresh stubs for every version whenever any of them changes) new sibling objects for
 * both the draft and the unchanged published document.
 */
function keystroke(
  rev: string,
  {
    publishedRev = 'published-1',
    withDraft = true,
  }: {publishedRev?: string; withDraft?: boolean} = {},
) {
  // publishing deletes the draft, so a just-published document has none
  const draft = withDraft ? doc(`drafts.${ID}`, `draft-${rev}`) : null
  const published = doc(ID, publishedRev)
  const editState: EditStateFor = {
    id: ID,
    type: 'author',
    transactionSyncLock: {enabled: false},
    draft,
    published,
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: undefined,
    scopeId: undefined,
  }
  const targetDocumentState = {
    status: 'ready',
    targetDocument: undefined,
    scopeId: undefined,
    variant: undefined,
    siblings: {
      published: {...published},
      draft: draft ? {...draft} : undefined,
      version: undefined,
    },
  } as unknown as TargetDocumentState
  const props: DocumentActionProps = {
    ...editState,
    revision: (draft ?? published)._rev,
    initialValueResolved: true,
    // oxlint-disable-next-line no-deprecated -- still a required field of DocumentActionProps
    onComplete: () => undefined,
  }
  return {draft, editState, targetDocumentState, props}
}

function applyKeystroke(
  state: ReturnType<typeof keystroke>,
  {
    syncing = false,
    validating = false,
    validation = [],
  }: {syncing?: boolean; validating?: boolean; validation?: ValidationMarker[]} = {},
) {
  const value = state.draft ?? state.editState.published
  if (!value) throw new Error('a keystroke state needs a draft or a published document')
  mockUseDocumentPane.mockReturnValue({
    changesOpen: false,
    documentId: ID,
    documentType: 'author',
    value,
    targetDocumentState: state.targetDocumentState,
  } as unknown as ReturnType<typeof useDocumentPane>)
  mockUseEditState.mockReturnValue(state.editState)
  mockUseSyncState.mockReturnValue({isSyncing: syncing})
  mockUseValidationStatus.mockReturnValue({
    isValidating: validating,
    validation,
    revision: value._rev,
  })
}

let wrapper: React.ComponentType<{children: React.ReactNode}>
let operations: {publish: {disabled: false; execute: Mock}}

beforeAll(async () => {
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

async function renderPublishAction(props: DocumentActionProps) {
  const rendered = renderHook(usePublishAction, {wrapper, initialProps: props})
  await waitFor(() => expect(rendered.result.current).not.toBeNull())
  return rendered
}

/** The arguments the action last rendered `useImmediateValidation` with. */
function immediateValidationArgs() {
  return mockUseImmediateValidation.mock.lastCall
}

describe('usePublishAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    operations = {publish: {disabled: false, execute: vi.fn()}}
    mockUseDocumentOperation.mockReturnValue(
      operations as unknown as ReturnType<typeof useDocumentOperation>,
    )
    mockUseDocumentPairPermissions.mockReturnValue(PERMITTED)
    mockUseImmediateValidation.mockReturnValue(null)
    mockUseDocumentOperationEvent.mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the description deep-equal across draft revisions', async () => {
    const first = keystroke('1')
    applyKeystroke(first)
    const {result, rerender} = await renderPublishAction(first.props)
    const before = result.current
    expect(before?.onHandle).toBeTypeOf('function')

    const second = keystroke('2')
    applyKeystroke(second)
    rerender(second.props)

    expect(result.current?.onHandle).toBe(before?.onHandle)
    expect(deepCompare(before, result.current)).toBe(true)
  })

  it('still changes the description when validation errors appear', async () => {
    const first = keystroke('1')
    applyKeystroke(first)
    const {result, rerender} = await renderPublishAction(first.props)
    const before = result.current
    expect(before?.disabled).toBe(false)

    const second = keystroke('2')
    applyKeystroke(second, {validation: [REQUIRED_NAME]})
    rerender(second.props)

    expect(result.current?.disabled).toBe(true)
    expect(deepCompare(before, result.current)).toBe(false)
  })

  it('reads the latest sync state when handled', async () => {
    const first = keystroke('1')
    applyKeystroke(first)
    const {result, rerender} = await renderPublishAction(first.props)
    const handle = result.current?.onHandle

    const second = keystroke('2')
    applyKeystroke(second, {syncing: true})
    rerender(second.props)
    act(() => handle?.())
    expect(operations.publish.execute).not.toHaveBeenCalled()

    const third = keystroke('3')
    applyKeystroke(third)
    rerender(third.props)
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
  })

  function renderDialogContent(result: {current: ReturnType<typeof usePublishAction>}) {
    const dialog = result.current?.dialog
    if (!dialog || dialog.type !== 'dialog') throw new Error('expected a modal dialog')
    const rendered = render(<>{dialog.content}</>, {wrapper})
    const step = (testId: string) => {
      const element = screen.getByTestId(testId)
      return {status: element.getAttribute('data-status'), text: element.textContent}
    }
    const steps = {
      validation: step('publish-progress-validation'),
      publish: step('publish-progress-publish'),
    }
    rendered.unmount()
    return {dialog, steps}
  }

  it('waits on the store validation and only runs its own, immediate one once the dialog shows', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()

    act(() => result.current?.onHandle?.())
    expect(result.current?.label).toBe('Validating document…')
    expect(immediateValidationArgs()).toEqual([first.draft, true, false])

    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(result.current?.dialog).toBeUndefined()
    expect(immediateValidationArgs()).toEqual([first.draft, true, false])

    act(() => {
      vi.advanceTimersByTime(1)
    })
    const {dialog, steps} = renderDialogContent(result)
    expect(dialog.showCloseButton).toBe(false)
    expect(steps.validation).toEqual({status: 'running', text: 'Validating your document'})
    expect(steps.publish).toEqual({status: 'pending', text: 'Publishing document'})
    expect(immediateValidationArgs()).toEqual([first.draft, true, true])

    // the immediate run finishes while the store validation is still going: the publish runs
    // on its result and the run is switched off again
    mockUseImmediateValidation.mockReturnValue({
      isValidating: false,
      validation: [],
      revision: first.draft?._rev,
    })
    rerender(first.props)
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    expect(immediateValidationArgs()).toEqual([first.draft, true, false])
    const publishing = renderDialogContent(result)
    expect(publishing.steps.validation.status).toBe('succeeded')
    expect(publishing.steps.publish).toEqual({status: 'running', text: 'Publishing document'})
    expect(publishing.dialog.showCloseButton).toBe(false)

    // the document is published (new published revision, draft gone): done, and the dialog
    // stays up, through the "already published" description, for two more seconds
    const published = keystroke('1', {publishedRev: 'published-2', withDraft: false})
    applyKeystroke(published)
    rerender(published.props)
    expect(result.current?.disabled).toBe(true)
    expect(renderDialogContent(result).steps.publish).toEqual({
      status: 'succeeded',
      text: 'Publishing document',
    })
    act(() => {
      vi.advanceTimersByTime(1999)
    })
    expect(result.current?.dialog).toBeDefined()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current?.dialog).toBeUndefined()
  })

  it('publishes on the store validation when that one finishes first', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()
    act(() => result.current?.onHandle?.())
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    mockUseImmediateValidation.mockReturnValue({
      isValidating: true,
      validation: [],
      revision: first.draft?._rev,
    })
    rerender(first.props)
    expect(operations.publish.execute).not.toHaveBeenCalled()

    applyKeystroke(first)
    rerender(first.props)

    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    expect(immediateValidationArgs()).toEqual([first.draft, true, false])
    expect(renderDialogContent(result).steps.validation.status).toBe('succeeded')
  })

  it('shows the error count and stays open until dismissed when validation fails', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()
    act(() => result.current?.onHandle?.())
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    mockUseImmediateValidation.mockReturnValue({
      isValidating: false,
      validation: [REQUIRED_NAME, {...REQUIRED_NAME, path: ['bio']}],
      revision: first.draft?._rev,
    })
    rerender(first.props)

    const {dialog, steps} = renderDialogContent(result)
    expect(steps.validation).toEqual({status: 'failed', text: '2 errors'})
    expect(steps.publish.status).toBe('pending')
    expect(dialog.showCloseButton).toBe(true)
    expect(operations.publish.execute).not.toHaveBeenCalled()
    expect(immediateValidationArgs()).toEqual([first.draft, true, false])
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(result.current?.dialog).toBeDefined()

    act(() => dialog.onClose())
    expect(result.current?.dialog).toBeUndefined()
  })

  it('stays open until dismissed when the publish fails', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()
    act(() => result.current?.onHandle?.())
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    applyKeystroke(first)
    rerender(first.props)
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)

    mockUseDocumentOperationEvent.mockReturnValue({
      type: 'error',
      op: 'publish',
      id: ID,
      error: new Error('Insufficient permissions'),
      idPair: {publishedId: ID, draftId: `drafts.${ID}`},
    })
    rerender(first.props)

    const {dialog, steps} = renderDialogContent(result)
    expect(steps.publish).toEqual({status: 'failed', text: 'Publishing failed'})
    expect(dialog.showCloseButton).toBe(true)
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(result.current?.dialog).toBeDefined()

    act(() => dialog.onClose())
    expect(result.current?.dialog).toBeUndefined()
  })

  it('does not show the dialog nor validate immediately when the publish finishes within three seconds', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()

    act(() => result.current?.onHandle?.())
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    applyKeystroke(first)
    rerender(first.props)
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    const published = keystroke('1', {publishedRev: 'published-2', withDraft: false})
    applyKeystroke(published)
    rerender(published.props)
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current?.dialog).toBeUndefined()
    expect(mockUseImmediateValidation.mock.calls.some(([, , enabled]) => enabled)).toBe(false)
  })
})
