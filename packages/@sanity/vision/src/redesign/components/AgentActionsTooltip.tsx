import {type Placement, Stack, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ReactElement} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../i18n'

interface AgentActionsTooltipProps {
  /** What the control does; left out for a control whose own text says so */
  title?: string
  placement?: Placement
  children: ReactElement
}

/**
 * Tooltip of a control that calls Sanity Agent Actions: what it does, and that it spends the
 * organization's AI credits, which nothing else in the tool would say before the request is made
 */
export function AgentActionsTooltip(props: AgentActionsTooltipProps) {
  const {title, placement = 'bottom', children} = props
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Tooltip
      animate
      content={
        <Stack gap={2}>
          {title && <Text size={1}>{title}</Text>}
          <Text muted size={1}>
            {t('vision.agent-actions.credits')}
          </Text>
        </Stack>
      }
      placement={placement}
      portal
    >
      {children}
    </Tooltip>
  )
}
