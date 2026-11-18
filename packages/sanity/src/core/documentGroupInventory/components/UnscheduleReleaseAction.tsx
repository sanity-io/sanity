import {type ReleaseDocument} from '@sanity/client'
import {useToast} from '@sanity/ui/toast'
import {type MouseEvent, useState} from 'react'
import {Text} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {useReleaseOperations} from '../../releases/store/useReleaseOperations'
import {isCardinalityOneRelease} from '../../util/releaseUtils'

const RELEASE_KEYS = {
  action: 'document-group.release.unschedule.action',
  tooltip: 'document-group.release.unschedule.tooltip',
  title: 'document-group.release.unschedule.title',
  description: 'document-group.release.unschedule.description',
  confirm: 'document-group.release.unschedule.confirm',
  error: 'document-group.release.unschedule.error',
} as const

const SCHEDULED_DRAFT_KEYS = {
  action: 'document-group.scheduled-draft.pause.action',
  tooltip: 'document-group.scheduled-draft.pause.tooltip',
  title: 'document-group.scheduled-draft.pause.title',
  description: 'document-group.scheduled-draft.pause.description',
  confirm: 'document-group.scheduled-draft.pause.confirm',
  error: 'document-group.scheduled-draft.pause.error',
} as const

/**
 * The scheduled release set's way out: its versions cannot be changed while the release is
 * scheduled, so the set header offers to unschedule it. Unscheduling acts on the whole release,
 * every document in it, so it asks first and says so. A scheduled draft is a release of one
 * document, and the rest of Studio calls unscheduling it pausing, so its words say that instead.
 *
 * @internal
 */
export function UnscheduleReleaseAction({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const toast = useToast()
  const {unschedule} = useReleaseOperations()
  const [status, setStatus] = useState<'idle' | 'confirm' | 'unscheduling'>('idle')
  const title = release.metadata.title || t('release.placeholder-untitled-release')
  const copy = isCardinalityOneRelease(release) ? SCHEDULED_DRAFT_KEYS : RELEASE_KEYS

  const handleConfirm = () => {
    setStatus('unscheduling')
    unschedule(release._id)
      .catch((error: Error) => {
        toast.push({
          status: 'error',
          title: t(copy.error, {title}),
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
        text={t(copy.action)}
        tooltipProps={{content: t(copy.tooltip)}}
      />
      {status !== 'idle' && (
        <Dialog
          id="inventory-unschedule-release-dialog"
          header={t(copy.title, {title})}
          onClose={() => status !== 'unscheduling' && setStatus('idle')}
          footer={{
            confirmButton: {
              text: t(copy.confirm),
              tone: 'default',
              onClick: handleConfirm,
              loading: status === 'unscheduling',
              disabled: status === 'unscheduling',
            },
            cancelButton: {disabled: status === 'unscheduling'},
          }}
        >
          <Text muted size={1} as="div">
            {t(copy.description)}
          </Text>
        </Dialog>
      )}
    </>
  )
}
