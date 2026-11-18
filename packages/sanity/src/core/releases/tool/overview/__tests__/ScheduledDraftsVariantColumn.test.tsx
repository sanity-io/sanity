import {type SanityDocument} from '@sanity/client'
import {render, screen} from '@testing-library/react'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- test stub for column defs
import {type TFunction} from 'i18next'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {type SystemVariant} from '../../../../variants/types'
import {activeScheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ScheduledDraftVariantCell} from '../columnCells/ScheduledDraftVariantCell'
import {scheduledDraftsOverviewColumnDefs} from '../ScheduledDraftsOverviewColumnDefs'

vi.mock('../../../../singleDocRelease/hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: vi.fn(),
}))

const mockUseScheduledDraftDocument = vi.mocked(useScheduledDraftDocument)

const loyalVariant: SystemVariant = {
  _id: '_.variants.loyal',
  _type: 'system.variant',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-loyal',
  conditions: {audience: 'loyal'},
  priority: 0,
  metadata: {title: 'Loyal customers'},
}
const variantsById = new Map([[loyalVariant._id, loyalVariant]])

const cellProps = {id: 'variant', style: {width: 180}}

function mockScheduledDocument(firstDocument: SanityDocument | undefined, loading = false) {
  mockUseScheduledDraftDocument.mockReturnValue({
    firstDocument,
    firstDocumentPreview: undefined,
    firstDocumentValidation: undefined,
    documentsCount: firstDocument ? 1 : 0,
    loading,
    error: null,
    previewLoading: false,
  })
}

const scheduledVersion = {
  _id: 'versions.scope-scheduled.article-1',
  _type: 'article',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
}

describe('scheduled drafts variant column', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is only added when a variants map is passed', () => {
    const t = ((key: string) => key) as TFunction<'releases'>

    expect(scheduledDraftsOverviewColumnDefs(t, 'active').map(({id}) => id)).toEqual([
      'documentPreview',
      'publishAt',
      'warning',
    ])
    expect(
      scheduledDraftsOverviewColumnDefs(t, 'active', {variantsById}).map(({id}) => id),
    ).toEqual(['variant', 'documentPreview', 'publishAt', 'warning'])
  })

  it('shows the variant of the scheduled document', async () => {
    mockScheduledDocument({
      ...scheduledVersion,
      _system: {
        bundleId: 'rScheduled',
        group: {_ref: 'article-1', _weak: true},
        variants: [{_ref: loyalVariant._id, _key: 'loyal'}],
      },
    })
    const wrapper = await createTestProvider({resources: [releasesUsEnglishLocaleBundle]})

    render(
      <ScheduledDraftVariantCell
        release={activeScheduledRelease}
        cellProps={cellProps}
        variantsById={variantsById}
        variantsLoading={false}
      />,
      {wrapper},
    )

    expect(screen.getByText('Loyal customers')).toBeInTheDocument()
  })

  it('stays empty for a scheduled draft of the base document', async () => {
    mockScheduledDocument({
      ...scheduledVersion,
      _id: 'versions.rScheduled.article-1',
      _system: {bundleId: 'rScheduled', group: {_ref: 'article-1', _weak: true}},
    })
    const wrapper = await createTestProvider({resources: [releasesUsEnglishLocaleBundle]})

    render(
      <ScheduledDraftVariantCell
        release={activeScheduledRelease}
        cellProps={cellProps}
        variantsById={variantsById}
        variantsLoading={false}
      />,
      {wrapper},
    )

    expect(screen.queryByText('Loyal customers')).toBeNull()
  })

  it('does not show a variant while the scheduled document is loading', async () => {
    mockScheduledDocument(undefined, true)
    const wrapper = await createTestProvider({resources: [releasesUsEnglishLocaleBundle]})

    render(
      <ScheduledDraftVariantCell
        release={activeScheduledRelease}
        cellProps={cellProps}
        variantsById={variantsById}
        variantsLoading={false}
      />,
      {wrapper},
    )

    expect(screen.queryByText('Loyal customers')).toBeNull()
  })
})
