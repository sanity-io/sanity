import {SearchIcon} from '@sanity/icons/Search'
import {Card, Flex, Inline, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {type TimeZoneScope, type TimeZoneScopeType, useTimeZone} from '../../hooks/useTimeZone'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type NormalizedTimeZone} from '../../studio/timezones/types'
import {
  alternativeNameColorVar,
  cityColorVar,
  offsetColorVar,
  timeZoneAlternativeNameSpan,
  timeZoneCitySpan,
  timeZoneOffsetSpan,
} from './DialogTimeZone.css'

export interface DialogTimeZoneProps {
  onClose?: () => void
  timeZoneScope: TimeZoneScope
}

// Rendered inside the option `Card` so the theme is read from the same scope the spans live in
function TimeZoneOptionText({option}: {option: NormalizedTimeZone}) {
  const {color} = useThemeV2()
  const style = useMemo(
    () =>
      assignInlineVars({
        [cityColorVar]: color.fg,
        [offsetColorVar]: color.button.ghost.default.enabled.fg,
        [alternativeNameColorVar]: color.input.default.readOnly.fg,
      }),
    [color],
  )

  return (
    <Text size={1} textOverflow="ellipsis" style={style}>
      <span className={timeZoneCitySpan}>{option.city}</span>
      <span className={timeZoneOffsetSpan}>
        {' '}
        ({'GMT'}
        {option.offset})
      </span>

      <span className={timeZoneAlternativeNameSpan}>{option.alternativeName}</span>
    </Text>
  )
}

const DialogTimeZone = (props: DialogTimeZoneProps) => {
  const {onClose, timeZoneScope} = props
  const {setTimeZone, allTimeZones, timeZone, getLocalTimeZone, getTimeZone} =
    useTimeZone(timeZoneScope)
  const [selectedTz, setSelectedTz] = useState<NormalizedTimeZone | undefined>(timeZone)
  const [showAllOptions, setShowAllOptions] = useState(false)
  const {t} = useTranslation('studio')

  const timeZoneScopeTypeToLabel = useMemo(
    (): Record<TimeZoneScopeType, ReturnType<typeof t>> => ({
      scheduledPublishing: t('time-zone.dialog-info.scheduled-publishing'),
      contentReleases: t('time-zone.dialog-info.content-releases'),
      input: t('time-zone.dialog-info.input'),
    }),
    [t],
  )

  const handleTimeZoneChange = useCallback(
    (value: string) => {
      if (!value) {
        setSelectedTz(undefined)
        return
      }
      setShowAllOptions(false)
      setSelectedTz(getTimeZone(value))
    },
    [getTimeZone],
  )

  const handleQueryChange = useCallback((newQuery: string | null) => {
    if (newQuery) {
      setShowAllOptions(false)
    }
  }, [])

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    setShowAllOptions(true)
  }, [])

  const handleTimeZoneSelectLocal = useCallback(
    () => setSelectedTz(getLocalTimeZone()),
    [getLocalTimeZone],
  )

  const handleTimeZoneUpdate = useCallback(() => {
    if (selectedTz) {
      setTimeZone(selectedTz)
    }
    onClose?.()
  }, [onClose, selectedTz, setTimeZone])

  const isDirty = selectedTz?.name !== timeZone.name
  const isLocalTzSelected = useMemo(() => {
    return selectedTz?.name === getLocalTimeZone().name
  }, [getLocalTimeZone, selectedTz?.name])

  const renderOption = useCallback((option: NormalizedTimeZone) => {
    return (
      <Card as="button" padding={3}>
        <TimeZoneOptionText option={option} />
      </Card>
    )
  }, [])
  const renderValue = useCallback((_value: string, option?: NormalizedTimeZone) => {
    if (!option) return ''
    return `${option.alternativeName} (${option.namePretty})`
  }, [])

  const filterOption = useCallback(
    (filterQuery: string, option: NormalizedTimeZone) => {
      // Always show all options if dropdown button was clicked
      // Otherwise use standard filtering
      if (showAllOptions || filterQuery === '') return true
      const searchText = `${option.city} (GMT${option.offset}) ${option.alternativeName}`
      return searchText.toLowerCase().includes(filterQuery.toLowerCase())
    },
    [showAllOptions],
  )

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
      <Stack padding={4} gap={5}>
        <Text size={1}>{timeZoneScopeTypeToLabel[timeZoneScope.type]}</Text>
        <Stack gap={3}>
          <Flex align="center" justify="space-between">
            <Inline gap={2}>
              <Text size={1} weight="semibold">
                {t('time-zone.time-zone')}
              </Text>
              {isLocalTzSelected && (
                <Text muted size={1}>
                  {t('time-zone.local-time')}
                </Text>
              )}
            </Inline>
            {!isLocalTzSelected && (
              <Text size={1} weight="medium">
                <a onClick={handleTimeZoneSelectLocal} style={{cursor: 'pointer'}}>
                  {t('time-zone.action.select-local-time-zone')}
                </a>
              </Text>
            )}
          </Flex>

          <Autocomplete
            fontSize={2}
            icon={SearchIcon}
            id="timezone"
            onChange={handleTimeZoneChange}
            onQueryChange={handleQueryChange}
            openButton={{onClick: handleAutocompleteOpenButtonClick}}
            options={allTimeZones}
            padding={4}
            filterOption={filterOption}
            placeholder={t('time-zone.action.search-for-timezone-placeholder')}
            popover={{
              // Dialog is portaled to the document root, so its Autocomplete
              // popover should be bounded by document.body rather than any
              // panel-scoped scroll container. Set both boundaries to match the
              // pre-v4 `boundaryElement` behavior.
              floatingBoundary: document.body,
              referenceBoundary: document.body,
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
