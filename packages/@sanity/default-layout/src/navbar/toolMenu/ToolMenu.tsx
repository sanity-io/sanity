import {StateLink} from '@sanity/base/router'
import React from 'react'
import {Button, Stack} from '@sanity/ui'
import {PlugIcon} from '@sanity/icons'
import {Router, Tool} from '../../types'

interface Props {
  activeToolName: string
  isVisible: boolean
  onSwitchTool: () => void
  router: Router
  tools: Tool[]
}

export default function ToolMenu(props: Props) {
  const {activeToolName, isVisible, onSwitchTool, router, tools} = props

  return (
    <Stack as="ul" space={[1, 2]}>
      {tools.map((tool) => {
        const title = tool.title || tool.name || undefined

        const LinkComponent = (linkProps) => {
          return (
            <StateLink
              {...linkProps}
              tabIndex={isVisible ? 0 : -1}
              state={{...router.state, tool: tool.name, [tool.name]: undefined}}
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
  )
}
