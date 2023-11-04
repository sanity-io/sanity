import {Button, Flex} from '@sanity/ui'
import React from 'react'
import {ToolLink, ToolMenuProps} from 'sanity'

export function ToolMenu(props: ToolMenuProps) {
  const {context, tools, closeSidebar} = props

  return (
    <Flex gap={3} direction={context === 'sidebar' ? 'column' : 'row'}>
      {tools.map((tool) => (
        <ToolLink key={tool.name} name={tool.name}>
          {tool.title}
        </ToolLink>
      ))}

      {context === 'topbar' && <Button text="Close drawer" onClick={closeSidebar} />}
    </Flex>
  )
}
