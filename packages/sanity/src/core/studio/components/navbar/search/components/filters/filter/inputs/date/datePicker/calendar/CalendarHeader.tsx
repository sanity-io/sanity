import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useCalendar} from './contexts/useDatePicker'
import {MONTH_NAMES} from './constants'

export function CalendarHeader(props: {
  fontSize?: number
  moveFocusedDate: (by: number) => void
  onNowClick: () => void
}) {
  const {focusedDate} = useCalendar()

  const {fontSize, moveFocusedDate, onNowClick} = props

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  return (
    <Flex align="center" flex={1} justify="space-between">
      <Inline paddingLeft={2} space={1}>
        <Text weight="medium">{MONTH_NAMES[focusedDate.getMonth()]}</Text>
        <Text weight="medium">{focusedDate.getFullYear()}</Text>
      </Inline>
      <Box>
        <Button fontSize={fontSize} text="Today" mode="bleed" onClick={onNowClick} />
        <Button
          aria-label="Go to previous month"
          onClick={handlePrevMonthClick}
          mode="bleed"
          icon={ChevronLeftIcon}
        />
        <Button
          aria-label="Go to next month"
          mode="bleed"
          icon={ChevronRightIcon}
          onClick={handleNextMonthClick}
        />
      </Box>
    </Flex>
  )
}
