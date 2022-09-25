import React, {forwardRef, useMemo} from 'react'
import {Button, Stack} from '@sanity/ui'
import {PlugIcon} from '@sanity/icons'
import {startCase} from 'lodash'
import {Tool} from '../../../../config'
import {ToolLinkProps, ToolLink} from './ToolLink'

interface ToolVerticalMenuProps {
  activeToolName?: string
  isVisible: boolean
  tools: Tool[]
}

export function ToolVerticalMenu(props: ToolVerticalMenuProps) {
  const {activeToolName, isVisible, tools} = props

  return useMemo(
    () => (
      <Stack as="ul" space={[1, 2]}>
        {tools.map((tool) => {
          const title = tool?.title || startCase(tool.name) || undefined

          const Link = forwardRef(function Link(
            linkProps: ToolLinkProps,
            ref: React.Ref<HTMLAnchorElement>
          ) {
            return <ToolLink {...linkProps} ref={ref} name={tool.name} />
          })

          return (
            <Stack as="li" key={tool.name}>
              <Button
                as={Link}
                icon={tool.icon || PlugIcon}
                justify="flex-start"
                mode="bleed"
                selected={activeToolName === tool.name}
                tabIndex={isVisible ? 0 : -1}
                text={title}
              />
            </Stack>
          )
        })}
      </Stack>
    ),
    [activeToolName, isVisible, tools]
  )
}
