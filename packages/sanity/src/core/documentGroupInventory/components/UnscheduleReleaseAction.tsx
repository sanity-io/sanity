import {type ReleaseDocument} from '@sanity/client'
import {useToast} from '@sanity/ui/toast'
import {type MouseEvent, useState} from 'react'
import {Text} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {useReleaseOperations} from '../../releases/store/useReleaseOperations'

/**
 * The scheduled release set's way out: its versions cannot be changed while the release is
 * scheduled, so the set header offers to unschedule it. Unscheduling acts on the whole release,
 * every document in it, so it asks first and says so.
 *
 * @internal
 */
export function UnscheduleReleaseAction({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const toast = useToast()
  const {unschedule} = useReleaseOperations()
  const [status, setStatus] = useState<'idle' | 'confirm' | 'unscheduling'>('idle')
  const title = release.metadata.title || t('release.placeholder-untitled-release')

  const handleConfirm = () => {
    setStatus('unscheduling')
    unschedule(release._id)
      .catch((error: Error) => {
        toast.push({
          status: 'error',
          title: t('document-group.release.unschedule.error', {title}),
          description: error.message,
          closable: true,
        })
      })
      .finally(() => setStatus('idle'))
  }

  return (
    <>
      <Button
        data-testid="unschedule-release-action"
        // Outlined, so it has a visible edge on the header band in light and dark
        mode="ghost"
        // Above the header's toggle, so a click opens the dialog, not the set
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          setStatus('confirm')
        }}
        text={t('document-group.release.unschedule.action')}
        tooltipProps={{content: t('document-group.release.unschedule.tooltip')}}
      />
      {status !== 'idle' && (
        <Dialog
          id="inventory-unschedule-release-dialog"
          header={t('document-group.release.unschedule.title', {title})}
          onClose={() => status !== 'unscheduling' && setStatus('idle')}
          footer={{
            confirmButton: {
              text: t('document-group.release.unschedule.confirm'),
              tone: 'default',
              onClick: handleConfirm,
              loading: status === 'unscheduling',
              disabled: status === 'unscheduling',
            },
            cancelButton: {disabled: status === 'unscheduling'},
          }}
        >
          <Text muted size={1} as="div">
            {t('document-group.release.unschedule.description')}
          </Text>
        </Dialog>
      )}
    </>
  )
}
