import {ButtonTone, Card, CardTone, Flex, Text} from '@sanity/ui'
import React from 'react'
import {SpacerButton} from '../../../../components/spacerButton'
import {Button} from 'sanity/_internal-ui-components'

interface BannerProps {
  action?: {
    as?: React.ElementType | keyof JSX.IntrinsicElements
    icon?: React.ComponentType
    onClick?: () => void
    text: string
    tone?: ButtonTone
  }
  content: React.ReactNode
  icon?: React.ComponentType
  tone?: CardTone
}

export function Banner(props: BannerProps) {
  const {action, content, icon: Icon, tone = 'transparent', ...rest} = props

  return (
    <Card borderBottom paddingX={4} paddingY={2} tone={tone} {...rest}>
      <Flex align="center" gap={3}>
        {Icon && (
          <Text size={0}>
            <Icon />
          </Text>
        )}

        <Flex align="center" flex={1} gap={2} paddingY={3}>
          {content}
        </Flex>

        <SpacerButton />

        {action && (
          <Button
            as={action?.as}
            mode="ghost"
            onClick={action?.onClick}
            text={action.text}
            tone={action.tone || 'default'}
          />
        )}
      </Flex>
    </Card>
  )
}
