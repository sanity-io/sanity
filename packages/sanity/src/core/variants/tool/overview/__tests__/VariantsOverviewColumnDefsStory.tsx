import {Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {
  type Column,
  type InjectedTableProps,
  type VisibleColumn,
} from '../../../../releases/tool/components/Table/types'
import {createMockVariant} from '../../../__fixtures__/createMockVariant'
import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {variantsLocaleNamespace, variantsUsEnglishLocaleBundle} from '../../../i18n'
import {variantsOverviewColumnDefs, type TableVariant} from '../VariantsOverviewColumnDefs'

const CELL_PROPS: InjectedTableProps = {id: 'cell', style: {}}

const WITH_CONDITIONS: TableVariant = {
  ...variantAlphaAudience,
  documentCount: 12,
}

const NO_CONDITIONS: TableVariant = {
  ...createMockVariant('no-conditions'),
  conditions: {},
  metadata: {title: 'No targeting'},
  documentCount: 0,
}

const LONG_TITLE: TableVariant = {
  ...createMockVariant('long-title'),
  conditions: {audience: 'alpha', locale: 'en-US', market: 'nordics'},
  metadata: {
    title: 'A very long variant definition name that should truncate on a narrow card',
  },
  documentCount: 3,
}

const FAILED_COUNT: TableVariant = {
  ...createMockVariant('failed-count'),
  metadata: {title: 'Count unavailable'},
  documentCount: null,
}

function visibleColumn(column: Column<TableVariant> | undefined): VisibleColumn<TableVariant> {
  if (!column || column.hidden) {
    throw new Error('expected a visible overview column')
  }
  return column
}

function OverviewCells() {
  const {t} = useTranslation(variantsLocaleNamespace)
  const columns = variantsOverviewColumnDefs(t, true)
  const titleColumn = visibleColumn(columns[0])
  const typeColumn = visibleColumn(columns[1])
  const countColumn = visibleColumn(columns[2])

  return (
    <VStack gap={5}>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          title and conditions
        </Text>
        {titleColumn.cell({cellProps: CELL_PROPS, datum: WITH_CONDITIONS, sorting: false})}
      </VStack>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          no conditions
        </Text>
        {titleColumn.cell({cellProps: CELL_PROPS, datum: NO_CONDITIONS, sorting: false})}
      </VStack>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          truncated title
        </Text>
        <Card style={{maxWidth: 280}}>
          {titleColumn.cell({cellProps: CELL_PROPS, datum: LONG_TITLE, sorting: false})}
        </Card>
      </VStack>
      <VStack gap={2}>
        <Text muted size={1} weight="medium">
          type and document counts
        </Text>
        <Flex gap={4}>
          {typeColumn.cell({cellProps: CELL_PROPS, datum: WITH_CONDITIONS, sorting: false})}
          {countColumn.cell({cellProps: CELL_PROPS, datum: WITH_CONDITIONS, sorting: false})}
          {countColumn.cell({cellProps: CELL_PROPS, datum: NO_CONDITIONS, sorting: false})}
          {countColumn.cell({cellProps: CELL_PROPS, datum: FAILED_COUNT, sorting: false})}
        </Flex>
      </VStack>
    </VStack>
  )
}

/**
 * Chromatic sentinel for the variants overview table cells after the ui5
 * Text migration. Title + conditions, the empty-conditions fallback,
 * truncation on a narrow card, the type column, and document counts
 * (including the failed `-`). Loading skeletons are omitted — they
 * animate. No live variant store; rows are fixtures.
 */
export function VariantsOverviewColumnDefsStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <OverviewCells />
      </Card>
    </TestWrapper>
  )
}
