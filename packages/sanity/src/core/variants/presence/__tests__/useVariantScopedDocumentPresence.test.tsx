import {type User} from '@sanity/types'
import {renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type PerspectiveContextValue} from '../../../perspective/types'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type DocumentPresence} from '../../../store/presence/types'
import {useDocumentPresence} from '../../../store/presence/useDocumentPresence'
import {variantAlphaAudience, variantNorwegianMarket} from '../../__fixtures__/variants.fixture'
import {useVariantScopedDocumentPresence} from '../useVariantScopedDocumentPresence'

vi.mock('../../../store/presence/useDocumentPresence', () => ({
  useDocumentPresence: vi.fn(),
}))
vi.mock('../../../releases/hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))
vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(),
}))

const GROUP_ID = 'article-1'
const groupRef = {_ref: GROUP_ID, _weak: true} as const

const alphaDraft: VersionInfoDocumentStub = {
  _id: `versions.alphaDraft.${GROUP_ID}`,
  _rev: 'rev',
  _createdAt: '',
  _updatedAt: '',
  _system: {
    bundleId: 'drafts',
    group: groupRef,
    variant: {_ref: variantAlphaAudience._id, _weak: true},
    scopeId: 'alphaDraft',
  },
}
const norwegianDraft: VersionInfoDocumentStub = {
  ...alphaDraft,
  _id: `versions.norwegianDraft.${GROUP_ID}`,
  _system: {
    ...alphaDraft._system,
    variant: {_ref: variantNorwegianMarket._id, _weak: true},
    scopeId: 'norwegianDraft',
  },
}

function presenceAt(documentId: string): DocumentPresence {
  return {
    user: {id: `user-${documentId}`} as User,
    path: [],
    sessionId: `session-${documentId}`,
    documentId,
    lastActiveAt: '',
  }
}

function render(selectedVariant: PerspectiveContextValue['selectedVariant']) {
  vi.mocked(useDocumentPresence).mockReturnValue([
    presenceAt(`drafts.${GROUP_ID}`),
    presenceAt(alphaDraft._id),
    presenceAt(norwegianDraft._id),
  ])
  vi.mocked(useDocumentVersions).mockReturnValue({
    versions: [alphaDraft, norwegianDraft],
  } as ReturnType<typeof useDocumentVersions>)
  vi.mocked(usePerspective).mockReturnValue({selectedVariant} as PerspectiveContextValue)

  return renderHook(() => useVariantScopedDocumentPresence(GROUP_ID))
}

describe('useVariantScopedDocumentPresence', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('subscribes to presence for the whole document group', () => {
    render(undefined)
    expect(useDocumentPresence).toHaveBeenCalledWith(GROUP_ID)
  })

  it('narrows group presence to the selected variant', () => {
    const {result} = render(variantAlphaAudience)
    expect(result.current.map((item) => item.documentId)).toEqual([alphaDraft._id])
  })

  it('hides variant editors when no variant is selected', () => {
    const {result} = render(undefined)
    expect(result.current.map((item) => item.documentId)).toEqual([`drafts.${GROUP_ID}`])
  })
})
