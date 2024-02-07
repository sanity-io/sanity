import {PanelRightIcon} from '@sanity/icons'
import {Card, Flex} from '@sanity/ui'
import {NavbarProps} from '../../../core'
import {Button} from '../../../ui-components'
import {useResolveTasksEnabled, useTasks} from '../../src'

export function TasksStudioNavbar(props: NavbarProps) {
  const {handleToggleSidebar, isSidebarOpen} = useTasks()
  const isEnabled = useResolveTasksEnabled()
  if (!isEnabled) return props.renderDefault(props)
  return (
    <>
      <Flex width="fill" align="center">
        <div style={{flexGrow: 1}}>{props.renderDefault(props)}</div>
        <Card borderBottom padding={3} paddingLeft={2}>
          <Button
            text="Tasks"
            mode={'bleed'}
            selected={isSidebarOpen}
            iconRight={PanelRightIcon}
            onClick={handleToggleSidebar}
          />
        </Card>
      </Flex>
    </>
  )
}
