import {type ReleaseDocument} from '@sanity/client'
import {useToast} from '@sanity/ui/toast'
import {type MouseEvent, useState} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {ScheduleDraftDialog} from '../../singleDocRelease/components/ScheduleDraftDialog'
import {useScheduleDraftOperations} from '../../singleDocRelease/hooks/useScheduleDraftOperations'

/**
 * The paused scheduled draft set's way back: schedules it again from the inventory, with the
 * same dialog and operation as the document footer's Schedule publish, starting from the date it
 * was paused with.
 *
 * @internal
 */
export function ScheduleDraftAction({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const toast = useToast()
  const {rescheduleScheduledDraft} = useScheduleDraftOperations()
  const [status, setStatus] = useState<'idle' | 'open' | 'scheduling'>('idle')
  const intendedPublishAt = release.metadata.intendedPublishAt

  const handleSchedule = (publishAt: Date) => {
    setStatus('scheduling')
    rescheduleScheduledDraft(release, publishAt)
      .then(() => setStatus('idle'))
      .catch((error: Error) => {
        setStatus('open')
        toast.push({
          status: 'error',
          title: t('document-group.scheduled-draft.schedule.error'),
          description: error.message,
          closable: true,
        })
      })
  }

  return (
    <>
      <Button
        data-testid="schedule-draft-action"
        // Outlined, like Unschedule, so it has a visible edge on the header band
        mode="ghost"
        // Above the header's toggle, so a click opens the dialog, not the set
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          setStatus('open')
        }}
        text={t('document-group.scheduled-draft.schedule.action')}
        tooltipProps={{content: t('document-group.scheduled-draft.schedule.tooltip')}}
      />
      {status !== 'idle' && (
        <ScheduleDraftDialog
          onClose={() => status !== 'scheduling' && setStatus('idle')}
          onSchedule={handleSchedule}
          loading={status === 'scheduling'}
          initialDate={intendedPublishAt ? new Date(intendedPublishAt) : undefined}
        />
      )}
    </>
  )
}
