import {LaunchIcon} from '@sanity/icons'
import {Flex} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {getCreateDocumentUrl} from '../createDocumentUrls'
import {createLocaleNamespace} from '../i18n'
import {type CreateLinkedActionsProps} from '../types'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'
import {CreateUnlinkConfirmDialog} from './CreateUnlinkConfirmDialog'
import {DialogPortalProvider} from './DialogPortalProvider'

export function CreateLinkedActions(props: CreateLinkedActionsProps) {
  const {metadata, panelPortalElementId, onDocumentChange, documentTitle} = props
  const {t} = useTranslation(createLocaleNamespace)
  const href = getCreateDocumentUrl(metadata)

  const telemetry = useSanityCreateTelemetry()

  const onEditInCreateClicked = useCallback(() => telemetry.documentOpened(), [telemetry])

  const [unlinkConfirm, setUnlinkConfirm] = useState(false)

  const confirmUnlink = useCallback(() => {
    setUnlinkConfirm(true)
    telemetry.unlinkCtaClicked()
  }, [telemetry])

  const cancelUnlink = useCallback(() => setUnlinkConfirm(false), [])
  return (
    <Flex gap={2}>
      <Button
        as={'a'}
        text={t('edit-in-create-button.text')}
        iconRight={LaunchIcon}
        mode="ghost"
        href={href}
        target="_blank"
        onClick={onEditInCreateClicked}
      />
      <Button text={t('unlink-from-create-button.text')} onClick={confirmUnlink} />
      {unlinkConfirm && (
        <DialogPortalProvider portalElementId={panelPortalElementId}>
          <CreateUnlinkConfirmDialog
            onClose={cancelUnlink}
            onDocumentChange={onDocumentChange}
            documentTitle={documentTitle}
          />
        </DialogPortalProvider>
      )}
    </Flex>
  )
}
