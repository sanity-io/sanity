/* eslint-disable no-restricted-imports */
import {Box, Card, Flex, Inline} from '@sanity/ui'
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  format,
  isValidTimeZoneString,
  parse,
  type ParseResult,
} from '@sanity/util/legacyDateFormat'
import {getMinutes, parseISO, setMinutes} from 'date-fns'
import {useCallback, useMemo} from 'react'
import {EMPTY_ARRAY, set, type StringInputProps, unset} from 'sanity'
import styled from 'styled-components'

import {ChangeIndicator} from '../../../changeIndicators'
import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {ButtonTimeZone} from '../../../components/timeZone/timeZoneButton/TimeZoneButton'
import ButtonTimeZoneElementQuery from '../../../components/timeZone/timeZoneButton/TimeZoneButtonElementQuery'
import {FormFieldHeaderText} from '../../../form/components/formField/FormFieldHeaderText'
import {type TimeZoneScopeType, useTimeZone} from '../../../hooks/useTimeZone'
import {Translate, useTranslation} from '../../../i18n'
import {getPublishedId} from '../../../util'
import {FormFieldBaseHeader} from '../../components/formField/FormFieldBaseHeader'
import {FormFieldStatus} from '../../components/formField/FormFieldStatus'
import {useFormValue} from '../../contexts/FormValue'
import {useFieldActions} from '../../field'
import {CommonDateTimeInput} from './CommonDateTimeInput'
import {getCalendarLabels, isValidDate} from './utils'

const Root = styled(Card)`
  line-height: 1;
`

const CenterAlignedBox = styled(Box)`
  align-self: center;
`

const ZeroLineHeightBox = styled(Box)`
  line-height: 0;
`

interface ParsedOptions {
  dateFormat: string
  timeFormat: string
  timeStep: number
  displayTimeZone?: string
  allowTimeZoneSwitch?: boolean
}

interface SchemaOptions {
  dateFormat?: string
  timeFormat?: string
  timeStep?: number
  displayTimeZone?: string
  allowTimeZoneSwitch?: boolean
}

/**
 * @hidden
 * @beta */
export type DateTimeInputProps = StringInputProps

const serialize = (date: Date) => {
  return date.toISOString()
}

function parseOptions(options: SchemaOptions = {}): ParsedOptions {
  const displayTimeZone =
    options.displayTimeZone && isValidTimeZoneString(options.displayTimeZone)
      ? options.displayTimeZone
      : undefined
  if (options.displayTimeZone && !displayTimeZone) {
    console.warn(
      `Invalid time zone "${options.displayTimeZone}" supplied to datetime input, defaulting to local time zone or a previously stored preference`,
    )
  }
  return {
    dateFormat: options.dateFormat || DEFAULT_DATE_FORMAT,
    timeFormat: options.timeFormat || DEFAULT_TIME_FORMAT,
    timeStep: ('timeStep' in options && Number(options.timeStep)) || 1,
    displayTimeZone,
    allowTimeZoneSwitch:
      options.allowTimeZoneSwitch === undefined ? true : options.allowTimeZoneSwitch,
  }
}

const getDeserializer =
  (timeZoneName?: string) =>
  (isoString: string): ParseResult => {
    // create a date object respecting the time zone
    const {date: deserialized} = parse(isoString, undefined, timeZoneName)
    if (deserialized && isValidDate(deserialized)) {
      return {isValid: true, date: deserialized}
    }
    return {isValid: false, error: `Invalid date value: "${isoString}"`}
  }

// enforceTimeStep takes a dateString and datetime schema options and enforces the time
// to be within the configured timeStep
function enforceTimeStep(dateString: string, timeStep: number) {
  if (!timeStep || timeStep === 1) {
    return dateString
  }

  const date = parseISO(dateString)
  const minutes = getMinutes(date)
  const leftOver = minutes % timeStep
  if (leftOver !== 0) {
    return serialize(setMinutes(date, minutes - leftOver))
  }

  return serialize(date)
}

/**
 * @hidden
 * @beta */
