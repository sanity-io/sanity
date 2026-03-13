import {type ReleaseDocument, type ScheduleReleaseAction} from '@sanity/client'
import {Stack, Text, useToast} from '@sanity/ui'
import {isPast} from 'date-fns/isPast'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {useClient} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'

interface ConfirmScheduledDraftsDialogProps {
  activeScheduledDrafts: ReleaseDocument[]
  onClose: () => void
}

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
      width={0}
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
    </Dialog>
  )
}
