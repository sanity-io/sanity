import {type SanityDocument, type ValidationMarker} from '@sanity/types'
import {act, renderHook, waitFor} from '@testing-library/react'
import deepCompare from 'react-fast-compare'
import {
  type DocumentActionProps,
  type EditStateFor,
  type TargetDocumentState,
  useDocumentOperation,
  useDocumentPairPermissions,
  useEditState,
  useSyncState,
  useValidationStatus,
} from 'sanity'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {usePublishAction} from '../PublishAction'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentOperation: vi.fn(),
  useDocumentPairPermissions: vi.fn(),
  useEditState: vi.fn(),
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
function keystroke(rev: string) {
  const draft = doc(`drafts.${ID}`, `draft-${rev}`)
  const editState: EditStateFor = {
    id: ID,
    type: 'author',
    transactionSyncLock: {enabled: false},
    draft,
    published: PUBLISHED,
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
    siblings: {published: {...PUBLISHED}, draft: {...draft}, version: undefined},
  } as unknown as TargetDocumentState
  const props: DocumentActionProps = {
    ...editState,
    revision: draft._rev,
    initialValueResolved: true,
    // oxlint-disable-next-line no-deprecated -- still a required field of DocumentActionProps
    onComplete: () => undefined,
  }
  return {draft, editState, targetDocumentState, props}
}

function applyKeystroke(
  state: ReturnType<typeof keystroke>,
  {syncing = false, validation = []}: {syncing?: boolean; validation?: ValidationMarker[]} = {},
) {
  mockUseDocumentPane.mockReturnValue({
    changesOpen: false,
    documentId: ID,
    documentType: 'author',
    value: state.draft,
    targetDocumentState: state.targetDocumentState,
  } as unknown as ReturnType<typeof useDocumentPane>)
  mockUseEditState.mockReturnValue(state.editState)
  mockUseSyncState.mockReturnValue({isSyncing: syncing})
  mockUseValidationStatus.mockReturnValue({
    isValidating: false,
    validation,
    revision: state.draft._rev,
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

describe('usePublishAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    operations = {publish: {disabled: false, execute: vi.fn()}}
    mockUseDocumentOperation.mockReturnValue(
      operations as unknown as ReturnType<typeof useDocumentOperation>,
    )
    mockUseDocumentPairPermissions.mockReturnValue(PERMITTED)
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
})
