import {type ButtonMode, type ButtonTone, Card, type CardTone, Flex, Text} from '@sanity/ui'
import {type ComponentType, type ElementType, type JSX, type ReactNode} from 'react'

import {Button} from '../../../../../ui-components'

interface BannerProps {
  action?: {
    as?: ElementType | keyof JSX.IntrinsicElements
    icon?: ComponentType
    onClick?: () => void
    text: string
    tone?: ButtonTone
    mode?: ButtonMode
  }
  content: ReactNode
  icon?: ComponentType
  tone?: CardTone
  center?: boolean
}

export function Banner(props: BannerProps) {
  const {action, center, content, icon: Icon, tone = 'transparent', ...rest} = props

  return (
    <Card borderBottom paddingX={4} paddingY={2} tone={tone} {...rest}>
      <Flex align="center" justify={center ? 'center' : undefined} gap={3}>
        {Icon && (
          <Text size={0}>
            <Icon />
          </Text>
        )}

        <Flex align="center" flex={center ? undefined : 1} gap={2} paddingY={3}>
          {content}
        </Flex>

        {action && (
          <Button
            as={action?.as}
            mode={action.mode || 'ghost'}
            onClick={action?.onClick}
            text={action.text}
            tone={action.tone || 'default'}
          />
        )}
      </Flex>
    </Card>
  )
}
