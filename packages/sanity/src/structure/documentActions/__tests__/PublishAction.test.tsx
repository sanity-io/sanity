import {type SanityDocument, type ValidationMarker} from '@sanity/types'
import {act, render, renderHook, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {cloneElement, isValidElement} from 'react'
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

  /**
   * Mounts the action's progress dialog the way the document pane does (a `custom` dialog is the
   * component itself) and keeps it mounted across updates, so that its own validation run keeps
   * feeding the action.
   */
  function mountDialog(result: {current: ReturnType<typeof usePublishAction>}) {
    const element = () => {
      const dialog = result.current?.dialog
      if (!dialog || dialog.type !== 'custom' || !isValidElement(dialog.component)) {
        throw new Error('expected a custom dialog')
      }
      // a fresh element each time: the component re-renders on its own in the studio (its
      // validation hook has state), here the mocked hook only reports a new value on a re-render
      return cloneElement(dialog.component)
    }
    const rendered = render(element(), {wrapper})
    const step = (testId: string) => {
      const node = screen.getByTestId(testId)
      return {status: node.getAttribute('data-status'), text: node.textContent}
    }
    return {
      update: () => rendered.rerender(element()),
      steps: () => ({
        validation: step('publish-progress-validation'),
        publish: step('publish-progress-publish'),
      }),
      hasClose: () => screen.queryByTestId('cancel-button') !== null,
      close: () =>
        userEvent
          .setup({advanceTimers: (ms) => vi.advanceTimersByTime(ms)})
          .click(screen.getByTestId('cancel-button')),
      unmount: rendered.unmount,
    }
  }

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }

  it('shows no dialog for five seconds, then one that validates on its own', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result} = await renderPublishAction(first.props)
    vi.useFakeTimers()

    act(() => result.current?.onHandle?.())
    expect(result.current?.label).toBe('Validating document…')
    expect(result.current?.dialog).toBeUndefined()

    advance(4999)
    expect(result.current?.dialog).toBeUndefined()

    advance(1)
    expect(result.current?.dialog).toMatchObject({type: 'custom'})
    mockUseImmediateValidation.mockReturnValue({
      isValidating: true,
      validation: [],
      revision: first.draft?._rev,
    })
    const dialog = mountDialog(result)
    expect(immediateValidationArgs()).toEqual([first.draft, true, true])
    expect(dialog.steps().validation).toEqual({status: 'running', text: 'Validating your document'})
    expect(dialog.steps().publish).toEqual({status: 'pending', text: 'Publishing document'})
    expect(dialog.hasClose()).toBe(false)
    expect(operations.publish.execute).not.toHaveBeenCalled()
    dialog.unmount()
  })

  it('publishes on the dialog validation while the store is still validating, and closes two seconds after the publish', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()
    act(() => result.current?.onHandle?.())
    advance(5000)
    const dialog = mountDialog(result)

    // the dialog's run completes without errors: the publish runs on it
    mockUseImmediateValidation.mockReturnValue({
      isValidating: false,
      validation: [],
      revision: first.draft?._rev,
    })
    dialog.update()
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    rerender(first.props)
    dialog.update()
    expect(result.current?.label).toBe('Publishing…')
    expect(dialog.steps().validation.status).toBe('succeeded')
    expect(dialog.steps().publish).toEqual({status: 'running', text: 'Publishing document'})
    expect(immediateValidationArgs()).toEqual([first.draft, true, false])

    // the document is published (new published revision, draft gone): the dialog stays up,
    // through the "already published" description, for two more seconds
    const published = keystroke('1', {publishedRev: 'published-2', withDraft: false})
    applyKeystroke(published)
    rerender(published.props)
    dialog.update()
    expect(result.current?.disabled).toBe(true)
    expect(dialog.steps().publish).toEqual({status: 'succeeded', text: 'Publishing document'})
    expect(dialog.hasClose()).toBe(false)
    advance(1999)
    expect(result.current?.dialog).toBeDefined()
    advance(1)
    expect(result.current?.dialog).toBeUndefined()
    dialog.unmount()
  })

  it('publishes on the store validation when that one finishes first', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()
    act(() => result.current?.onHandle?.())
    advance(5000)
    mockUseImmediateValidation.mockReturnValue({
      isValidating: true,
      validation: [],
      revision: first.draft?._rev,
    })
    const dialog = mountDialog(result)
    expect(operations.publish.execute).not.toHaveBeenCalled()

    applyKeystroke(first)
    rerender(first.props)

    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    dialog.update()
    expect(dialog.steps().validation.status).toBe('succeeded')
    expect(dialog.steps().publish.status).toBe('running')
    dialog.unmount()
  })

  it('keeps the dialog up with the error count until it is closed when the validation fails', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result} = await renderPublishAction(first.props)
    // the click on Close goes through user-event, which needs the clock to keep moving
    vi.useFakeTimers({shouldAdvanceTime: true})
    act(() => result.current?.onHandle?.())
    advance(5000)
    const dialog = mountDialog(result)

    mockUseImmediateValidation.mockReturnValue({
      isValidating: false,
      validation: [REQUIRED_NAME, {...REQUIRED_NAME, path: ['bio']}],
      revision: first.draft?._rev,
    })
    dialog.update()
    dialog.update()

    expect(operations.publish.execute).not.toHaveBeenCalled()
    expect(dialog.steps().validation).toEqual({status: 'failed', text: '2 errors'})
    expect(dialog.steps().publish.status).toBe('pending')
    expect(dialog.hasClose()).toBe(true)
    advance(10_000)
    expect(result.current?.dialog).toBeDefined()

    await dialog.close()
    expect(result.current?.dialog).toBeUndefined()
    dialog.unmount()
  })

  it('keeps the dialog up until it is closed when the publish fails', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    // the click on Close goes through user-event, which needs the clock to keep moving
    vi.useFakeTimers({shouldAdvanceTime: true})
    act(() => result.current?.onHandle?.())
    advance(5000)
    const dialog = mountDialog(result)
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
    dialog.update()

    expect(dialog.steps().publish).toEqual({status: 'failed', text: 'Publishing failed'})
    expect(dialog.hasClose()).toBe(true)
    advance(10_000)
    expect(result.current?.dialog).toBeDefined()

    await dialog.close()
    expect(result.current?.dialog).toBeUndefined()
    dialog.unmount()
  })

  it('offers to close once the action has given up on a publish that has not landed', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers({shouldAdvanceTime: true})
    act(() => result.current?.onHandle?.())
    advance(5000)
    const dialog = mountDialog(result)
    applyKeystroke(first)
    rerender(first.props)
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    dialog.update()
    expect(dialog.steps().publish.status).toBe('running')
    expect(dialog.hasClose()).toBe(false)

    // the action's own publish state gives up after four seconds; the dialog keeps showing the
    // publish as running, since nothing says it failed, but can be dismissed from here on
    advance(4000)
    dialog.update()
    expect(dialog.steps().publish.status).toBe('running')
    expect(dialog.hasClose()).toBe(true)

    await dialog.close()
    expect(result.current?.dialog).toBeUndefined()
    dialog.unmount()
  })

  it('never shows the dialog when the publish is done within five seconds', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()

    act(() => result.current?.onHandle?.())
    advance(1000)
    applyKeystroke(first)
    rerender(first.props)
    expect(operations.publish.execute).toHaveBeenCalledTimes(1)
    const published = keystroke('1', {publishedRev: 'published-2', withDraft: false})
    applyKeystroke(published)
    rerender(published.props)
    advance(200)
    expect(result.current?.dialog).toBeUndefined()

    advance(5000)
    expect(result.current?.dialog).toBeUndefined()
    expect(mockUseImmediateValidation).not.toHaveBeenCalled()
  })

  it('never shows the dialog when the validation fails within five seconds', async () => {
    const first = keystroke('1')
    applyKeystroke(first, {validating: true})
    const {result, rerender} = await renderPublishAction(first.props)
    vi.useFakeTimers()

    act(() => result.current?.onHandle?.())
    advance(1000)
    applyKeystroke(first, {validation: [REQUIRED_NAME]})
    rerender(first.props)
    expect(operations.publish.execute).not.toHaveBeenCalled()

    advance(5000)
    expect(result.current?.dialog).toBeUndefined()
  })
})
