import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Flex, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useMemo, useState} from 'react'
import {styled} from 'styled-components'

// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/inventory-sidepanel (PR #47), commit 10f3f729a9, lib/explorations/variants/inventory-concepts/DateSpanPicker.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
import {MONTH_PICKER_VARIANT} from '../../../../packages/sanity/src/core/components/inputs/DateInputs/calendar/Calendar'
import {DatePicker} from '../../../../packages/sanity/src/core/components/inputs/DateInputs/DatePicker'
import {getCalendarLabels} from '../../../../packages/sanity/src/core/form/inputs/DateInputs/utils'
import {useTranslation} from '../../../../packages/sanity/src/core/i18n/hooks/useTranslation'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../../packages/sanity/src/core/studio/constants'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {
  dayKey,
  FIXTURE_NOW_DAY,
  dateBounds,
  type DateFilter,
  type DateKind,
  RELATIVE_UNIT_LABELS,
  RELATIVE_WHICH_LABELS,
  type RelativeUnit,
  type RelativeWhich,
  useInventoryConcepts,
} from './model'

/** Studio's calendar has no span; every day the filter covers gets the selected day's tint. */
const SpanRoot = styled.div<{$days: string[]}>`
  ${({$days}) => $days.map((id) => `[data-testid='${id}']`).join(',') || '[data-span-none]'} {
    background-color: var(--card-badge-primary-bg-color);
    color: var(--card-badge-primary-fg-color);
  }
`

const testIdFor = (date: Date) => `calendar-day-${date.toDateString().replaceAll(' ', '-')}`

/**
 * Specific date: Studio's calendar, in one picker that stays put (Andrej, 2026-10-15: "We want to use
 * one picker"). The shortcuts are in the filter menu. A day filters at once and the picker stays
 * open; a second click on another day makes the span, a third starts over. The calendar tints
 * whatever the filter covers, a shortcut's days included.
 */
export function DateSpanPicker({kind}: {kind: DateKind}) {
  const {
    addFilter,
    filters,
    spanExtending: extending,
    setSpanExtending: setExtending,
  } = useInventoryConcepts()
  const {t} = useTranslation()
  const calendarLabels = useMemo(() => getCalendarLabels(t), [t])
  const dateFilter = filters.find((f): f is DateFilter => f.kind === kind)

  const pickDay = (date: Date) => {
    const day = dayKey(date)
    if (dateFilter?.range === 'span' && extending) {
      const [from, to] = [dateFilter.from, day].sort()
      addFilter({kind, range: 'span', from, to})
      setExtending(false)
    } else {
      addFilter({kind, range: 'span', from: day, to: day})
      setExtending(true)
    }
  }

  // The selects show the relative filter that is on, else the last pair picked, This week first.
  const [pair, setPair] = useState<{which: RelativeWhich; unit: RelativeUnit}>({
    which: 'this',
    unit: 'week',
  })
  const relative = dateFilter?.range === 'relative' ? dateFilter : undefined
  const which = relative?.which ?? pair.which
  const unit = relative?.unit ?? pair.unit
  const pickRelative = (next: {which: RelativeWhich; unit: RelativeUnit}) => {
    setPair(next)
    addFilter({kind, range: 'relative', ...next})
    setExtending(false)
  }

  const [from, to] = dateFilter ? dateBounds(dateFilter) : []
  // A relative period opens on today's month when it holds today, else on its first month.
  const shown =
    dateFilter && dateFilter.range !== 'span' && from && to
      ? FIXTURE_NOW_DAY >= from && FIXTURE_NOW_DAY <= to
        ? FIXTURE_NOW_DAY
        : from
      : to
  const tinted = useMemo(() => {
    if (!from || !to) return []
    // Step by calendar day: a day that changes the clock is not 24 hours long.
    const days: string[] = []
    const end = new Date(`${to}T00:00:00`)
    for (const at = new Date(`${from}T00:00:00`); at <= end; at.setDate(at.getDate() + 1)) {
      days.push(testIdFor(at))
    }
    return days
  }, [from, to])

  return (
    <Stack gap={3}>
      {/* Zero width, full width: the calendar alone sets the picker's width. */}
      <Flex data-testid="inventory-date-relative" gap={2} style={{width: 0, minWidth: '100%'}}>
        <Select
          id="inventory-date-which"
          onPick={(next) => pickRelative({which: next, unit})}
          options={RELATIVE_WHICH_LABELS[kind] as Record<RelativeWhich, string>}
          selected={relative ? which : undefined}
          value={which}
        />
        <Select
          id="inventory-date-unit"
          onPick={(next) => pickRelative({which, unit: next})}
          options={RELATIVE_UNIT_LABELS}
          selected={relative ? unit : undefined}
          value={unit}
        />
      </Flex>
      <SpanRoot $days={tinted}>
        <DatePicker
          // Studio's calendar keeps the month it opened on; a new month remounts it on that month,
          // so Next month or Next year shows the period it picked.
          key={shown?.slice(0, 7)}
          calendarLabels={calendarLabels}
          monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
          onChange={pickDay}
          padding={0}
          timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
          value={shown ? new Date(`${shown}T00:00:00`) : undefined}
        />
      </SpanRoot>
      {dateFilter &&
        dateFilter.range !== 'span' && (
          // Under the calendar's own bottom rule, as in the reference.
          <Text muted size={1}>
            Filter will update with the current date
          </Text>
        )}
    </Stack>
  )
}

/**
 * One of the two selects above the calendar: a button naming the value, and a menu of the options
 * with a checkmark on the one in force. Rendered inside the picker, not portalled, so a pick is no
 * click outside the picker.
 */
function Select<T extends string>(props: {
  id: string
  options: Record<T, string>
  value: T
  selected: T | undefined
  onPick: (value: T) => void
}) {
  const {id, options, value, selected, onPick} = props
  return (
    <Flex flex={1}>
      <MenuButton
        button={
          <Button
            iconRight={ChevronDownIcon}
            justify="space-between"
            mode="ghost"
            style={{width: '100%'}}
            text={options[value]}
          />
        }
        id={id}
        menu={
          <Menu>
            {(Object.keys(options) as T[]).map((option) => (
              <MenuItem
                iconRight={option === selected ? CheckmarkIcon : undefined}
                key={option}
                onClick={() => onPick(option)}
                pressed={option === selected}
                text={options[option]}
              />
            ))}
          </Menu>
        }
        popover={{placement: 'bottom-start', portal: false}}
      />
    </Flex>
  )
}
