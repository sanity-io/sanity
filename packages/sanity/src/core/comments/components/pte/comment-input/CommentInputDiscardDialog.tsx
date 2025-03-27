import {DialogProvider, Text} from '@sanity/ui'
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

  return (
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
        tone="default"
      >
        <Text size={1}>{t('discard.text')}</Text>
      </Dialog>
    </DialogProvider>
  )
}
