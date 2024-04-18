import {DialogProvider, Text, ThemeColorProvider} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'

import {Dialog} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {commentsLocaleNamespace} from '../../../i18n'

const Z_OFFSET = 9999999 // Change to appropriate z-offset

/**
 * @beta
 * @hidden
 */
export interface CommentInputDiscardDialogProps {
  onClose: () => void
  onConfirm: () => void
}

/**
 * @beta
 * @hidden
 */
export function CommentInputDiscardDialog(props: CommentInputDiscardDialogProps) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {onClose, onConfirm} = props

  const handleCancelClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onClose()
    },
    [onClose],
  )

  const handleConfirmClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onConfirm()
    },
    [onConfirm],
  )

  // The ThemeColorProvider is needed to make sure that the backdrop of the dialog not
  // inherits the tone of parent color providers.
  // The PortalProvider and DialogProvider is needed to make sure that the dialog is
  // rendered fullscreen and not scoped to the form view.
  return (
    <ThemeColorProvider tone="default">
      <DialogProvider zOffset={Z_OFFSET}>
        <Dialog
          header={t('discard.header')}
          id="discard-comment-dialog"
          onClose={onClose}
          width={0}
          onClickOutside={onClose}
          footer={{
            cancelButton: {
              onClick: handleCancelClick,
            },
            confirmButton: {
              onClick: handleConfirmClick,
              text: t('discard.button-confirm'),
              tone: 'critical',
            },
          }}
        >
          <Text size={1}>{t('discard.text')}</Text>
        </Dialog>
      </DialogProvider>
    </ThemeColorProvider>
  )
}
