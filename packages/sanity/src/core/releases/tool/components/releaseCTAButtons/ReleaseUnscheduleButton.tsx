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
  const telemetry = useTelemetry()
  const [status, setStatus] = useState<'idle' | 'confirm' | 'unscheduling'>('idle')

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)
  const isScheduleButtonDisabled = disabled || isValidatingDocuments || hasDocumentValidationErrors

  const handleConfirmSchedule = useCallback(async () => {
    try {
      setStatus('unscheduling')
      await unschedule(release._id)
      telemetry.log(UnscheduledRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.unschedule.success"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
    } catch (schedulingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.unschedule.error"
              values={{title: release.metadata.title, error: schedulingError.message}}
            />
          </Text>
        ),
      })
      console.error(schedulingError)
    } finally {
      setStatus('idle')
    }
  }, [unschedule, release._id, release.metadata.title, telemetry, toast, t])

  const confirmScheduleDialog = useMemo(() => {
    if (status === 'idle') return null

    return (
      <Dialog
        id="confirm-unschedule-dialog"
        header={t('unschedule-dialog.confirm-title')}
        onClose={() => setStatus('idle')}
        footer={{
          confirmButton: {
            text: t('action.unschedule'),
            tone: 'default',
            onClick: handleConfirmSchedule,
            loading: status === 'unscheduling',
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
                title: release.metadata.title,
                documentsLength: documents.length,
                count: documents.length,
              }}
            />
          }
        </Text>
      </Dialog>
    )
  }, [release.metadata.title, documents.length, handleConfirmSchedule, status, t])

  return (
    <>
      <Button
        icon={CloseCircleIcon}
        disabled={isScheduleButtonDisabled || status === 'unscheduling'}
        text={t('action.unschedule')}
        onClick={() => setStatus('confirm')}
        loading={status === 'unscheduling'}
        data-testid="schedule-button"
      />
      {confirmScheduleDialog}
    </>
  )
}
