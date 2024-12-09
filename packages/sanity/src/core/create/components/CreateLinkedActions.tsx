import {LaunchIcon} from '@sanity/icons'
import {Flex, PortalProvider, usePortal} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {getCreateDocumentUrl} from '../createDocumentUrls'
import {createLocaleNamespace} from '../i18n'
import {type CreateLinkedActionsProps} from '../types'
import {useSanityCreateTelemetry} from '../useSanityCreateTelemetry'
import {CreateUnlinkConfirmDialog} from './CreateUnlinkConfirmDialog'

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
        paddingY={3}
        href={href}
        target="_blank"
        onClick={onEditInCreateClicked}
      />
      <Button text={t('unlink-from-create-button.text')} paddingY={3} onClick={confirmUnlink} />
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

function DialogPortalProvider(props: {portalElementId: string; children: ReactNode}) {
  const {children, portalElementId} = props
  const {element, elements} = usePortal()
  const portalElement = elements?.[portalElementId] || element

  return <PortalProvider element={portalElement}>{children}</PortalProvider>
}
