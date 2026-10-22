import {type ButtonMode, type ButtonTone, Card, type CardTone, Text} from '@sanity/ui'
import {type ComponentType, type ElementType, type ReactNode} from 'react'
import {Box} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {
  action as actionSlot,
  content as contentColumn,
  icon as iconCell,
  root,
  row,
  text,
} from './Banner.css'

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
    <Box padding={1}>
      <Card radius={3} paddingX={2} paddingY={paddingY} tone={tone} {...rest}>
        {/* PROPOSED (Studio-wide): the text is at most 720px and wraps, and the action's column hugs its button, 16px after the text and at the
            right edge; a banner with no action has no column. On a narrow banner the action goes under the text. */}
        <div className={root}>
          <div className={row}>
            <div className={text}>
              {Icon && (
                <div className={iconCell}>
                  <Text size={0}>
                    <Icon />
                  </Text>
                </div>
              )}
              <div className={contentColumn}>{content}</div>
            </div>
            {/* With an action, the text and the action's column; without one, the text takes the whole banner (still capped). */}
            {action ? (
              <div className={actionSlot}>
                <Button {...action} mode={action.mode || 'ghost'} tone={action.tone || 'default'} />
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </Box>
  )
}
