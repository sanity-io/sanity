import {type ButtonMode, type ButtonTone, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type ComponentType, type ElementType, type ReactNode} from 'react'

import {Button} from '../../../../../ui-components'

interface BannerProps {
  action?: {
    as?: ElementType | keyof React.JSX.IntrinsicElements
    icon?: ComponentType
    onClick?: () => void
    text: string
    tone?: ButtonTone
    disabled?: boolean
    mode?: ButtonMode
  }
  content: ReactNode
  icon?: ComponentType
  tone?: CardTone
  paddingY?: number
}

export function Banner(props: BannerProps) {
  const {action, content, icon: Icon, tone = 'transparent', paddingY = 2, ...rest} = props

  return (
    <Card borderBottom paddingX={4} paddingY={paddingY} tone={tone} {...rest}>
      <Flex align="center" gap={3}>
        {Icon && (
          <Text size={0}>
            <Icon />
          </Text>
        )}

        <Flex align="center" flex={1} gap={2} paddingY={3}>
          {content}
        </Flex>

        {action && (
          <Button {...action} mode={action.mode || 'ghost'} tone={action.tone || 'default'} />
        )}
      </Flex>
    </Card>
  )
}
