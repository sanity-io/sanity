import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Inline, Text} from '@sanity/ui'
import upperFirst from 'lodash-es/upperFirst.js'
import {useCallback} from 'react'
import {Flex} from 'ui5'

import {Button} from '../../../../../../../../../../../../ui-components/button/Button'
import {useDateTimeFormat} from '../../../../../../../../../../../hooks/useDateTimeFormat'
import {useTranslation} from '../../../../../../../../../../../i18n/hooks/useTranslation'
import {useCalendar} from './contexts/useDatePicker'

export function CalendarHeader(props: {
  moveFocusedDate: (by: number) => void
  onNowClick: () => void
}) {
  const {t} = useTranslation()
  const monthFormatter = useDateTimeFormat({month: 'long', year: 'numeric'})
  const {focusedDate} = useCalendar()

  const {moveFocusedDate, onNowClick} = props

  const handlePrevMonthClick = useCallback(() => moveFocusedDate(-1), [moveFocusedDate])

  const handleNextMonthClick = useCallback(() => moveFocusedDate(1), [moveFocusedDate])

  return (
    <Flex alignItems="center" flexBasis="0%" flexGrow={1} justifyContent="space-between">
      <Inline paddingLeft={2} gap={1}>
        {/* Technically not correct to simply uppercase first here, but simplifying for now */}
        <Text size={1} weight="medium">
          {upperFirst(monthFormatter.format(focusedDate))}
        </Text>
      </Inline>
      <Flex alignItems="center">
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
      </Flex>
    </Flex>
  )
}
