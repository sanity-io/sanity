import {Box, Flex, Text} from '@sanity/ui'
import {DoubleChevronRightIcon} from '@sanity/icons'
import {Button} from '../../../ui-components'
import {useTasks} from '../../src'
import {BetaBadge} from '../../../core'

export function TasksSidebarHeader() {
  const {handleToggleSidebar} = useTasks()

  return (
    <Box padding={2}>
      <Flex padding={1} justify="space-between" align="center">
        <Flex padding={2} align="center" gap={2} flex={1}>
          <Text size={2} weight="semibold">
            Tasks
          </Text>
          <BetaBadge />
        </Flex>
        <Button
          tooltipProps={{
            content: 'Close sidebar',
          }}
          size="large"
          iconRight={DoubleChevronRightIcon}
          mode="bleed"
          onClick={handleToggleSidebar}
        />
      </Flex>
    </Box>
  )
}
