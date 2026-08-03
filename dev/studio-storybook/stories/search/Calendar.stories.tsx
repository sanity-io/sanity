import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useState} from 'react'
import {CalendarContext} from 'sanity/_singletons'

import {Calendar} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/Calendar'
import {CalendarHeader} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/CalendarHeader'
import {CalendarMonth} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/CalendarMonth'
import {SearchHarness, WithSearchProviders} from '../../lib/searchHarness'

const meta: Meta = {
  title: 'Search/Calendar',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Every date and datetime filter operator eventually opens the same day-grid calendar, ' +
            'whether inline behind a text field or standing on its own.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/calendar/` (`Calendar.tsx`, `CalendarHeader.tsx`, `CalendarMonth.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          'This page looks at the calendar on its own: the whole grid, and the two pieces it is ' +
            'built from, the month header and the week grid.',
          '',
          '> **Why it matters:** the header and the month grid both call a hook that throws ' +
            'outside its provider rather than quietly returning nothing, so isolating either one ' +
            'for its own story needs a context value supplied directly, not the real calendar ' +
            'wrapping it. See Filter Inputs, Date Inputs, "The calendar itself", for the composed ' +
            'version behind a text input; this page is the calendar by itself, plus its two parts ' +
            'in isolation.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
  decorators: [WithSearchProviders()],
}

export default meta
type Story = StoryObj

// Hoisted rather than built inside the component. These are fixtures, so they must be the same
// on every render for the page to be screenshot stable.
const FIXED_DATE = new Date(Date.UTC(2026, 6, 25, 12, 0))
const FIXED_END_DATE = new Date(Date.UTC(2026, 6, 30, 12, 0))

function CalendarDemo({selectRange = false}: {selectRange?: boolean}) {
  const [date, setDate] = useState<Date | undefined>(FIXED_DATE)
  const [endDate, setEndDate] = useState<Date | undefined>(selectRange ? FIXED_END_DATE : undefined)

  const handleSelect = useCallback(
    ({date: nextDate, endDate: nextEndDate}: {date: Date | null; endDate?: Date | null}) => {
      setDate(nextDate ?? undefined)
      setEndDate(nextEndDate ?? undefined)
    },
    [],
  )

  return (
    <Stack gap={3} style={{maxWidth: 340}}>
      <Calendar date={date} endDate={endDate} onSelect={handleSelect} selectRange={selectRange} />
      <Card border padding={2} radius={2} tone="transparent">
        <Text muted size={0}>
          {date ? date.toDateString() : 'none'}
          {selectRange ? ` → ${endDate ? endDate.toDateString() : 'none'}` : ''}
        </Text>
      </Card>
    </Stack>
  )
}

export const SingleDate: Story = {
  name: 'A single-date selection',
  render: () => (
    <SearchHarness>
      <CalendarDemo />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The month `focusedDate` starts on, with the starting date shown as `selected` (the filled circle-free highlight - the ring around the 25th is the separate "today" indicator, drawn only when a day is `isSameDay(date, new Date())`, and this fixture date is not today). Click a day, or use the arrow keys once focus is inside the grid, to move the selection; the readout below shows what actually reached `onSelect`.',
      },
    },
  },
}

export const RangeSelection: Story = {
  name: 'A range selection',
  render: () => (
    <SearchHarness>
      <CalendarDemo selectRange />
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "With `selectRange`, the days between the start and end date carry `data-within-range` (square corners, primary tone) and the two ends carry `data-start-date` / `data-end-date` (rounded only on their outer edge, so the whole range reads as one continuous pill). `Calendar.tsx`'s `handleDateChange` decides which end a click updates based on `selectEndValue`, which flips automatically once both ends are set - click a day now and watch which end moves.",
      },
    },
  },
}

const FIXED_CONTEXT = {
  date: new Date(Date.UTC(2026, 6, 25)),
  focusedDate: new Date(Date.UTC(2026, 6, 25)),
  firstWeekDay: 1 as const,
}

export const HeaderOnly: Story = {
  name: 'CalendarHeader, in isolation',
  render: () => (
    <SearchHarness>
      <CalendarContext.Provider value={FIXED_CONTEXT}>
        <Card border padding={3} radius={2} style={{width: 320}}>
          <CalendarHeader moveFocusedDate={() => undefined} onNowClick={() => undefined} />
        </Card>
      </CalendarContext.Provider>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The month/year label (from `focusedDate`, not `date` - the two diverge once someone navigates months without selecting a day) plus the "Now" shortcut and the two chevrons. Handed a fixed `CalendarContext` value and no-op handlers rather than the real `Calendar`, because `useCalendar()` throws without a provider ancestor - `moveFocusedDate` and `onNowClick` are real callback props on this component, unlike `useCalendar`\'s context read.',
      },
    },
  },
}

export const MonthOnly: Story = {
  name: 'CalendarMonth, in isolation',
  render: () => (
    <SearchHarness>
      <CalendarContext.Provider value={FIXED_CONTEXT}>
        <Box style={{width: 320}}>
          <CalendarMonth onSelect={() => undefined} />
        </Box>
      </CalendarContext.Provider>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The week-day header row plus the day grid, with no navigation chrome above it - `Calendar.tsx` is the only place that pairs it with `CalendarHeader`. `WEEK_DAY_NAME_KEYS` is keyed on `firstWeekDay` (1, 6 or 7): the fixed context here uses Monday-first (1); the day cells themselves are `CalendarDay`, not separately storied on this brief.',
      },
    },
  },
}

export const FirstWeekDayVariants: Story = {
  name: 'First day of the week',
  render: () => (
    <SearchHarness>
      <Flex gap={4} wrap="wrap">
        {([1, 6, 7] as const).map((firstWeekDay) => (
          <Stack key={firstWeekDay} gap={2}>
            <Text muted size={1}>
              {firstWeekDay === 1
                ? 'Monday-first'
                : firstWeekDay === 6
                  ? 'Saturday-first'
                  : 'Sunday-first'}
            </Text>
            <CalendarContext.Provider value={{...FIXED_CONTEXT, firstWeekDay}}>
              <Box style={{width: 280}}>
                <CalendarMonth onSelect={() => undefined} />
              </Box>
            </CalendarContext.Provider>
          </Stack>
        ))}
      </Flex>
    </SearchHarness>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The three locale-driven starting weekdays `CalendarMonth.tsx` names as valid (`WEEK_DAY_NAME_KEYS`'s keys: 1, 6, 7). `Calendar.tsx` picks this from `useCurrentLocale().weekInfo.firstDay`, so in the real component it follows the studio's locale rather than being chosen directly - side by side here to show what each rotation of the header row actually looks like.",
      },
    },
  },
}
