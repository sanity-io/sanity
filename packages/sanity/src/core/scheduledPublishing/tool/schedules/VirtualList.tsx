'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {CheckmarkCircleIcon} from '@sanity/icons'
import {Box, Flex} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import {useEffect, useMemo, useRef} from 'react'

import {Button} from '../../../../ui-components'
import useScheduleOperation from '../../hooks/useScheduleOperation'
import {type Schedule, type ScheduleSort} from '../../types'
import {getLastExecuteDate} from '../../utils/scheduleUtils'
import {useSchedules} from '../contexts/schedules'
import {type ListItem, VirtualListItem} from './VirtualListItem'

function getLocalizedDate(date: string) {
  return new Date(date).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })
}

const VirtualList = () => {
  const {activeSchedules, scheduleState, sortBy} = useSchedules()
  const {measureElement, virtualList, totalSize, containerRef} = useVirtualizedSchedules(
    activeSchedules,
    sortBy,
  )

  const {deleteSchedules} = useScheduleOperation()

  const handleClearSchedules = () => {
    deleteSchedules({schedules: activeSchedules || []})
  }

  // Reset virtual list scroll position on state changes
  useEffect(() => {
    containerRef?.current?.scrollTo(0, 0)
  }, [scheduleState, sortBy, containerRef])

  return (
    <Box paddingBottom={6} paddingTop={1} paddingX={4} ref={containerRef} overflow="hidden">
      <Box
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualList.map((item) => (
          <VirtualListItem key={item.key} item={item} measureElement={measureElement} />
        ))}
      </Box>
      {/* Clear completed schedules */}
      {scheduleState === 'succeeded' && (
        <Flex justify="center" marginTop={6}>
          <Button
            icon={CheckmarkCircleIcon}
            mode="ghost"
            onClick={handleClearSchedules}
            text="Clear all completed schedules"
          />
        </Flex>
      )}
    </Box>
  )
}

export default VirtualList

function useVirtualizedSchedules(activeSchedules: Schedule[], sortBy?: ScheduleSort) {
  const containerRef = useRef<HTMLDivElement>(null)

  const listSourceItems = useMemo(() => {
    const items: (Schedule | string)[] = []

    activeSchedules.forEach((schedule, index) => {
      if (sortBy == 'executeAt') {
        // Get localised date string for current and previous schedules (e.g. 'February 2025')
        const previousSchedule = activeSchedules[index - 1]
        const previousExecuteDate = getLastExecuteDate(previousSchedule)
        const datePrevious =
          index > 0 && previousExecuteDate ? getLocalizedDate(previousExecuteDate) : null

        const currentExecuteDate = getLastExecuteDate(schedule)
        const dateCurrent = currentExecuteDate ? getLocalizedDate(currentExecuteDate) : null

        if (dateCurrent !== datePrevious) {
          items.push(dateCurrent ? dateCurrent : 'No date specified')
        }
      }
      items.push(schedule)
    })

    return items
  }, [activeSchedules, sortBy])

  const virtualizer = useVirtualizer({
    count: listSourceItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 50,
    overscan: 5,
  })

  const virtualList: ListItem[] = virtualizer.getVirtualItems().map((virtualRow) => {
    const item = listSourceItems[virtualRow.index]
    return {
      content: item,
      key: typeof item === 'string' ? item : item.id,
      virtualRow,
    }
  })

  return {
    containerRef,
    measureElement: virtualizer.measureElement,
    totalSize: virtualizer.getTotalSize(),
    virtualList,
  }
}
