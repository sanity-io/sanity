import {type SanityDocument} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import deepCompare from 'react-fast-compare'
import {
  type DocumentActionProps,
  type TargetDocumentState,
  useDocumentOperation,
  useDocumentPairPermissions,
  usePerspective,
} from 'sanity'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {perspectiveContextValueMock} from '../../__mocks__/usePerspective.mock'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {useUnpublishAction} from '../UnpublishAction'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentOperation: vi.fn(),
  useDocumentPairPermissions: vi.fn(),
  usePerspective: vi.fn(),
}))

vi.mock('../../panes/document/useDocumentPane')

const mockUseDocumentOperation = useDocumentOperation as Mock<typeof useDocumentOperation>
const mockUseDocumentPairPermissions = useDocumentPairPermissions as Mock<
  typeof useDocumentPairPermissions
>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>

const ID = 'author-1'
const PUBLISHED: SanityDocument = doc(ID, 'published-1')
const OPERATIONS = {unpublish: {disabled: false, execute: vi.fn()}} as unknown as ReturnType<
  typeof useDocumentOperation
>
const PERMITTED = [{granted: true, reason: ''}, false] as unknown as ReturnType<
  typeof useDocumentPairPermissions
>
const PROPS: DocumentActionProps = {
  id: ID,
  type: 'author',
  transactionSyncLock: {enabled: false},
  draft: null,
  published: PUBLISHED,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: undefined,
  revision: PUBLISHED._rev,
  initialValueResolved: true,
  // oxlint-disable-next-line no-deprecated -- still a required field of DocumentActionProps
  onComplete: () => undefined,
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
 * `useDocumentVersions` re-emits fresh stubs for every version whenever any of them changes, so
 * each collaborator edit to the draft hands the action a new `siblings` object for the unchanged
 * published document.
 */
function targetState(draftRev: string | null): TargetDocumentState {
  return {
    status: 'ready',
    targetDocument: {...PUBLISHED},
    scopeId: undefined,
    variant: undefined,
    siblings: {
      published: {...PUBLISHED},
      draft: draftRev ? doc(`drafts.${ID}`, draftRev) : undefined,
      version: undefined,
    },
  } as unknown as TargetDocumentState
}

function applyTargetState(state: TargetDocumentState) {
  mockUseDocumentPane.mockReturnValue({
    targetDocumentState: state,
  } as unknown as ReturnType<typeof useDocumentPane>)
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

async function renderUnpublishAction() {
  const rendered = renderHook(useUnpublishAction, {wrapper, initialProps: PROPS})
  await waitFor(() => expect(rendered.result.current).not.toBeNull())
  return rendered
}

describe('useUnpublishAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentOperation.mockReturnValue(OPERATIONS)
    mockUseDocumentPairPermissions.mockReturnValue(PERMITTED)
    mockUsePerspective.mockReturnValue({
      ...perspectiveContextValueMock,
      selectedPerspectiveName: 'published',
      selectedPerspective: 'published',
    })
  })

  it('keeps the description deep-equal while the sibling stubs are re-emitted', async () => {
    applyTargetState(targetState('draft-1'))
    const {result, rerender} = await renderUnpublishAction()
    const before = result.current
    expect(before?.onHandle).toBeTypeOf('function')

    applyTargetState(targetState('draft-2'))
    rerender(PROPS)

    expect(result.current?.onHandle).toBe(before?.onHandle)
    expect(deepCompare(before, result.current)).toBe(true)
  })

  it('still changes the description when the published sibling disappears', async () => {
    applyTargetState(targetState('draft-1'))
    const {result, rerender} = await renderUnpublishAction()
    const before = result.current
    expect(before?.disabled).toBe(false)

    const unpublished = targetState('draft-2') as Extract<TargetDocumentState, {status: 'ready'}>
    applyTargetState({...unpublished, siblings: {...unpublished.siblings, published: undefined}})
    rerender(PROPS)

    expect(result.current?.disabled).toBe(true)
    expect(deepCompare(before, result.current)).toBe(false)
  })
})
