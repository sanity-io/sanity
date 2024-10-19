import {LaunchIcon} from '@sanity/icons'
import {Flex, PortalProvider, usePortal} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'
import {type CreateLinkedActionsProps} from '../types'
import {useCreateDocumentUrl} from '../useCreateDocumentUrl'
import {CreateUnlinkConfirmDialog} from './CreateUnlinkConfirmDialog'

export function CreateLinkedActions(props: CreateLinkedActionsProps) {
  const {metadata, panelPortalElementId} = props
  const {t} = useTranslation(createLocaleNamespace)
  const href = useCreateDocumentUrl(metadata)

  const [unlinkConfirm, setUnlinkConfirm] = useState(false)

  const confirmUnlink = useCallback(() => setUnlinkConfirm(true), [])
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
      />
      <Button text={t('unlink-from-create-button.text')} paddingY={3} onClick={confirmUnlink} />
      {unlinkConfirm && (
        <DialogPortalProvider portalElementId={panelPortalElementId}>
          <CreateUnlinkConfirmDialog onClose={cancelUnlink} />
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
