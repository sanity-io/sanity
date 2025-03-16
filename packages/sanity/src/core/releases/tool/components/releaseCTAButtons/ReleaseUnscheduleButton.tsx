import {CloseCircleIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {Translate, useTranslation} from '../../../../i18n'
import {UnscheduledRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {type ReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleaseScheduleButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

export const ReleaseUnscheduleButton = ({
  release,
  disabled,
  documents,
}: ReleaseScheduleButtonProps) => {
  const toast = useToast()
  const {unschedule} = useReleaseOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const telemetry = useTelemetry()
  const [status, setStatus] = useState<'idle' | 'confirm' | 'unscheduling'>('idle')

  const handleConfirmSchedule = useCallback(async () => {
    try {
      setStatus('unscheduling')
      await unschedule(release._id)
      telemetry.log(UnscheduledRelease)
    } catch (schedulingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.unschedule.error"
              values={{
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                error: schedulingError.message,
              }}
            />
          </Text>
        ),
      })
      console.error(schedulingError)
    } finally {
      setStatus('idle')
    }
  }, [unschedule, release._id, release.metadata.title, telemetry, toast, t, tCore])

  const confirmScheduleDialog = useMemo(() => {
    if (status === 'idle') return null

    return (
      <Dialog
        id="confirm-unschedule-dialog"
        header={t('unschedule-dialog.confirm-title')}
        onClose={() => status !== 'unscheduling' && setStatus('idle')}
        footer={{
          confirmButton: {
            text: t('action.unschedule'),
            tone: 'default',
            onClick: handleConfirmSchedule,
            loading: status === 'unscheduling',
            disabled: status === 'unscheduling',
          },
          cancelButton: {
            disabled: status === 'unscheduling',
          },
        }}
      >
        <Text muted size={1}>
          {
            <Translate
              t={t}
              i18nKey="unschedule-dialog.confirm-description"
              values={{
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                documentsLength: documents.length,
                count: documents.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [release.metadata.title, documents.length, handleConfirmSchedule, status, t, tCore])

  return (
    <>
      <Button
        icon={CloseCircleIcon}
        disabled={disabled || status === 'unscheduling'}
        text={t('action.unschedule')}
        onClick={() => setStatus('confirm')}
        loading={status === 'unscheduling'}
        data-testid="schedule-button"
      />
      {confirmScheduleDialog}
    </>
  )
}
