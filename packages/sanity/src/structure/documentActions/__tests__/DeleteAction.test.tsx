import {type SanityDocument} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {
  type DocumentActionProps,
  type TargetDocumentState,
  useDocumentOperation,
  useDocumentPairPermissions,
} from 'sanity'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {useDeleteAction} from '../DeleteAction'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentOperation: vi.fn(),
  useDocumentPairPermissions: vi.fn(),
}))

vi.mock('../../panes/document/useDocumentPane')

const mockUseDocumentOperation = useDocumentOperation as Mock<typeof useDocumentOperation>
const mockUseDocumentPairPermissions = useDocumentPairPermissions as Mock<
  typeof useDocumentPairPermissions
>
const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>

const ID = 'author-1'
// A variant's draft: a `versions.<scope>.` copy in the drafts bundle.
const VARIANT_DRAFT: SanityDocument = {
  _id: `versions.scope-de.${ID}`,
  _type: 'author',
  _rev: 'rev-1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
}
const OPERATIONS = {delete: {disabled: false, execute: vi.fn()}} as unknown as ReturnType<
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
  published: null,
  version: VARIANT_DRAFT,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: true,
  release: undefined,
  scopeId: 'scope-de',
  revision: VARIANT_DRAFT._rev,
  initialValueResolved: true,
  // oxlint-disable-next-line no-deprecated -- still a required field of DocumentActionProps
  onComplete: () => undefined,
}

function applyTargetState(status: 'ready' | 'resolving') {
  mockUseDocumentPane.mockReturnValue({
    targetDocumentState: {
      status,
      targetDocument: VARIANT_DRAFT,
      scopeId: 'scope-de',
    } as unknown as TargetDocumentState,
  } as unknown as ReturnType<typeof useDocumentPane>)
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
})

async function renderDeleteAction() {
  const rendered = renderHook(useDeleteAction, {wrapper, initialProps: PROPS})
  await waitFor(() => expect(rendered.result.current).not.toBeNull())
  return rendered
}

describe('useDeleteAction on a variant draft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentOperation.mockReturnValue(OPERATIONS)
    mockUseDocumentPairPermissions.mockReturnValue(PERMITTED)
  })

  it('is enabled once the variant draft is resolved and permissions allow it', async () => {
    applyTargetState('ready')
    const {result} = await renderDeleteAction()

    expect(result.current).toMatchObject({disabled: false, title: ''})
  })

  it('says why it is disabled while the variant draft is still resolving', async () => {
    applyTargetState('resolving')
    const {result} = await renderDeleteAction()

    expect(result.current).toMatchObject({disabled: true, title: 'Operation not ready'})
  })
})
