import {
  Box,
  Flex,
  Text,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
} from '@sanity/ui'
import {DoubleChevronRightIcon, AddIcon, ChevronRightIcon} from '@sanity/icons'
import {Button, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {useTasks} from '../..'
import {ViewMode} from './types'
import {BetaBadge} from 'sanity'

interface TasksSidebarHeaderProps {
  viewMode: ViewMode
  setViewMode: (view: ViewMode) => void
}

/**
 * @internal
 */
export function TasksSidebarHeader(props: TasksSidebarHeaderProps) {
  const {setViewMode, viewMode} = props
  const {toggleOpen} = useTasks()

  return (
    <Box padding={2}>
      <Flex padding={1} justify="space-between" align="center">
        <Flex align="center" gap={2} flex={1}>
          <UIButton
            mode="bleed"
            space={2}
            padding={2}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => setViewMode('list')}
          >
            <Text size={2} weight="semibold">
              Tasks
            </Text>
          </UIButton>
          {viewMode === 'create' && (
            <Text size={1} muted>
              <ChevronRightIcon /> Create new
            </Text>
          )}
          {viewMode === 'edit' && (
            <Text size={1} muted>
              <ChevronRightIcon /> Edit
            </Text>
          )}
          <BetaBadge />
        </Flex>
        <TooltipDelayGroupProvider>
          <Button
            tooltipProps={{
              content: 'Create new task',
            }}
            iconRight={AddIcon}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => setViewMode('create')}
            mode="bleed"
          />
          <Button
            tooltipProps={{
              content: 'Close sidebar',
            }}
            iconRight={DoubleChevronRightIcon}
            mode="bleed"
            onClick={toggleOpen}
          />
        </TooltipDelayGroupProvider>
      </Flex>
    </Box>
  )
}
