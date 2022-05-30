import {Button, Flex} from '@sanity/ui'
import React from 'react'
import {ToolMenuProps, ToolLink} from 'sanity'

export function ToolMenu(props: ToolMenuProps) {
  const {context, tools, closeDrawer} = props

  return (
    <Flex gap={3} direction={context === 'drawer' ? 'column' : 'row'}>
      {tools.map((tool) => (
        <ToolLink key={tool.name} name={tool.name}>
          {tool.title}
        </ToolLink>
      ))}

      {context === 'drawer' && <Button text="Close drawer" onClick={closeDrawer} />}
    </Flex>
  )
}
