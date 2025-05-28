import {CalendarIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {Box, Flex, useClickOutsideEvent} from '@sanity/ui'
import {DEFAULT_DATE_FORMAT, format, parse} from '@sanity/util/legacyDateFormat'
import {type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import ReactFocusLock from 'react-focus-lock'

import {Button, Popover} from '../../../../../ui-components'
import {type CalendarLabels} from '../../../../components/inputs/DateInputs/calendar/types'
import {DatePicker} from '../../../../components/inputs/DateInputs/DatePicker'
import {type FormPatch, type PatchEvent, set, unset} from '../../../../form'
import {getCalendarLabels} from '../../../../form/inputs/DateInputs/utils'
import {useDateTimeFormat} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {tasksLocaleNamespace} from '../../../i18n'

const serialize = (date: Date) => format(date, DEFAULT_DATE_FORMAT)
const deserialize = (value: string) => parse(value, DEFAULT_DATE_FORMAT)

export function DateEditFormField(props: {
  value: string
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  path: Path
}) {
  const {value, onChange, path} = props
  const {t: coreT} = useTranslation()
  const {t} = useTranslation(tasksLocaleNamespace)

  const [pickerOpen, setPickerOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const dateFormatter = useDateTimeFormat({dateStyle: 'long'})
  const dueByeDisplayValue = useMemo(() => {
    if (!value) return {short: '----', full: '----'}
    const dueFormated = dateFormatter.format(new Date(value))
    const [monthAndDay] = dueFormated.split(',')
    return {short: monthAndDay, full: dueFormated}
  }, [dateFormatter, value])

  useClickOutsideEvent(
    () => setPickerOpen(false),
    () => [popoverRef.current],
  )

  const handleKeyUp = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setPickerOpen(false)
    }
  }, [])
  const handleClick = useCallback(() => setPickerOpen((p) => !p), [])
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])
  const handleChange = useCallback(
    (nextDate: Date | null) => {
      if (nextDate) {
        onChange(set(serialize(nextDate), path))
      } else {
        onChange(unset(path))
      }
      setPickerOpen(false)
    },
    [onChange, path],
  )

  const deserializedValue = deserialize(value)
  const handleDeactivation = useCallback(() => {
    buttonRef.current?.focus()
  }, [buttonRef])
  const dueDateIsThisYear = deserializedValue?.date?.getFullYear() === new Date().getFullYear()

  return (
    <Popover
      constrainSize
      data-testid="date-input-dialog"
      portal
      ref={popoverRef}
      content={
        <Box overflow="auto">
          <ReactFocusLock onDeactivation={handleDeactivation}>
            <DatePicker
              calendarLabels={calendarLabels}
              selectTime={false}
              timeStep={1}
              onKeyUp={handleKeyUp}
              value={deserializedValue.date}
              onChange={handleChange}
            />
            {value && (
              <Flex justify={'flex-start'} padding={3} paddingTop={0}>
                <Button
                  mode="bleed"
                  text={t('form.input.date.buttons.remove.text')}
                  onClick={() => handleChange(null)}
                  tone="critical"
                />
              </Flex>
            )}
          </ReactFocusLock>
        </Box>
      }
      open={pickerOpen}
      placement="bottom"
      fallbackPlacements={['bottom-start', 'bottom-end']}
    >
      <Button
        icon={CalendarIcon}
        mode="ghost"
        text={dueDateIsThisYear ? dueByeDisplayValue.short : dueByeDisplayValue.full}
        onClick={handleClick}
        ref={buttonRef}
        tooltipProps={{
          content: value
            ? t('form.input.date.buttons.tooltip')
            : t('form.input.date.buttons.empty.tooltip'),
        }}
      />
    </Popover>
  )
}
