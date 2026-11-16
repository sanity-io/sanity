import {type ButtonMode, type ButtonTone, Card, type CardTone} from '@sanity/ui'
import {type ComponentType, type ElementType, type ReactNode} from 'react'
import {Flex, Box, Icon} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {type TooltipProps} from '../../../../../ui-components/tooltip/Tooltip'

interface BannerProps {
  action?: {
    as?: ElementType | keyof React.JSX.IntrinsicElements
    icon?: ComponentType
    onClick?: () => void
    text: string
    tone?: ButtonTone
    disabled?: boolean
    mode?: ButtonMode
    tooltipProps?: TooltipProps | null
  }
  content: ReactNode
  icon?: ComponentType
  tone?: CardTone
  paddingY?: number
}

export function Banner(props: BannerProps) {
  const {action, content, icon: BannerIcon, tone = 'transparent', paddingY = 2, ...rest} = props
  const iconTone =
    tone === 'default' || tone === 'inherit' || tone === 'primary' || tone === 'transparent'
      ? undefined
      : tone

  return (
    <Box padding={1}>
      <Card radius={3} paddingX={2} paddingY={paddingY} tone={tone} {...rest}>
        <Flex alignItems="center" gap={3} paddingX={2}>
          {BannerIcon && (
            <Icon
              muted={!(tone === 'inherit' || tone === 'primary')}
              size={0}
              icon={BannerIcon}
              tone={iconTone}
              style={{
                margin: '-0.3125rem',
                ...((tone === 'inherit' || tone === 'primary') && {
                  color: 'var(--card-icon-color)',
                }),
              }}
            />
          )}

          <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} paddingY={2}>
            {content}
          </Flex>

          {action && (
            <Button {...action} mode={action.mode || 'ghost'} tone={action.tone || 'default'} />
          )}
        </Flex>
      </Card>
    </Box>
  )
}
