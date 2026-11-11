import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {useHasMultipleVersions} from '../DocumentVersionsFlyoutList'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({useDocumentVersions: vi.fn()}))
vi.mock('../../../releases/store/useActiveReleases', () => ({useActiveReleases: vi.fn()}))
vi.mock('../../../variants/store/useAllVariants', () => ({useAllVariants: vi.fn()}))

const GROUP_ID = 'article-1'

function version(id: string, bundleId?: string, releaseId?: string): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-10-22T11:00:00.000Z',
    _system: {
      bundleId,
      group: {_ref: GROUP_ID, _weak: true},
      release: releaseId ? {_ref: releaseId, _weak: true} : undefined,
    },
  }
}

const published = () => version(GROUP_ID)
const draft = () => version(`drafts.${GROUP_ID}`, 'drafts')
const inRelease = () =>
  version(
    `versions.${activeASAPRelease.name}.${GROUP_ID}`,
    activeASAPRelease.name,
    activeASAPRelease._id,
  )

function Probe() {
  return <span data-testid="result">{String(useHasMultipleVersions(GROUP_ID))}</span>
}

async function result(versions: VersionInfoDocumentStub[]) {
  ;(useDocumentVersions as Mock<typeof useDocumentVersions>).mockReturnValue({
    data: versions.map((v) => v._id),
    versions,
    error: null,
    loading: false,
  })
  const wrapper = await createTestProvider()
  const {unmount} = render(<Probe />, {wrapper})
  const text = screen.getByTestId('result').textContent
  unmount()
  return text
}

describe('useHasMultipleVersions', () => {
  beforeEach(() => {
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

  it('is false for a single version', async () => {
    expect(await result([published()])).toBe('false')
    expect(await result([draft()])).toBe('false')
  })

  it('is true for published and draft', async () => {
    expect(await result([published(), draft()])).toBe('true')
  })

  it('is true for a draft and a release version', async () => {
    expect(await result([draft(), inRelease()])).toBe('true')
  })
})
