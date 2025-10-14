import {type ReleaseDocument, type ScheduleReleaseAction} from '@sanity/client'
import {Box, Flex, Stack, Text, useToast} from '@sanity/ui'
import {isPast} from 'date-fns'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {useClient} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'
import {Table} from '../components/Table/Table'
import {Headers} from '../components/Table/TableHeader'
import {type Column} from '../components/Table/types'
import {ScheduledDraftDocumentPreview} from './columnCells/ScheduledDraftDocumentPreview'
import {ScheduledDraftMetadataCell} from './columnCells/ScheduledDraftMetadataCell'
import {type TableRelease} from './ReleasesOverview'

interface ConfirmScheduledDraftsDialogProps {
  activeScheduledDrafts: ReleaseDocument[]
  onClose: () => void
}

const confirmScheduledDraftsColumnDefs = (
  t: TFunction<'releases', undefined>,
): Column<TableRelease>[] => [
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
    sorting: false,
    width: 300,
    header: (props) => (
      <Flex {...props.headerProps} paddingY={3} paddingX={2} sizing="border">
        <Headers.BasicHeader text={t('table-header.scheduled-for')} />
      </Flex>
    ),
    cell: ScheduledDraftMetadataCell,
  },
]

/**
 * Batches all schedule actions into a single server action
 */
function useScheduleActiveDrafts() {
  const client = useClient(RELEASES_STUDIO_CLIENT_OPTIONS)

  const scheduleActiveDrafts = useCallback(
    async (releases: ReleaseDocument[]) => {
      const scheduleActions: ScheduleReleaseAction[] = releases.flatMap((release) => {
        if (!release.metadata.intendedPublishAt) return []

        return [
          {
            actionType: 'sanity.action.release.schedule',
            releaseId: getReleaseIdFromReleaseDocumentId(release._id),
            publishAt: new Date(release.metadata.intendedPublishAt).toISOString(),
          },
        ]
      })

      await client.action(scheduleActions)
    },
    [client],
  )

  return {scheduleActiveDrafts}
}

export function ConfirmScheduledDraftsDialog({
  activeScheduledDrafts,
  onClose,
}: ConfirmScheduledDraftsDialogProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const toast = useToast()
  const {scheduleActiveDrafts} = useScheduleActiveDrafts()
  const [isScheduling, setIsScheduling] = useState(false)
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)

  const tableData = useMemo<TableRelease[]>(
    () =>
      activeScheduledDrafts.map((release) => ({
        ...release,
        publishAt: release.metadata.intendedPublishAt,
      })),
    [activeScheduledDrafts],
  )

  const columnDefs = useMemo<Column<TableRelease>[]>(() => confirmScheduledDraftsColumnDefs(t), [t])

  const hasPastDates = useMemo(
    () =>
      activeScheduledDrafts.some(
        (release) =>
          release.metadata.intendedPublishAt &&
          isPast(new Date(release.metadata.intendedPublishAt)),
      ),
    [activeScheduledDrafts],
  )

  const handleConfirmSchedules = useCallback(async () => {
    setIsScheduling(true)

    try {
      await scheduleActiveDrafts(activeScheduledDrafts)
      onClose()
    } catch (error) {
      toast.push({
        status: 'error',
        title: t('toast.confirm-active-scheduled-drafts.error', {error: error.message}),
      })
    }
    setIsScheduling(false)
  }, [activeScheduledDrafts, scheduleActiveDrafts, onClose, toast, t])

  return (
    <Dialog
      id="confirm-active-scheduled-drafts-dialog"
      header={t('confirm-active-scheduled-drafts-dialog.title')}
      onClose={onClose}
      width={2}
      padding={false}
      footer={{
        confirmButton: {
          text: t('confirm-active-scheduled-drafts-dialog.confirm-button'),
          tone: 'primary',
          onClick: handleConfirmSchedules,
          loading: isScheduling,
          disabled: isScheduling,
        },
      }}
    >
      <Stack space={4}>
        <Box paddingX={4} paddingTop={4}>
          <Stack space={3}>
            <Text size={1} muted>
              {t('confirm-active-scheduled-drafts-dialog.description')}
            </Text>
            {hasPastDates && (
              <Text size={1} muted>
                {t('confirm-active-scheduled-drafts-dialog.past-dates-warning')}
              </Text>
            )}
          </Stack>
        </Box>

        <Box
          ref={setScrollContainerRef}
          style={{height: '400px', overflow: 'auto', position: 'relative'}}
        >
          <Table<TableRelease>
            data={tableData}
            columnDefs={columnDefs}
            emptyState={t('no-scheduled-drafts')}
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            rowId="_id"
            scrollContainerRef={scrollContainerRef}
            hideTableInlinePadding
          />
        </Box>
      </Stack>
    </Dialog>
  )
}
