import {defineField, defineType} from '@sanity/types'
import {Card} from '@sanity/ui'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {useTranslation} from '../../../../../i18n/hooks/useTranslation'
import {createMockDocument} from '../../../../__fixtures__/documentInRelease.fixture'
import {releasesLocaleNamespace, releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {TableProvider} from '../../../components/Table/TableProvider'
import {type Column, type VisibleColumn} from '../../../components/Table/types'
import {type BundleDocumentRow} from '../../ReleaseSummary'
import {getDocumentTableColumnDefs} from '../DocumentTableColumnDefs'

const article = defineType({
  type: 'document',
  name: 'article',
  title: 'Article',
  fields: [defineField({name: 'title', title: 'Title', type: 'string'})],
})

const articleDocument: BundleDocumentRow = {
  ...createMockDocument({hasError: true}),
  document: {
    ...createMockDocument().document,
    _id: 'versions.rASAP.article-1',
    _type: 'article',
  },
  validation: {
    hasError: true,
    isValidating: false,
    validation: [{level: 'error', message: 'Title is required', path: ['title']}],
  },
}

const VISIBLE_COLUMN_IDS = new Set(['action', 'document._type', 'validation'])

function isVisibleColumn(
  column: Column<BundleDocumentRow>,
): column is VisibleColumn<BundleDocumentRow> {
  return column.hidden !== true
}

function DocumentColumns() {
  const {t} = useTranslation(releasesLocaleNamespace)
  const columns = getDocumentTableColumnDefs('_.releases.rASAP', 'active', t).filter(
    (column) => isVisibleColumn(column) && VISIBLE_COLUMN_IDS.has(column.id),
  )

  return (
    <TableProvider>
      <VStack gap={2}>
        {columns.filter(isVisibleColumn).map((column) => (
          <div key={column.id}>
            {column.header({
              headerProps: {id: `${column.id}-header`, style: {}},
              header: {id: column.id, sorting: Boolean(column.sorting)},
              searchDisabled: true,
            })}
            {column.cell({
              cellProps: {id: column.id, style: {}},
              datum: articleDocument,
              sorting: false,
            })}
          </div>
        ))}
      </VStack>
    </TableProvider>
  )
}

function DocumentColumnsHarness() {
  return (
    <TestWrapper
      i18nBundles={[studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]}
      schemaTypes={[article]}
    >
      <Card padding={4}>
        <DocumentColumns />
      </Card>
    </TestWrapper>
  )
}

describe('document table columns', () => {
  test('renders action, type, and validation without relative time', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<DocumentColumnsHarness />)

    await expect.element(page.getByText('Article')).toBeVisible()
    await expect.element(page.getByText('Add')).toBeVisible()
    await expect.element(page.getByText('Type')).toBeVisible()
    await settleChromaticEndState()
  })
})
