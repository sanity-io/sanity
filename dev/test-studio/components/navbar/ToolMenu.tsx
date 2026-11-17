import {Button} from '@sanity/ui'
import {ToolLink, type ToolMenuProps} from 'sanity'
import {Flex} from 'ui5'

export function ToolMenu(props: ToolMenuProps) {
  const {context, tools, closeSidebar} = props

  return (
    <Flex gap={3} flexDirection={context === 'sidebar' ? 'column' : 'row'}>
      {tools.map((tool) => (
        <ToolLink key={tool.name} name={tool.name}>
          {tool.title}
        </ToolLink>
      ))}

      {context === 'topbar' && <Button text="Close drawer" onClick={closeSidebar} />}
    </Flex>
  )
}
