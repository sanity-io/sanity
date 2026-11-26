import {Button} from '@sanity/ui'
import {type ToolMenuProps} from 'sanity'
import {ToolLink} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
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
