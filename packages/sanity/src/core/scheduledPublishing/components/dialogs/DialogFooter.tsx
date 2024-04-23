import {type ButtonTone, Flex} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n/hooks/useTranslation'

interface Props {
  buttonText?: string
  disabled?: boolean
  icon?: ComponentType | ReactNode
  onAction?: () => void
  onComplete?: () => void
  tone?: ButtonTone
}

const DialogFooter = (props: Props) => {
  const {t} = useTranslation()

  const {buttonText = 'Action', disabled, icon, onAction, onComplete, tone = 'positive'} = props
  return (
    <Flex width="full" gap={3} justify="flex-end">
      <Button mode="bleed" onClick={onComplete} text={t('common.dialog.cancel-button.text')} />
      {onAction && (
        <Button disabled={disabled} icon={icon} onClick={onAction} text={buttonText} tone={tone} />
      )}
    </Flex>
  )
}

export default DialogFooter
