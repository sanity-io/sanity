import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Flex, Text} from '@sanity/ui'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RelativeTime} from '../../../components'
import {EditedByCell} from '../../../components/documentTable/EditedByCell'
import {getIsScheduledDateInPast} from '../../util/getIsScheduledDateInPast'
import {getPublishDateFromRelease} from '../../util/util'
import {ReleaseTime} from '../components/ReleaseTime'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ReleaseColumnValidationLoading} from './columnCells/ReleaseColumnValidationLoading'
import {ReleaseDocumentsCounter} from './columnCells/ReleaseDocumentsCounter'
import {ReleaseNameCell} from './columnCells/ReleaseName'
import {type Mode} from './queryParamUtils'
import {type TableRelease} from './ReleasesOverview'

const enableColumnFormMode =
  (currentMode: Mode) => (column: Column<TableRelease>, expectedMode: Mode | 'all') => {
    if (!currentMode) throw new Error('currentMode is required')
    if (expectedMode === 'all' || expectedMode === currentMode) {
      return column
    }
    return undefined
  }

export const releasesOverviewColumnDefs: (
  t: TFunction<'releases'>,
  releaseGroupMode: Mode,
) => Column<TableRelease>[] = (t, releaseGroupMode) => {
  const checkColumnMode = enableColumnFormMode(releaseGroupMode)
  return [
    checkColumnMode(
      {
        id: 'metadata.title',
        sorting: true,
        width: null,
        style: {minWidth: 'min(50%, calc(100vw - 80px))', maxWidth: 'min(50%, calc(100vw - 80px))'},
        header: (props) => (
          <Flex
            {...props.headerProps}
            flex={1}
            paddingLeft={6}
            width={3}
            paddingRight={2}
            paddingY={3}
            sizing="border"
          >
            <Headers.SortHeaderButton {...props} text={t('table-header.title')} />
          </Flex>
        ),
        cell: ReleaseNameCell,
      },
      'all',
    ),
    // Release TYPE as a real, sortable field (not just the row icon) — and distinct from schedule
    // STATUS: the 'scheduled' type shows as "At time" so it doesn't double-speak with the "Scheduled"
    // vs "Not scheduled" status shown in the When column.
    checkColumnMode(
      {
        id: 'metadata.releaseType',
        sorting: true,
        width: 120,
        sortTransform: (release) => {
          const order: Record<string, number> = {asap: 0, scheduled: 1, undecided: 2}
          return order[release.metadata?.releaseType] ?? 3
        },
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton paddingLeft={2} text={t('table-header.type')} {...props} />
          </Flex>
        ),
        cell: ({datum: release, cellProps}) => {
          if (release.isLoading) return null
          const labelKey: Record<string, string> = {
            asap: 'overview.release-type.asap',
            scheduled: 'overview.release-type.scheduled',
            undecided: 'overview.release-type.undecided',
          }
          const key = labelKey[release.metadata?.releaseType]
          return (
            <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
              <Text size={1} muted>
                {key ? t(key) : '-'}
              </Text>
            </Flex>
          )
        },
      },
      'all',
    ),
    checkColumnMode(
      {
        id: 'publishAt',
        sorting: true,
        sortTransform: (release) => {
          if (release.metadata.releaseType === 'undecided') return Infinity

          const publishDate = getPublishDateFromRelease(release)

          if (release.metadata.releaseType === 'asap' || !publishDate) return 0
          return new Date(publishDate).getTime()
        },
        width: 280,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.when')} {...props} />
          </Flex>
        ),
        cell: ({cellProps, datum: release}) => {
          if (release.isLoading) return null

          return (
            <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
              <ReleaseTime release={release} />
            </Flex>
          )
        },
      },
      'active',
    ),
    // This is a hidden column only used for sorting when
    // no other sort column is selected (the default state)
    checkColumnMode(
      {
        id: 'lastActivity',
        hidden: true,
        sorting: true,
        width: 100,
        sortTransform: ({publishedAt, _updatedAt}) => {
          // the default sort is always descending, so -Infinity pushes missing values to end
          const lastActivity = publishedAt ?? _updatedAt

          return lastActivity ? new Date(lastActivity).getTime() : -Infinity
        },
      },
      'archived',
    ),
    checkColumnMode(
      {
        id: 'publishedAt',
        sorting: true,
        sortTransform: (release, direction) => {
          if (release.state !== 'published') {
            if (direction === 'asc') return Infinity
            return -Infinity
          }
          if (!release.publishedAt) return release._updatedAt
          return new Date(release.publishedAt).getTime()
        },
        width: 250,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.published-at')} {...props} />
          </Flex>
        ),
        cell: ({cellProps, datum: release}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
            <Text muted size={1}>
              {release.publishedAt ? (
                // Assuming releases are not updated after archiving.
                // If we realize this is miss leading for customers and they have edited the release after archiving
                // we can use the history endpoint to get the archived change.
                <RelativeTime time={release.publishedAt} useTemporalPhrase minimal />
              ) : (
                '-'
              )}
            </Text>
          </Flex>
        ),
      },
      'archived',
    ),
    checkColumnMode(
      {
        id: '_updatedAt',
        sorting: true,
        sortTransform: (release, direction) => {
          if (release.state !== 'archived') {
            if (direction === 'asc') return Infinity
            return -Infinity
          }

          return new Date(release._updatedAt).getTime()
        },
        width: 250,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.archivedAt')} {...props} />
          </Flex>
        ),
        cell: ({cellProps, datum: release}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
            <Text muted size={1}>
              {release.state === 'archived' ? (
                // Assuming releases are not updated after archiving.
                // If we later realize this is miss leading for customers and they have edited the release after archiving
                // we can use the history endpoint to get the archived change.
                <RelativeTime time={release._updatedAt} useTemporalPhrase minimal />
              ) : (
                '-'
              )}
            </Text>
          </Flex>
        ),
      },
      'archived',
    ),
    checkColumnMode(
      {
        id: 'documentsMetadata.updatedAt',
        sorting: true,
        width: 150,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton
              paddingLeft={2}
              text={t('table-header.last-edited')}
              {...props}
            />
          </Flex>
        ),
        cell: ({datum: {documentsMetadata, _updatedAt}, cellProps}) => {
          const updatedAtDate = documentsMetadata?.updatedAt ?? _updatedAt
          return (
            <Flex {...cellProps} align="center" gap={2} paddingX={2} paddingY={3} sizing="border">
              <Text muted size={1}>
                {updatedAtDate ? (
                  <RelativeTime time={updatedAtDate} useTemporalPhrase minimal />
                ) : (
                  '-'
                )}
              </Text>
            </Flex>
          )
        },
      },
      'active',
    ),
    // Edited by — immediately after "Last edited" (reads "edited <time> by <person>"), mirroring the
    // detail tables. Non-sortable: resolving the editor front-loads per-row history. A release is a
    // document, so the shared translog resolver works directly on release._id/_rev.
    checkColumnMode(
      {
        id: 'editedBy',
        sorting: false,
        width: 170,
        style: {minWidth: 44, maxWidth: 170},
        header: ({headerProps}) => (
          <Flex {...headerProps} align="center" paddingX={2} paddingY={3} sizing="border">
            <Text muted size={1} weight="medium">
              {t('table-header.edited-by')}
            </Text>
          </Flex>
        ),
        cell: ({datum: release, cellProps}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border">
            {!release.isLoading && !release.isDeleted && (
              <EditedByCell documentId={release._id} revision={release._rev} />
            )}
          </Flex>
        ),
      },
      'active',
    ),
    checkColumnMode(
      {
        id: 'error',
        sorting: false,
        width: 40,
        header: ({headerProps}) => <Flex {...headerProps} paddingY={3} sizing="border" />,
        cell: ({datum, cellProps}) => {
          const {error, state} = datum
          const hasError = typeof error !== 'undefined' && state === 'active'
          const hasWarning = state === 'active' && getIsScheduledDateInPast(datum)

          return (
            <Flex
              {...cellProps}
              align="center"
              gap={2}
              paddingX={2}
              paddingY={3}
              sizing="border"
              data-testid="error-indicator"
            >
              {hasError && (
                <Tooltip content={<Text size={1}>{t('failed-publish-title')}</Text>} portal>
                  <Text size={1}>
                    <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                  </Text>
                </Tooltip>
              )}
              {hasWarning && (
                <Tooltip content={<Text size={1}>{t('passed-intended-publish-date')}</Text>} portal>
                  <Text size={1}>
                    <ToneIcon icon={WarningOutlineIcon} tone="caution" />
                  </Text>
                </Tooltip>
              )}
            </Flex>
          )
        },
      },
      'all',
    ),
    checkColumnMode(
      {
        id: 'documentCount',
        sorting: false,
        width: 120,
        header: ({headerProps}) => (
          <Flex {...headerProps} paddingY={3} sizing="border">
            <Headers.BasicHeader text={t('table-header.documents')} />
          </Flex>
        ),
        cell: ({datum: {isDeleted, state, finalDocumentStates, documentsMetadata}, cellProps}) => (
          <Flex {...cellProps} align="center" paddingX={2} paddingY={3} sizing="border" gap={2}>
            {!isDeleted && (
              <ReleaseDocumentsCounter
                documentCount={
                  state === 'archived' || state === 'published'
                    ? finalDocumentStates?.length
                    : documentsMetadata?.documentCount
                }
              />
            )}
          </Flex>
        ),
      },
      'all',
    ),
    // Readiness — a dedicated trailing column mirroring the detail tables' validation column, so
    // "is this release ready?" is a consistent signal you can scan straight down rather than a glyph
    // tucked inside the document-count cell. Active releases validate their documents; scheduled
    // releases are locked and therefore valid.
    checkColumnMode(
      {
        id: 'validation',
        sorting: false,
        width: 50,
        style: {minWidth: 50, maxWidth: 50},
        header: ({headerProps}) => <Flex {...headerProps} paddingY={3} sizing="border" />,
        cell: ({datum: {isDeleted, state, _id}, cellProps}) => (
          <Flex
            {...cellProps}
            align="center"
            justify="center"
            paddingX={2}
            paddingY={3}
            sizing="border"
            data-testid="release-readiness"
          >
            {!isDeleted && state === 'active' && <ReleaseColumnValidationLoading releaseId={_id} />}
            {!isDeleted && state === 'scheduled' && (
              <Text size={1}>
                <Tooltip content={t('summary.all-documents-validated')}>
                  <ToneIcon icon={CheckmarkCircleIcon} tone="positive" />
                </Tooltip>
              </Text>
            )}
          </Flex>
        ),
      },
      'active',
    ),
  ].filter(filterNull)
}

// type guard to filter out undefined and null values
function filterNull<T>(value: T | undefined | null): value is T {
  return Boolean(value)
}
