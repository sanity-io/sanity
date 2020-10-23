import StateButton from 'part:@sanity/components/buttons/state'
import {Tooltip} from 'part:@sanity/components/tooltip'
import React from 'react'
import {Router, Tool} from '../../types'

import styles from './ToolMenu.css'

interface Props {
  activeToolName: string
  direction: 'horizontal' | 'vertical'
  isVisible: boolean
  onSwitchTool: () => void
  router: Router
  tools: Tool[]
  showLabel?: boolean
  tone?: 'navbar'
}

const TOUCH_DEVICE = 'ontouchstart' in document.documentElement

function ToolMenu(props: Props) {
  const {
    activeToolName,
    direction,
    isVisible,
    onSwitchTool,
    router,
    tools,
    showLabel: showLabelProp,
    tone,
  } = props
  const isVertical = direction === 'horizontal'
  const showLabel = (TOUCH_DEVICE && !isVertical) || showLabelProp

  return (
    <ul className={styles.root} data-direction={direction} data-tone="navbar">
      {tools.map((tool) => {
        const title = tool.title || tool.name || undefined
        const tooltipContent = <span className={styles.tooltipContent}>{title}</span>

        return (
          <li key={tool.name}>
            <Tooltip
              content={tooltipContent as any}
              disabled={showLabel}
              placement="bottom"
              title={showLabel ? '' : title}
              tone={tone}
            >
              <div>
                <StateButton
                  icon={tool.icon}
                  key={tool.name}
                  kind="simple"
                  onClick={onSwitchTool}
                  padding={direction === 'horizontal' ? 'small' : 'medium'}
                  selected={activeToolName === tool.name}
                  state={{...router.state, tool: tool.name, [tool.name]: undefined}}
                  title={title}
                  tabIndex={isVisible ? 0 : -1}
                  tone={tone}
                >
                  {tool.title}
                </StateButton>
              </div>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}

export default ToolMenu
