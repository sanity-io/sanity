import {Card, Stack} from '@sanity/ui'

import {TasksNavbarButton} from '../../../../../tasks'

export function TasksMenu({closeSidebar}: {closeSidebar: () => void}) {
  return (
    <Card borderTop flex="none" padding={2} overflow="auto">
      <Stack as="li">
        <TasksNavbarButton closeSidebar={closeSidebar} />
      </Stack>
    </Card>
  )
}
