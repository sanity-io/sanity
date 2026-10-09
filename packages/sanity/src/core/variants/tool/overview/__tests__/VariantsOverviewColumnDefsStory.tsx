import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {route, RouterProvider} from 'sanity/router'
import {Flex} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type InjectedTableProps} from '../../../../releases/tool/components/Table/types'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsLocaleNamespace, variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type TableVariant, variantsOverviewColumnDefs} from '../VariantsOverviewColumnDefs'

// The title cell links to the variant detail route, so the router must know
// `variantId` — same route the variants plugin registers for its tool.
const router = route.create('/', [route.create('/:variantId')])

const CELL_PROPS: InjectedTableProps = {id: 'cell', style: {}}

const withDocuments: TableVariant = {...variantAlphaAudience, documentCount: 12}
const withoutDocuments: TableVariant = {...variantNorwegianMarket, documentCount: 0}
const countUnavailable: TableVariant = {
  ...variantAlphaAudience,
  _id: '_.variants.everything',
  conditions: {},
  metadata: {title: 'Everything'},
  documentCount: null,
}

function Row({variant}: {variant: TableVariant}) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const columns = variantsOverviewColumnDefs(t)

  return (
    <Card border radius={2}>
      <Flex alignItems="center">
        {columns.map((column) =>
          column.hidden ? null : (
            <column.cell
              key={String(column.id)}
              cellProps={{...CELL_PROPS, id: String(column.id), style: {width: column.width ?? 0}}}
              datum={variant}
              sorting={false}
            />
          ),
        )}
      </Flex>
    </Card>
  )
}

/**
 * Chromatic sentinel for the variant definitions overview row cells: the
 * title cell (linked card with title and conditions text, or the "No
 * conditions" fallback) and the documents-count cell (a count, or "-" when
 * the count could not be fetched). Loading skeletons are omitted (animated).
 */
export function VariantsOverviewColumnDefsStory() {
  return (
    <TestWrapper i18nBundles={[variantsUsEnglishLocaleBundle]} schemaTypes={[]}>
      <RouterProvider router={router} state={{}} onNavigate={noop}>
        <Card padding={4} style={{maxWidth: 640}}>
          <Stack gap={5}>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                with conditions and document counts
              </Text>
              <Row variant={withDocuments} />
              <Row variant={withoutDocuments} />
            </Stack>
            <Stack gap={2}>
              <Text muted size={1} weight="medium">
                no conditions, count unavailable
              </Text>
              <Row variant={countUnavailable} />
            </Stack>
          </Stack>
        </Card>
      </RouterProvider>
    </TestWrapper>
  )
}
