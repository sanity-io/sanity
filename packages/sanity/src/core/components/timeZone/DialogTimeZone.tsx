import {SearchIcon} from '@sanity/icons/Search'
import {Card, Flex, Inline, Stack, Text, type Theme} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {useCallback, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {type TimeZoneScope, type TimeZoneScopeType, useTimeZone} from '../../hooks/useTimeZone'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type NormalizedTimeZone} from '../../studio/timezones/types'

export interface DialogTimeZoneProps {
  onClose?: () => void
  timeZoneScope: TimeZoneScope
}

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const TimeZoneCitySpan = styled.span(({theme}: {theme: Theme}) => {
  return css`
    color: ${theme.sanity.color.base.fg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    font-weight: 500;
    margin-left: 1em;
  `
})

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const TimeZoneOffsetSpan = styled.span(({theme}: {theme: Theme}) => {
  return css`
    color: ${theme.sanity.color.muted.default.enabled.fg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    font-weight: 500;
  `
})

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const TimeZoneAlternativeNameSpan = styled.span(({theme}: {theme: Theme}) => {
  return css`
    color: ${theme.sanity.color.input.default.readOnly.fg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    float: right;
  `
})

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
        <Text size={1} textOverflow="ellipsis">
          <TimeZoneCitySpan>{option.city}</TimeZoneCitySpan>
          <TimeZoneOffsetSpan>
            {' '}
            ({'GMT'}
            {option.offset})
          </TimeZoneOffsetSpan>

          <TimeZoneAlternativeNameSpan>{option.alternativeName}</TimeZoneAlternativeNameSpan>
        </Text>
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
              // panel-scoped scroll container.
              floatingBoundary: document.body,
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
