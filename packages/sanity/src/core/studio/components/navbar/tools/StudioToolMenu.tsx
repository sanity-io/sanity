import {use, useMemo} from 'react'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingEnabledContext,
  ScheduledPublishingModePromiseContext,
} from 'sanity/_singletons'

import {type ToolMenuProps} from '../../../../config/studio/types'
import {SCHEDULED_PUBLISHING_TOOL_NAME} from '../../../../scheduledPublishing/constants'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

/**
 * @hidden
 * @beta */
export function StudioToolMenu(props: ToolMenuProps) {
  const {context, isSidebarOpen, tools, ...restProps} = props
  // The Schedules tool is listed once the workspace has scheduled publishing enabled, the feature
  // check has answered and the dataset has scheduled something before. Both answers are promises
  // that this menu suspends on, up to the studio's loading screen, so the tool list is painted
  // once; where the plugin is not loaded the contexts are empty and nothing suspends.
  // @TODO SAPP-4633: this is the one async check the layout waits for before it paints. See if it
  // can go, by always rendering the tool's button and rendering a placeholder screen inside the
  // tool when scheduled publishing is not enabled, instead of hiding the button.
  const enabled = use(ScheduledPublishingEnabledContext)
  const modePromise = use(ScheduledPublishingModePromiseContext)
  const hasUsedPromise = use(HasUsedScheduledPublishingPromiseContext)
  const mode = modePromise ? use(modePromise) : null
  // A failed feature check settles the answer on its own: the probe is not waited for then
  const hasUsed = mode !== null && hasUsedPromise ? use(hasUsedPromise) : false
  const scheduledPublishingEnabled = enabled && mode !== null && hasUsed

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
