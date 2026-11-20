import {type ReleaseDocument} from '@sanity/client'
import {act, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type ReleaseDetailComponent} from '../../../../config/releases/detail'
import {type SingleWorkspace} from '../../../../config/types'
import {activeASAPRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
  mockUseReleasePermissions,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {ReleaseDashboardDetails} from '../ReleaseDashboardDetails'
import {documentsInRelease} from './__mocks__/useBundleDocuments.mock'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

const release: ReleaseDocument = {
  ...activeASAPRelease,
  metadata: {...activeASAPRelease.metadata, category: 'campaign'} as ReleaseDocument['metadata'],
}

const documents = [documentsInRelease]

async function renderDetails({
  detail,
  variantsEnabled = true,
  loading = false,
  documentsError = false,
  releaseInView = release,
}: {
  detail?: ReleaseDetailComponent
  variantsEnabled?: boolean
  loading?: boolean
  documentsError?: boolean
  releaseInView?: ReleaseDocument
}) {
  let result!: ReturnType<typeof render>
  const config: Partial<SingleWorkspace> = {
    beta: {variants: {enabled: variantsEnabled}},
    releases: detail ? {enabled: true, detail} : {enabled: true},
  }
  const wrapper = await createTestProvider({config, resources: [releasesUsEnglishLocaleBundle]})

  const renderElement = (releaseToShow: ReleaseDocument) => (
    <ReleaseDashboardDetails
      release={releaseToShow}
      documents={documents}
      events={[]}
      loading={loading}
      documentsError={documentsError}
    />
  )

  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the studio tree suspends while mounting
  await act(async () => {
    result = render(renderElement(releaseInView), {wrapper})
  })

  return {
    showRelease: (releaseToShow: ReleaseDocument) =>
      // oxlint-disable-next-line testing-library/no-unnecessary-act -- see mount above
      act(async () => {
        result.rerender(renderElement(releaseToShow))
      }),
  }
}

describe('ReleaseDashboardDetails releases.detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
  })

  it('renders the detail under the description with the release and its documents', async () => {
    const detail = vi.fn<ReleaseDetailComponent>(({release: detailRelease, documents: docs}) => (
      <div data-testid="custom-detail">
        {String(detailRelease.metadata.category)}:{docs.length}
      </div>
    ))

    await renderDetails({detail})

    const description = screen.getByTestId('release-description-display')
    const custom = screen.getByTestId('custom-detail')
    expect(custom).toHaveTextContent('campaign:1')
    expect(
      description.compareDocumentPosition(custom) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByTestId('release-detail-metadata')).toBeInTheDocument()
  })

  it('renders nothing extra when no detail is configured', async () => {
    await renderDetails({})

    expect(screen.queryByTestId('custom-detail')).toBeNull()
    expect(screen.queryByTestId('release-detail-skeleton')).toBeNull()
    expect(screen.queryByTestId('release-detail-error')).toBeNull()
  })

  it('renders nothing in the layout without beta.variants', async () => {
    const detail = vi.fn<ReleaseDetailComponent>(() => <div data-testid="custom-detail" />)

    await renderDetails({detail, variantsEnabled: false})

    expect(screen.queryByTestId('custom-detail')).toBeNull()
    expect(detail).not.toHaveBeenCalled()
  })

  it('shows a skeleton while the documents load and does not call the component', async () => {
    const detail = vi.fn<ReleaseDetailComponent>(() => <div data-testid="custom-detail" />)

    await renderDetails({detail, loading: true})

    expect(screen.getByTestId('release-detail-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('custom-detail')).toBeNull()
    expect(detail).not.toHaveBeenCalled()
  })

  it('renders nothing when the documents failed to load', async () => {
    const detail = vi.fn<ReleaseDetailComponent>(() => <div data-testid="custom-detail" />)

    await renderDetails({detail, documentsError: true})

    expect(screen.queryByTestId('custom-detail')).toBeNull()
    expect(screen.queryByTestId('release-detail-skeleton')).toBeNull()
    expect(screen.queryByTestId('release-detail-error')).toBeNull()
    expect(detail).not.toHaveBeenCalled()
  })

  it('shows a fallback card when the detail throws and keeps the properties up', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const detail: ReleaseDetailComponent = () => {
      throw new Error('boom')
    }

    await renderDetails({detail})

    expect(screen.getByTestId('release-detail-error')).toHaveTextContent(
      "Can't display this detail",
    )
    expect(screen.getByTestId('release-detail-metadata')).toBeInTheDocument()
    expect(screen.getByTestId('release-description-display')).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('resets the fallback when another release is shown', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const detail: ReleaseDetailComponent = ({release: detailRelease}) => {
      if (detailRelease._id === release._id) throw new Error('boom')
      return <div data-testid="custom-detail" />
    }

    const {showRelease} = await renderDetails({detail})
    expect(screen.getByTestId('release-detail-error')).toBeInTheDocument()

    await showRelease({...release, _id: '_.releases.other', name: 'other'})

    expect(screen.getByTestId('custom-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('release-detail-error')).toBeNull()
    consoleError.mockRestore()
  })
})
