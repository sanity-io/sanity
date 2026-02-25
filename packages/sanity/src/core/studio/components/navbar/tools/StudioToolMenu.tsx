import {useMemo} from 'react'

import {type ToolMenuProps} from '../../../../config'
import {SCHEDULED_PUBLISHING_TOOL_NAME} from '../../../../scheduledPublishing/constants'
import {useScheduledPublishingEnabled} from '../../../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

/**
 * @hidden
 * @beta */
export function StudioToolMenu(props: ToolMenuProps) {
  const {context, isSidebarOpen, tools, ...restProps} = props
  const {enabled: scheduledPublishingEnabled} = useScheduledPublishingEnabled()

  const visibleTools = useMemo(
    () =>
      tools.filter((tool) => {
        if (tool.name === SCHEDULED_PUBLISHING_TOOL_NAME && !scheduledPublishingEnabled) {
          return false
        }
        return true
      }),
    [scheduledPublishingEnabled, tools],
  )

  if (visibleTools.length <= 1) {
    return null
  }
  if (context === 'sidebar') {
    return <ToolVerticalMenu isVisible={isSidebarOpen} tools={visibleTools} {...restProps} />
  }

  return <ToolCollapseMenu tools={visibleTools} {...restProps} />
}
