import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- test-only mock of the t function type
import {type TFunction} from 'i18next'
import {type ReactElement} from 'react'
import {describe, expect, it} from 'vitest'

import {activeASAPRelease, activeScheduledRelease} from '../../../__fixtures__/release.fixture'
import {TableProvider} from '../../components/Table/TableProvider'
import {type TableRelease} from '../ReleasesOverview'
import {releasesOverviewColumnDefs} from '../ReleasesOverviewColumnDefs'

// Identity translator: returns the key so assertions can match on it directly.
const t = ((key: string) => key) as unknown as TFunction<'releases'>

const cardinalityOneRelease: TableRelease = {
  ...activeScheduledRelease,
  metadata: {...activeScheduledRelease.metadata, cardinality: 'one'},
}

const cardinalityManyRelease: TableRelease = {
  ...activeASAPRelease,
  metadata: {...activeASAPRelease.metadata, cardinality: 'many'},
}

function renderWithTheme(element: ReactElement) {
  return render(<ThemeProvider theme={studioTheme}>{element}</ThemeProvider>)
}

function renderHeaderWithTable(element: ReactElement) {
  return render(
    <ThemeProvider theme={studioTheme}>
      <TableProvider>{element}</TableProvider>
    </ThemeProvider>,
  )
}

describe('releasesOverviewColumnDefs', () => {
  it('does not include a "kind" column in the "releases" view', () => {
    const columns = releasesOverviewColumnDefs(t, 'active', 'releases')
    expect(columns.some((column) => column.id === 'kind')).toBe(false)
  })

  it('does not include a "kind" column in the "drafts" view', () => {
    const columns = releasesOverviewColumnDefs(t, 'active', 'drafts')
    expect(columns.some((column) => column.id === 'kind')).toBe(false)
  })

  it('includes a "kind" column in the "all" view, immediately before the title (name) column', () => {
    const columns = releasesOverviewColumnDefs(t, 'active', 'all')
    const titleIndex = columns.findIndex((column) => column.id === 'metadata.title')
    const kindIndex = columns.findIndex((column) => column.id === 'kind')

    expect(kindIndex).toBeGreaterThan(-1)
    expect(kindIndex).toBe(titleIndex - 1)
  })

  it('configures the "kind" column as sortable, 120px wide, sorting cardinality-one releases after others', () => {
    const columns = releasesOverviewColumnDefs(t, 'active', 'all')
    const kindColumn = columns.find((column) => column.id === 'kind')

    expect(kindColumn?.sorting).toBe(true)
    expect(kindColumn?.width).toBe(120)
    expect(kindColumn?.sortTransform?.(cardinalityOneRelease, 'asc')).toBe(1)
    expect(kindColumn?.sortTransform?.(cardinalityManyRelease, 'asc')).toBe(0)
  })

  it('renders "Document" with a single-document icon for a cardinality-one release', () => {
    const columns = releasesOverviewColumnDefs(t, 'active', 'all')
    const kindColumn = columns.find((column) => column.id === 'kind')
    const Cell = kindColumn?.cell as React.ComponentType<{
      cellProps: object
      datum: TableRelease
    }>

    renderWithTheme(<Cell cellProps={{}} datum={cardinalityOneRelease} />)

    expect(screen.getByText('overview.kind.document')).toBeInTheDocument()
    expect(screen.queryByText('overview.kind.release')).not.toBeInTheDocument()
  })

  it('renders "Release" with a bundle icon for a cardinality-many release', () => {
    const columns = releasesOverviewColumnDefs(t, 'active', 'all')
    const kindColumn = columns.find((column) => column.id === 'kind')
    const Cell = kindColumn?.cell as React.ComponentType<{
      cellProps: object
      datum: TableRelease
    }>

    renderWithTheme(<Cell cellProps={{}} datum={cardinalityManyRelease} />)

    expect(screen.getByText('overview.kind.release')).toBeInTheDocument()
    expect(screen.queryByText('overview.kind.document')).not.toBeInTheDocument()
  })

  it('still includes the title column in every view', () => {
    ;(['releases', 'drafts', 'all'] as const).forEach((cardinalityView) => {
      const columns = releasesOverviewColumnDefs(t, 'active', cardinalityView)
      expect(columns.some((column) => column.id === 'metadata.title')).toBe(true)
    })
  })

  describe('name-column header (view-aware)', () => {
    const headerProps = {id: 'metadata.title', style: {}}

    it('uses the neutral "Name" header in the "all" view', () => {
      const columns = releasesOverviewColumnDefs(t, 'active', 'all')
      const titleColumn = columns.find((column) => column.id === 'metadata.title')
      const Header = titleColumn?.header as React.ComponentType<{
        headerProps: {id: string; style: object}
        header: {id: string; sorting: boolean}
      }>

      renderHeaderWithTable(
        <Header headerProps={headerProps} header={{id: 'metadata.title', sorting: true}} />,
      )

      expect(screen.getByText('table-header.name')).toBeInTheDocument()
    })

    it('uses the "Release" header in the "releases" view', () => {
      const columns = releasesOverviewColumnDefs(t, 'active', 'releases')
      const titleColumn = columns.find((column) => column.id === 'metadata.title')
      const Header = titleColumn?.header as React.ComponentType<{
        headerProps: {id: string; style: object}
        header: {id: string; sorting: boolean}
      }>

      renderHeaderWithTable(
        <Header headerProps={headerProps} header={{id: 'metadata.title', sorting: true}} />,
      )

      expect(screen.getByText('table-header.title')).toBeInTheDocument()
    })

    it('uses the "Document" header in the "drafts" view', () => {
      const columns = releasesOverviewColumnDefs(t, 'active', 'drafts')
      const titleColumn = columns.find((column) => column.id === 'metadata.title')
      const Header = titleColumn?.header as React.ComponentType<{
        headerProps: {id: string; style: object}
        header: {id: string; sorting: boolean}
      }>

      renderHeaderWithTable(
        <Header headerProps={headerProps} header={{id: 'metadata.title', sorting: true}} />,
      )

      expect(screen.getByText('table-header.document')).toBeInTheDocument()
    })
  })

  describe('paused mode (Phase B: drafts tab shares the release grammar)', () => {
    it('renders the same column set for "paused" as for "active"', () => {
      const activeColumns = releasesOverviewColumnDefs(t, 'active', 'drafts')
      const pausedColumns = releasesOverviewColumnDefs(t, 'paused', 'drafts')

      expect(pausedColumns.map((column) => column.id)).toEqual(
        activeColumns.map((column) => column.id),
      )
    })

    it('includes the Schedule, Documents, and Edited by columns in paused mode', () => {
      const columns = releasesOverviewColumnDefs(t, 'paused', 'drafts')
      const columnIds = columns.map((column) => column.id)

      expect(columnIds).toContain('publishAt')
      expect(columnIds).toContain('documentCount')
      expect(columnIds).toContain('editedBy')
      expect(columnIds).toContain('status')
    })

    it('excludes archived-only columns (published-at / archivedAt) in paused mode', () => {
      const columns = releasesOverviewColumnDefs(t, 'paused', 'drafts')
      const columnIds = columns.map((column) => column.id)

      expect(columnIds).not.toContain('publishedAt')
      expect(columnIds).not.toContain('_updatedAt')
    })

    it('does not include a "kind" column in paused mode for the "drafts" view', () => {
      const columns = releasesOverviewColumnDefs(t, 'paused', 'drafts')
      expect(columns.some((column) => column.id === 'kind')).toBe(false)
    })
  })
})
