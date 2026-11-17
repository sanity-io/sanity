import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../i18n/bundles/studio'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {
  activeASAPErrorRelease,
  activeASAPRelease,
  archivedScheduledRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesLocaleNamespace, releasesUsEnglishLocaleBundle} from '../../../i18n'
import {TableProvider} from '../../components/Table/TableProvider'
import {type Column, type VisibleColumn} from '../../components/Table/types'
import {ReleaseDocumentsCounter} from '../columnCells/ReleaseDocumentsCounter'
import {type TableRelease} from '../ReleasesOverview'
import {releasesOverviewColumnDefs} from '../ReleasesOverviewColumnDefs'

function isVisibleColumn(
  column: Column<TableRelease> | undefined,
): column is VisibleColumn<TableRelease> {
  return column != null && column.hidden !== true
}

function OverviewCell({
  column,
  release,
}: {
  column: VisibleColumn<TableRelease>
  release: TableRelease
}) {
  return (
    <div>
      {column.header({
        headerProps: {id: `${String(column.id)}-header`, style: {}},
        header: {id: String(column.id), sorting: Boolean(column.sorting)},
        searchDisabled: true,
      })}
      {column.cell({
        cellProps: {id: String(column.id), style: {}},
        datum: release,
        sorting: false,
      })}
    </div>
  )
}

function OverviewColumns() {
  const {t} = useTranslation(releasesLocaleNamespace)
  const activeColumns = releasesOverviewColumnDefs(t, 'active').filter(isVisibleColumn)
  const archivedColumns = releasesOverviewColumnDefs(t, 'archived').filter(isVisibleColumn)
  const publishAt = activeColumns.find((column) => column.id === 'publishAt')
  const error = activeColumns.find((column) => column.id === 'error')
  const documentCount = archivedColumns.find((column) => column.id === 'documentCount')

  return (
    <TableProvider>
      <VStack gap={4}>
        {publishAt && <OverviewCell column={publishAt} release={activeASAPRelease} />}
        {publishAt && <OverviewCell column={publishAt} release={scheduledRelease} />}
        {error && <OverviewCell column={error} release={activeASAPErrorRelease} />}
        {documentCount && (
          <OverviewCell column={documentCount} release={archivedScheduledRelease} />
        )}
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            document count
          </Text>
          <ReleaseDocumentsCounter documentCount={4} />
        </VStack>
      </VStack>
    </TableProvider>
  )
}

function OverviewColumnsHarness() {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <Card padding={4}>
        <OverviewColumns />
      </Card>
    </TestWrapper>
  )
}

describe('releases overview columns', () => {
  test('renders when, a publish error, and a document count', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<OverviewColumnsHarness />)

    await expect.element(page.getByText('As soon as possible')).toBeVisible()
    await expect.element(page.getByText('Scheduled')).toBeVisible()
    await expect.element(page.getByText('4', {exact: true})).toBeVisible()
    await settleChromaticEndState()
  })
})
