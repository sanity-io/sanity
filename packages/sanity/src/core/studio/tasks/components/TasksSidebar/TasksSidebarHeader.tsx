import {Box, Flex, Text} from '@sanity/ui'
import {DoubleChevronRightIcon, AddIcon} from '@sanity/icons'
import {Button, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {useTasks} from '../..'
import {BetaBadge} from '../../../../components'

export function TasksSidebarHeader() {
  const {handleToggleSidebar} = useTasks()

  return (
    <Box padding={2}>
      <Flex padding={1} justify="space-between" align="center" gap={2}>
        <Flex padding={2} align="center" gap={2} flex={1}>
          <Text size={2} weight="semibold">
            Tasks
          </Text>
          <BetaBadge />
        </Flex>
        <TooltipDelayGroupProvider>
          <Button
            tooltipProps={{
              content: 'Create new task',
            }}
            iconRight={AddIcon}
            mode="bleed"
          />
          <Button
            tooltipProps={{
              content: 'Close sidebar',
            }}
            iconRight={DoubleChevronRightIcon}
            mode="bleed"
            onClick={handleToggleSidebar}
          />
        </TooltipDelayGroupProvider>
      </Flex>
    </Box>
  )
}
