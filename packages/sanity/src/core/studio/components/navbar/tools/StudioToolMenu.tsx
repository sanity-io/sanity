import {type ToolMenuProps} from '../../../../config'
import {ToolCollapseMenu} from './ToolCollapseMenu'
import {ToolVerticalMenu} from './ToolVerticalMenu'

/**
 * @hidden
 * @beta */
export function StudioToolMenu(props: ToolMenuProps) {
  const {context, isSidebarOpen, tools, ...restProps} = props

  if (tools.length <= 1) {
    return null
  }

  if (context === 'sidebar') {
    return <ToolVerticalMenu isVisible={isSidebarOpen} tools={tools} {...restProps} />
  }

  return <ToolCollapseMenu tools={tools} {...restProps} />
}
