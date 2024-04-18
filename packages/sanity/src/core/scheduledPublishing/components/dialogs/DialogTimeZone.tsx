import {SearchIcon} from '@sanity/icons'
import {Autocomplete, Card, Flex, Inline, Stack, Text, type Theme} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {Dialog} from '../../../../ui-components'
import useTimeZone, {allTimeZones, getLocalTimeZone} from '../../hooks/useTimeZone'
import {type NormalizedTimeZone} from '../../types'

export interface DialogTimeZoneProps {
  onClose?: () => void
}

const TimeZoneAlternativeNameSpan = styled.span(({theme}: {theme: Theme}) => {
  return css`
    color: ${theme.sanity.color.base.fg};
    font-weight: 500;
    margin-left: 1em;
  `
})

const TimeZoneMainCitiesSpan = styled.span(({theme}: {theme: Theme}) => {
  return css`
    color: ${theme.sanity.color.input.default.readOnly.fg};
    margin-left: 1em;
  `
})

const DialogTimeZone = (props: DialogTimeZoneProps) => {
  const {onClose} = props

  const {setTimeZone, timeZone} = useTimeZone()
  const [selectedTz, setSelectedTz] = useState<NormalizedTimeZone | undefined>(timeZone)

  // Callbacks
  const handleTimeZoneChange = useCallback((value: string) => {
    const tz = allTimeZones.find((v) => v.value === value)
    setSelectedTz(tz)
  }, [])

  const handleTimeZoneSelectLocal = useCallback(() => {
    setSelectedTz(getLocalTimeZone())
  }, [])

  const handleTimeZoneUpdate = useCallback(() => {
    if (selectedTz) {
      setTimeZone(selectedTz)
    }
    onClose?.()
  }, [onClose, selectedTz, setTimeZone])

  const isDirty = selectedTz?.name !== timeZone.name
  const isLocalTzSelected = useMemo(() => {
    return selectedTz?.name === getLocalTimeZone().name
  }, [selectedTz])

  const renderOption = useCallback((option: NormalizedTimeZone) => {
    return (
      <Card as="button" padding={3}>
        <Text size={1} textOverflow="ellipsis">
          <span>GMT{option.offset}</span>
          <TimeZoneAlternativeNameSpan>{option.alternativeName}</TimeZoneAlternativeNameSpan>
          <TimeZoneMainCitiesSpan>{option.mainCities}</TimeZoneMainCitiesSpan>
        </Text>
      </Card>
    )
  }, [])
  const renderValue = useCallback((_value: string, option?: NormalizedTimeZone) => {
    if (!option) return ''
    return `${option.alternativeName} (${option.namePretty})`
  }, [])

  return (
    <Dialog
      footer={{
        confirmButton: {
          text: 'Update time zone',
          disabled: !isDirty || !selectedTz,
          onClick: handleTimeZoneUpdate,
          tone: 'primary',
        },
      }}
      header="Select time zone"
      id="time-zone"
      onClose={onClose}
      width={1}
    >
      <Stack padding={4} space={5}>
        <Text size={1}>
          The selected time zone will change how dates are represented in schedules.
        </Text>

        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Inline space={2}>
              <Text size={1} weight="semibold">
                Time zone
              </Text>
              {isLocalTzSelected && (
                <Text muted size={1}>
                  local time
                </Text>
              )}
            </Inline>
            {!isLocalTzSelected && (
              <Text size={1} weight="medium">
                <a onClick={handleTimeZoneSelectLocal} style={{cursor: 'pointer'}}>
                  Select local time zone
                </a>
              </Text>
            )}
          </Flex>

          <Autocomplete
            fontSize={2}
            icon={SearchIcon}
            id="timezone"
            onChange={handleTimeZoneChange}
            openButton
            options={allTimeZones}
            padding={4}
            placeholder="Search for a city or time zone"
            popover={{
              boundaryElement: document.querySelector('body'),
              constrainSize: true,
              placement: 'bottom-start',
            }}
            renderOption={renderOption}
            renderValue={renderValue}
            tabIndex={-1}
            value={selectedTz?.value}
          />
        </Stack>
      </Stack>
    </Dialog>
  )
}

export default DialogTimeZone
