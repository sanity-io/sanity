import {type ToolMenuProps} from '../../../../config'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

const HIDDEN_STUDIO_MENU_TOOLS = ['releases']

/**
 * @hidden
 * @beta */
export function StudioToolMenu(props: ToolMenuProps) {
  const {context, isSidebarOpen, tools, ...restProps} = props

  if (tools.length <= 1) {
    return null
  }

  const visibleTools = tools.filter((tool) => !HIDDEN_STUDIO_MENU_TOOLS.includes(tool.name))

  if (context === 'sidebar') {
    return <ToolVerticalMenu isVisible={isSidebarOpen} tools={visibleTools} {...restProps} />
  }

  return <ToolCollapseMenu tools={visibleTools} {...restProps} />
}
