import {Flex} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'

import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ScheduledDraftDocumentPreview} from './columnCells/ScheduledDraftDocumentPreview'
import {ScheduledDraftMetadataCell} from './columnCells/ScheduledDraftMetadataCell'
import {type Mode} from './queryParamUtils'
import {type TableRelease} from './ReleasesOverview'

export const scheduledDraftsOverviewColumnDefs: (
  t: TFunction<'releases', undefined>,
  releaseGroupMode: Mode,
) => Column<TableRelease>[] = (t, releaseGroupMode) => {
  return [
    {
      id: 'documentPreview',
      sorting: false,
      width: null,
      style: {flex: 1},
      header: (props) => (
        <Flex {...props.headerProps} paddingLeft={2} paddingRight={2} paddingY={3} sizing="border">
          <Headers.BasicHeader text={t('table-header.document')} />
        </Flex>
      ),
      cell: ScheduledDraftDocumentPreview,
    },
    {
      id: 'publishAt',
      sorting: true,
      width: 300,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3} paddingX={2} sizing="border">
          <Headers.SortHeaderButton
            {...props}
            text={
              releaseGroupMode === 'archived'
                ? t('table-header.scheduled-draft.published-at')
                : t('table-header.scheduled-for')
            }
          />
        </Flex>
      ),
      cell: ScheduledDraftMetadataCell,
    },
  ]
}
