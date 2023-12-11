import {upperFirst} from 'lodash'
import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../../../../../../../../../i18n'
import {useDateTimeFormat} from '../../../../../../../../../../../hooks/useDateTimeFormat'
import {useCalendar} from './contexts/useDatePicker'

export function CalendarHeader(props: {
  fontSize?: number
  moveFocusedDate: (by: number) => void
  onNowClick: () => void
}) {
  const {t} = useTranslation()
  const monthFormatter = useDateTimeFormat({month: 'long', year: 'numeric'})
  const {focusedDate} = useCalendar()

  const {fontSize, moveFocusedDate, onNowClick} = props

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  return (
    <Flex align="center" flex={1} justify="space-between">
      <Inline paddingLeft={2} space={1}>
        {/* Technically not correct to simply uppercase first here, but simplifying for now */}
        <Text weight="medium">{upperFirst(monthFormatter.format(focusedDate))}</Text>
      </Inline>
      <Box>
        <Button
          aria-label={t('calendar.action.go-to-today-aria-label')}
          fontSize={fontSize}
          mode="bleed"
          onClick={onNowClick}
          text={t('calendar.action.go-to-today')}
        />
        <Button
          aria-label={t('calendar.action.go-to-previous-month')}
          icon={ChevronLeftIcon}
          mode="bleed"
          onClick={handlePrevMonthClick}
        />
        <Button
          aria-label={t('calendar.action.go-to-next-month')}
          icon={ChevronRightIcon}
          mode="bleed"
          onClick={handleNextMonthClick}
        />
      </Box>
    </Flex>
  )
}
