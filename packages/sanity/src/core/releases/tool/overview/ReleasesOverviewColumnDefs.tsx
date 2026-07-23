import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Flex, Text} from '@sanity/ui'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'

import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {RelativeTime} from '../../../components'
import {EditedByCell} from '../../../components/documentTable/EditedByCell'
import {getReleaseTiming} from '../../util/getReleaseTiming'
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
        style: {minWidth: 200, maxWidth: 420},
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
    // Schedule — the two-state timing in ONE adaptive column (see naming-model-decision.md):
    // 🔒 date (armed) / ⚠ date (intended, not scheduled) / "Unscheduled" (no date). This replaces
    // the old Type + When pair, which restated each other ("Undecided Undecided") and wrapped.
    checkColumnMode(
      {
        id: 'publishAt',
        sorting: true,
        sortTransform: (release, direction) => {
          const {date} = getReleaseTiming(release)
          // Unscheduled-with-no-date always sinks to the end, regardless of sort direction.
          if (date) return date.getTime()
          return direction === 'asc' ? Infinity : -Infinity
        },
        width: 280,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.schedule')} {...props} />
          </Flex>
        ),
        cell: ({cellProps, datum: release}) => {
          if (release.isLoading) return null

          return (
            <Flex {...cellProps} align="center" paddingX={2} paddingY={3} gap={2} sizing="border">
              <ReleaseTime release={release} compact />
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
        id: 'documentCount',
        sorting: true,
        sortTransform: (release) =>
          release.state === 'archived' || release.state === 'published'
            ? (release.finalDocumentStates?.length ?? 0)
            : (release.documentsMetadata?.documentCount ?? 0),
        width: 120,
        header: (props) => (
          <Flex {...props.headerProps} paddingY={3} sizing="border">
            <Headers.SortHeaderButton text={t('table-header.documents')} {...props} />
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
    // Status — ONE consolidated trailing signal (merges the former standalone error glyph and the
    // readiness column). Answers "is this release OK?" in one place, by priority:
    // publish failed (critical) › validation issues/loading › ready. Schedule-timing warnings
    // (intended-not-armed / overdue) live in the Schedule column, not here.
    checkColumnMode(
      {
        id: 'status',
        sorting: false,
        width: 50,
        style: {minWidth: 50, maxWidth: 50},
        header: ({headerProps}) => <Flex {...headerProps} paddingY={3} sizing="border" />,
        cell: ({datum: {isDeleted, error, state, _id}, cellProps}) => {
          const hasError = typeof error !== 'undefined' && state === 'active'

          return (
            <Flex
              {...cellProps}
              align="center"
              justify="center"
              paddingX={2}
              paddingY={3}
              sizing="border"
              data-testid="release-readiness"
            >
              {!isDeleted && hasError && (
                <Tooltip content={<Text size={1}>{t('failed-publish-title')}</Text>} portal>
                  <Text size={1}>
                    <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
                  </Text>
                </Tooltip>
              )}
              {!isDeleted && !hasError && state === 'active' && (
                <ReleaseColumnValidationLoading releaseId={_id} />
              )}
              {!isDeleted && state === 'scheduled' && (
                <Text size={1}>
                  <Tooltip content={t('summary.all-documents-validated')}>
                    <ToneIcon icon={CheckmarkCircleIcon} tone="positive" />
                  </Tooltip>
                </Text>
              )}
            </Flex>
          )
        },
      },
      'active',
    ),
  ].filter(filterNull)
}

// type guard to filter out undefined and null values
function filterNull<T>(value: T | undefined | null): value is T {
  return Boolean(value)
}
