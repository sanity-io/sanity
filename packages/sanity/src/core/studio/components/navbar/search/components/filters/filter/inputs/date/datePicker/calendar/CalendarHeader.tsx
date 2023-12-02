import {upperFirst} from 'lodash'
import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Flex, Inline, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Button} from '../../../../../../../../../../../../ui'
import {useTranslation} from '../../../../../../../../../../../i18n'
import {useIntlDateTimeFormat} from '../../../../../../../../../../../i18n/hooks/useIntlDateTimeFormat'
import {useCalendar} from './contexts/useDatePicker'

export function CalendarHeader(props: {
  moveFocusedDate: (by: number) => void
  onNowClick: () => void
}) {
  const {t} = useTranslation()
  const monthFormatter = useIntlDateTimeFormat({month: 'long', year: 'numeric'})
  const {focusedDate} = useCalendar()

  const {moveFocusedDate, onNowClick} = props

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
          mode="bleed"
          onClick={onNowClick}
          text={t('calendar.action.go-to-today')}
        />
        <Button
          icon={ChevronLeftIcon}
          mode="bleed"
          onClick={handlePrevMonthClick}
          tooltipProps={{content: t('calendar.action.go-to-previous-month')}}
        />
        <Button
          icon={ChevronRightIcon}
          mode="bleed"
          onClick={handleNextMonthClick}
          tooltipProps={{content: t('calendar.action.go-to-next-month')}}
        />
      </Box>
    </Flex>
  )
}
