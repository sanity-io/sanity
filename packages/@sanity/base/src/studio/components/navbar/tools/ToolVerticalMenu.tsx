import React, {useMemo} from 'react'
import {Button, Stack} from '@sanity/ui'
import {PlugIcon} from '@sanity/icons'
import {StateLink, useRouterState} from '../../../../router'
import {Tool} from '../../../../config'

interface ToolVerticalMenuProps {
  activeToolName?: string
  isVisible: boolean
  onSwitchTool: () => void
  tools: Tool[]
}

export function ToolVerticalMenu(props: ToolVerticalMenuProps) {
  const {activeToolName, isVisible, onSwitchTool, tools} = props
  const routerState = useRouterState()

  return useMemo(
    () => (
      <Stack as="ul" space={[1, 2]}>
        {tools.map((tool) => {
          const title = tool.title || tool.name || undefined

          const LinkComponent = (linkProps: any) => {
            return (
              <StateLink
                {...linkProps}
                tabIndex={isVisible ? 0 : -1}
                state={{...routerState, tool: tool.name, [tool.name]: undefined}}
              />
            )
          }

          return (
            <Stack as="li" key={tool.name}>
              <Button
                as={LinkComponent}
                justify="flex-start"
                text={title}
                icon={tool.icon || PlugIcon}
                mode="bleed"
                onClick={onSwitchTool}
                selected={activeToolName === tool.name}
              />
            </Stack>
          )
        })}
      </Stack>
    ),
    [activeToolName, isVisible, onSwitchTool, routerState, tools]
  )
}
