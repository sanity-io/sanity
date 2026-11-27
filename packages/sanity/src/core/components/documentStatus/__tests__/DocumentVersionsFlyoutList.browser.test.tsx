import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {type DocumentPresence} from '../../../store/presence/types'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {DocumentVersionsFlyoutList} from '../DocumentVersionsFlyoutList'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../../variants/store/useAllVariants', () => ({useAllVariants: vi.fn()}))

const GROUP_ID = 'article-1'

function version(id: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {
      bundleId: 'drafts',
      group: {_ref: GROUP_ID, _weak: true},
    },
  } as VersionInfoDocumentStub
}

const versions = [version(`drafts.${GROUP_ID}`)]

function renderFlyoutList(presence: Omit<DocumentPresence, 'path'>[]) {
  return render(
    <TestWrapper schemaTypes={[]} betaFeatures={{variants: {enabled: true}}}>
      <div style={{width: 400}}>
        <DocumentVersionsFlyoutList
          documentGroupId={GROUP_ID}
          onOpenInventory={vi.fn()}
          onPick={vi.fn()}
          presence={presence}
        />
      </div>
    </TestWrapper>,
  )
}

beforeEach(() => {
  ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
    data: versions.map((v) => v._id),
    versions,
    error: null,
    loading: false,
  })
  ;(useActiveReleases as Mock<typeof useActiveReleases>).mockReturnValue({
    data: [activeASAPRelease],
    byId: new Map([[activeASAPRelease._id, activeASAPRelease]]),
    loading: false,
    error: undefined,
  } as ReturnType<typeof useActiveReleases>)
  ;(useAllVariants as Mock<typeof useAllVariants>).mockReturnValue({
    data: [],
    byId: new Map(),
    loading: false,
    error: undefined,
  })
})

describe('DocumentVersionsFlyoutList', () => {
  function person(id: string, displayName: string, documentId: string) {
    return {
      user: {id, displayName},
      sessionId: `session-${id}`,
      documentId,
      lastActiveAt: '2026-10-22T11:00:00.000Z',
    }
  }

  it('names the people on the avatars in a tooltip, on the avatars and not the row', async () => {
    await renderFlyoutList([
      person('pedro', 'Pedro Hall', `drafts.${GROUP_ID}`),
      person('ana', 'Ana Ruiz', `drafts.${GROUP_ID}`),
    ])
    const avatars = page.getByRole('img', {name: 'Pedro Hall and 1 other are editing'})
    await expect.element(avatars).toBeVisible()

    const tooltip = page.getByText('Pedro Hall and 1 other are editing')
    // Hovering the row's title shows no tooltip
    await page
      .getByRole('menuitem', {name: /Default/})
      .getByText('Default')
      .hover()
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(tooltip.elements().some((element) => element.getBoundingClientRect().width > 0)).toBe(
      false,
    )

    await avatars.hover()
    await expect
      .poll(() => tooltip.elements().some((element) => element.getBoundingClientRect().width > 0))
      .toBe(true)
  })
})
