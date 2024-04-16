import {
  // eslint-disable-next-line no-restricted-imports
  Button,
  type ButtonTone,
  Card,
  Flex,
} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'

interface Props {
  buttonText?: string
  disabled?: boolean
  icon?: ComponentType | ReactNode
  onAction?: () => void
  onComplete?: () => void
  tone?: ButtonTone
}

const DialogFooter = (props: Props) => {
  const {buttonText = 'Action', disabled, icon, onAction, onComplete, tone = 'positive'} = props
  return (
    <Flex>
      <Card flex={1}>
        <Button mode="bleed" onClick={onComplete} style={{width: '100%'}} text="Cancel" />
      </Card>
      {onAction && (
        <Card flex={1} marginLeft={3}>
          <Button
            disabled={disabled}
            icon={icon}
            onClick={onAction}
            style={{width: '100%'}}
            text={buttonText}
            tone={tone}
          />
        </Card>
      )}
    </Flex>
  )
}

export default DialogFooter