export function DateTimeInput(props: DateTimeInputProps) {
  const {
    onChange,
    schemaType,
    value,
    elementProps,
    id,
    validation,
    changed,
    path,
    presence = EMPTY_ARRAY,
  } = props

  const {
    focused,
    __internal_comments: comments,
    hovered,
    onMouseEnter,
    onMouseLeave,
    actions,
    __internal_slot: slot,
  } = useFieldActions()
  const {
    dateFormat,
    timeFormat,
    timeStep,
    displayTimeZone,
    allowTimeZoneSwitch = true,
  } = parseOptions(schemaType.options)
  const {title} = schemaType
  const {t} = useTranslation()
  const _id = useFormValue(['_id'])
  const published = getPublishedId(_id as string)
  const timeZoneScope = useMemo(
    () => ({
      type: 'input' as TimeZoneScopeType,
      defaultTimeZone: displayTimeZone,
      // we want to make sure that if allowTimeZoneSwitch is switched to false that we respect the default only
      id: `${published}.${id}${allowTimeZoneSwitch ? '' : '.fixed'}`,
    }),
    [allowTimeZoneSwitch, displayTimeZone, id, published],
  )

  const {timeZone} = useTimeZone(timeZoneScope)

  const handleChange = useCallback(
    (nextDate: string | null) => {
      let date = nextDate
      if (date !== null && timeStep > 1) {
        date = enforceTimeStep(date, timeStep)
      }

      onChange(date === null ? unset() : set(date))
    },
    [onChange, timeStep],
  )

  const formatInputValue = useCallback(
    (date: Date) => format(date, `${dateFormat} ${timeFormat}`, {timeZone: timeZone.name}),
    [dateFormat, timeFormat, timeZone.name],
  )

  const deserialize = useMemo(() => getDeserializer(timeZone.name), [timeZone.name])
  const memoizedSerialize = useMemo(() => serialize, [])

  const parseInputValue = useCallback(
    (inputValue: string): ParseResult =>
      parse(inputValue, `${dateFormat} ${timeFormat}`, timeZone.name),
    [dateFormat, timeFormat, timeZone.name],
  )
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])
  const commonProps = useMemo(
    () => ({
      ...elementProps,
      calendarLabels,
      deserialize,
      formatInputValue,
      onChange: handleChange,
      parseInputValue,
      placeholder: schemaType.placeholder,
      serialize: memoizedSerialize,
      timeZone: timeZone.name,
      timeStep,
      selectTime: true,
      value,
      timeZoneScope,
    }),
    [
      elementProps,
      calendarLabels,
      deserialize,
      formatInputValue,
      handleChange,
      parseInputValue,
      schemaType.placeholder,
      memoizedSerialize,
      timeZone.name,
      timeStep,
      value,
      timeZoneScope,
    ],
  )

  const input = (
    <>
      <CommonDateTimeInput {...commonProps} />
    </>
  )
  return (
    <Root
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="datetime-input"
      radius={2}
    >
      <Flex direction={'column'}>
        <Box flex={1} paddingY={2}>
          <FormFieldBaseHeader
            __internal_comments={comments}
            __internal_slot={slot}
            actions={actions}
            fieldFocused={Boolean(focused)}
            fieldHovered={hovered}
            presence={presence}
            inputId={id}
            content={
              <Inline>
                <FormFieldHeaderText
                  deprecated={schemaType.deprecated}
                  description={schemaType.description}
                  inputId={id}
                  validation={validation}
                  title={schemaType.title}
                />
                {displayTimeZone && (
                  <ButtonTimeZoneElementQuery>
                    <Box marginLeft={2}>
                      <ButtonTimeZone
                        tooltipContent={
                          <Translate
                            t={t}
                            i18nKey={'time-zone.time-zone-tooltip-input'}
                            values={{
                              title,
                              alternativeName: timeZone.alternativeName,
                              offset: timeZone.offset,
                            }}
                          />
                        }
                        allowTimeZoneSwitch={allowTimeZoneSwitch}
                        useElementQueries
                        timeZoneScope={timeZoneScope}
                      />
                    </Box>
                  </ButtonTimeZoneElementQuery>
                )}
              </Inline>
            }
          />
        </Box>
        <CenterAlignedBox paddingX={3} paddingY={1}>
          <FormFieldStatus maxAvatars={1} position="top">
            {/*<FieldPresence maxAvatars={1} presence={presence} />*/}
          </FormFieldStatus>
        </CenterAlignedBox>
        <ChangeIndicator hasFocus={Boolean(focused)} isChanged={changed} path={path}>
          {input}
        </ChangeIndicator>
      </Flex>
    </Root>
  )
}
