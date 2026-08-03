import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useState} from 'react'

import {SearchFilterDateAfterInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateAfter'
import {SearchFilterDateBeforeInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateBefore'
import {SearchFilterDateEqualInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateEqual'
import {DateIncludeTimeFooter} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/dateIncludeTimeFooter/DateIncludeTimeFooter'
import {SearchFilterDateLastInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateLast'
import {DatePicker} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/datePicker/DatePicker'
import {SearchFilterDateRangeInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateRange'
import {SearchFilterDateTimeAfterInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateTimeAfter'
import {SearchFilterDateTimeBeforeInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateTimeBefore'
import {SearchFilterDateTimeEqualInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateTimeEqual'
import {SearchFilterDateTimeRangeInput} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/date/DateTimeRange'
import {
  type OperatorDateDirectionValue,
  type OperatorDateEqualValue,
  type OperatorDateRangeValue,
} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/definitions/operators/dateOperators'
import {
  FilterInputFrame,
  OperatorInputStory,
  WithFilterProviders,
} from '../../../lib/searchFilterHarness'

const meta: Meta = {
  title: 'Search/Filter Inputs/Date',
  decorators: [WithFilterProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          "Date and datetime filters are search's largest operator family, and every pair in it " +
            'differs by exactly one thing: whether the emitted value carries a time component.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `.../search/components/filters/filter/inputs/date/` |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
          '',
          'Three shapes exist: a single date (direction or equality), a from/to range, and a ' +
            'relative "in the last N units". Two of those three are doubled across a `date` and a ' +
            '`datetime` field type. Nine leaf components live under `inputs/date/`, but most are ' +
            'thin wrappers: `CommonDateDirectionInput`, `CommonDateEqualInput` and ' +
            '`CommonDateRangeInput` do the actual work, and each leaf file just fixes a ' +
            '`direction` and an `isDateTime` flag before handing off.',
          '',
          '> **Why it matters:** every date and datetime pair here differs by exactly one ' +
            'thing: whether the emitted value carries a time component. The plain variant asks ' +
            'for a date-only string; the datetime variant asks for the same shape with the clock ' +
            'included. That is the organising idea of the family, not two different controls, one ' +
            'control asked to keep or drop the clock. The datetime inputs additionally render a ' +
            'switch that lets a person decide, value by value, whether this particular date is ' +
            'time-precise even though the field itself supports it.',
          '',
          'The operator-to-input mapping is not one-to-one, and it is worth being exact about ' +
            'where it collapses: `dateNotEqual` points `inputComponent` at the exact same ' +
            '`SearchFilterDateEqualInput` as `dateEqual` (only the compiled `groqFilter` ' +
            'differs), and `dateTimeNotEqual` does the same against ' +
            '`SearchFilterDateTimeEqualInput`. `dateLast` and `dateTimeLast` go further still: ' +
            'both point at one component, `SearchFilterDateLastInput`, which has no `isDateTime` ' +
            'prop and no date/datetime split at all, the one member of this family that breaks ' +
            'the doubling pattern, because a relative "7 days ago" reads the same regardless of ' +
            'whether the field carries a clock.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------
// Direction inputs: dateAfter / dateBefore / dateTimeAfter / dateTimeBefore
// ---------------------------------------------------------------------------

export const DateAfterEmpty: Story = {
  name: 'After, empty (date)',
  parameters: {
    docs: {
      description: {
        story:
          'The resting state of `dateAfter`. `CommonDateDirectionInput` renders `ParsedDateTextInput` above `DatePicker`; with `isDateTime={false}` fixed at the `DateAfter` wrapper, there is no include-time footer to show since a plain `date` field has no clock to carry.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory input={SearchFilterDateAfterInput} fieldPath="reviewDate" />
    </FilterInputFrame>
  ),
}

export const DateAfterFilled: Story = {
  name: 'After, filled (date)',
  parameters: {
    docs: {
      description: {
        story:
          'The same control carrying a value. Typed or picked, the emitted shape is `{date, includeTime?}` where `date` is a date-only ISO string (`YYYY-MM-DD`), because `DateAfter` fixes `isDateTime={false}` regardless of what the footer would otherwise do. `dateAfter`\'s `groqFilter` interpolates it directly: `reviewDate > "2026-07-10"`.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateAfterInput}
        fieldPath="reviewDate"
        initialValue={{date: '2026-07-10'} as OperatorDateDirectionValue}
      />
    </FilterInputFrame>
  ),
}

export const DateBeforeFilled: Story = {
  name: 'Before, filled (date)',
  parameters: {
    docs: {
      description: {
        story:
          '`DateBefore` renders the exact same `CommonDateDirectionInput`, just with `direction="before"` instead of `"after"`. The only behavioural difference is which way an ambiguous calendar click rounds (`roundDay: \'start\'` here vs `\'end\'` for after); the control on screen is identical. Pointed at `joinedAt` to show the input against a fixture field outside the article type.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateBeforeInput}
        fieldPath="joinedAt"
        initialValue={{date: '2026-06-01'} as OperatorDateDirectionValue}
      />
    </FilterInputFrame>
  ),
}

export const DateTimeAfterFilled: Story = {
  name: 'After, filled (datetime, time not carried)',
  parameters: {
    docs: {
      description: {
        story:
          '`DateTimeAfter` is the same `CommonDateDirectionInput` with `isDateTime` set. With `includeTime` still `false`, `ParsedDateTextInput` formats and re-parses the value as a date only ("Jul 10, 2026") even though the stored ISO string carries a timestamp - the clock is present in the value but hidden from the control until the footer switch is flipped, shown next.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeAfterInput}
        fieldPath="publishedAt"
        initialValue={
          {date: '2026-07-10T14:30:00.000Z', includeTime: false} as OperatorDateDirectionValue
        }
      />
    </FilterInputFrame>
  ),
}

export const DateTimeAfterWithTime: Story = {
  name: 'After, filled (datetime, time carried)',
  parameters: {
    docs: {
      description: {
        story:
          'Same field, `includeTime: true`. `isDateTimeFormat` is now true, so `ParsedDateTextInput` formats and parses full timestamps ("Jul 10, 2026 2:30 PM") and `DatePicker` renders a time selector alongside the day grid. This one prop is what separates "a datetime field where I only care about the day" from "a datetime field where the exact minute matters" - the field type does not decide that, the person building the filter does.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeAfterInput}
        fieldPath="publishedAt"
        initialValue={
          {date: '2026-07-10T14:30:00.000Z', includeTime: true} as OperatorDateDirectionValue
        }
      />
    </FilterInputFrame>
  ),
}

export const DateTimeBeforeFilled: Story = {
  name: 'Before, filled (datetime, time carried)',
  parameters: {
    docs: {
      description: {
        story:
          '`DateTimeBefore`, direction flipped. Included for completeness: like `DateBefore` above, the only change from `DateTimeAfter` is which end of an ambiguous instant a calendar click rounds to.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeBeforeInput}
        fieldPath="publishedAt"
        initialValue={
          {date: '2026-07-20T09:00:00.000Z', includeTime: true} as OperatorDateDirectionValue
        }
      />
    </FilterInputFrame>
  ),
}

export const DateAfterFullscreen: Story = {
  name: 'After, full-screen sizing (date)',
  parameters: {
    docs: {
      description: {
        story:
          'The same `DateAfter` control inside a full-screen search. Every input in this family ' +
          'reads `state.fullscreen` and steps its font size up (`fontSize={fullscreen ? 2 : ' +
          '1}`) on the text input, the same convention `SearchFilterStringInput` and the number ' +
          'family follow. The date family is easy to assume is exempt, given how much more it ' +
          'renders.',
      },
    },
  },
  render: () => (
    <FilterInputFrame fullscreen>
      <OperatorInputStory
        input={SearchFilterDateAfterInput}
        fieldPath="reviewDate"
        initialValue={{date: '2026-07-10'} as OperatorDateDirectionValue}
      />
    </FilterInputFrame>
  ),
}

// ---------------------------------------------------------------------------
// Equality inputs: dateEqual / dateNotEqual / dateTimeEqual / dateTimeNotEqual
// ---------------------------------------------------------------------------

export const DateEqualEmpty: Story = {
  name: 'Equal, empty (date)',
  parameters: {
    docs: {
      description: {
        story:
          "The resting state of `dateEqual` - and, since they share this exact component, `dateNotEqual` too. `CommonDateEqualInput` differs from the direction inputs in one detail: clearing the calendar selection calls `onChange(null)` outright rather than emitting `{date: null}`, since equality has no direction worth preserving once the date is gone. This is `dateEqual`'s own declared `initialValue`, `{date: null, includeTime: false}`.",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateEqualInput}
        fieldPath="reviewDate"
        initialValue={{date: null, includeTime: false} as OperatorDateEqualValue}
      />
    </FilterInputFrame>
  ),
}

export const DateEqualFilled: Story = {
  name: 'Equal, filled (date)',
  parameters: {
    docs: {
      description: {
        story:
          "Emits `{date, includeTime}`, structurally identical to `DateAfter` filled, just without a direction. `dateEqual`'s `groqFilter` does not compare a raw timestamp for equality; it widens to `dateTime(field) > start && dateTime(field) < end` for the picked day (see the datetime variants below for where that window narrows).",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateEqualInput}
        fieldPath="reviewDate"
        initialValue={{date: '2026-07-15', includeTime: false} as OperatorDateEqualValue}
      />
    </FilterInputFrame>
  ),
}

export const DateTimeEqualFilled: Story = {
  name: 'Equal, filled (datetime, time not carried)',
  parameters: {
    docs: {
      description: {
        story:
          '`dateTimeEqual`\'s `groqFilter` builds a same-day window with `startOfDay`/`endOfDay` when `includeTime` is false, so "published on July 15" matches any time that day. `dateTimeNotEqual` points `inputComponent` at this identical `SearchFilterDateTimeEqualInput` and negates the same window rather than rendering anything different.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeEqualInput}
        fieldPath="publishedAt"
        initialValue={
          {date: '2026-07-15T10:00:00.000Z', includeTime: false} as OperatorDateEqualValue
        }
      />
    </FilterInputFrame>
  ),
}

export const DateTimeEqualWithTime: Story = {
  name: 'Equal, filled (datetime, time carried)',
  parameters: {
    docs: {
      description: {
        story:
          'With `includeTime: true`, the same `groqFilter` narrows its window to `startOfMinute`/`endOfMinute` instead of the whole day. Equality becomes "within the same minute", which is the practical resolution of a calendar-plus-clock picker, not exact-to-the-millisecond.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeEqualInput}
        fieldPath="publishedAt"
        initialValue={
          {date: '2026-07-15T10:00:00.000Z', includeTime: true} as OperatorDateEqualValue
        }
      />
    </FilterInputFrame>
  ),
}

// ---------------------------------------------------------------------------
// Range inputs: dateRange / dateTimeRange
// ---------------------------------------------------------------------------

export const DateRangeFilled: Story = {
  name: 'Range, filled (date)',
  parameters: {
    docs: {
      description: {
        story:
          '`dateRange`, both bounds set. `CommonDateRangeInput` renders two `ParsedDateTextInput`s (start, end) above one `DatePicker` in `selectRange` mode. Its placeholders default to today for the end bound and seven days prior for the start, so an empty range still reads as a sensible default window rather than blank boxes with no hint of scale.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateRangeInput}
        fieldPath="reviewDate"
        initialValue={
          {from: '2026-07-01', to: '2026-07-25', includeTime: false} as OperatorDateRangeValue
        }
      />
    </FilterInputFrame>
  ),
}

export const DateTimeRangeFilled: Story = {
  name: 'Range, filled (datetime, time not carried)',
  parameters: {
    docs: {
      description: {
        story:
          "`dateTimeRange` with `includeTime: false`. `getStartAndEndDate` still rounds each picked bound to a day boundary (`roundDay: 'start'` for `from`, `'end'` for `to`) even though the field is a datetime, so a calendar click on \"July 25\" as the end bound resolves to the last instant of that day rather than its midnight.",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeRangeInput}
        fieldPath="publishedAt"
        initialValue={
          {
            from: '2026-07-01T09:00:00.000Z',
            to: '2026-07-25T18:00:00.000Z',
            includeTime: false,
          } as OperatorDateRangeValue
        }
      />
    </FilterInputFrame>
  ),
}

export const DateTimeRangeWithTime: Story = {
  name: 'Range, filled (datetime, time carried)',
  parameters: {
    docs: {
      description: {
        story:
          "Same range, `includeTime: true`. Both bounds now round to `'start'` of the picked instant rather than one rounding to the start and the other to the end of its day, and the text inputs format and parse full timestamps like the equal and direction variants above.",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateTimeRangeInput}
        fieldPath="publishedAt"
        initialValue={
          {
            from: '2026-07-01T09:00:00.000Z',
            to: '2026-07-25T18:00:00.000Z',
            includeTime: true,
          } as OperatorDateRangeValue
        }
      />
    </FilterInputFrame>
  ),
}

// ---------------------------------------------------------------------------
// Relative input: dateLast / dateTimeLast (one shared component)
// ---------------------------------------------------------------------------

export const DateLast: Story = {
  name: '"In the last", shared by date and datetime',
  parameters: {
    docs: {
      description: {
        story:
          "`SearchFilterDateLastInput` is the one member of this family with no date/datetime split at all: `dateLast` and `dateTimeLast` both point `inputComponent` at this exact component, and it takes no `isDateTime` prop to receive. A relative window like \"in the last 7 days\" reads the same regardless of whether the field carries a clock, because `dateLast`'s `groqFilter` always floors to a whole day (`sub(...).toISOString().split('T')[0]`) even when the operator is `dateTimeLast`. The unit select (day/month/year) is the only structural choice this input makes; the number box beside it is a plain uncontrolled string, the same pattern the number family uses. Shown here with the value both operators declare as their default, `{unit: 'day', unitValue: 7}`.",
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <OperatorInputStory
        input={SearchFilterDateLastInput}
        fieldPath="publishedAt"
        initialValue={{unit: 'day', unitValue: 7}}
      />
    </FilterInputFrame>
  ),
}

// ---------------------------------------------------------------------------
// The calendar and the include-time footer, standalone
// ---------------------------------------------------------------------------

function DatePickerDemo() {
  // oxlint-disable-next-line react/react-compiler -- Date.UTC is the builtin static method, not a component; false positive on the capitalized-call heuristic
  const [date, setDate] = useState<Date | undefined>(new Date(Date.UTC(2026, 6, 25, 12, 0)))

  const handleChange = useCallback(({date: next}: {date?: Date | null}) => {
    setDate(next ?? undefined)
  }, [])

  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <DatePicker date={date} onChange={handleChange} />
      <Card border padding={2} radius={2} tone="transparent">
        <Flex align="flex-start" gap={2}>
          <Box style={{flex: '0 0 auto'}}>
            <Text muted size={0} weight="medium">
              SELECTED
            </Text>
          </Box>
          <Code size={0} style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
            {date ? date.toDateString() : 'null'}
          </Code>
        </Flex>
      </Card>
    </Stack>
  )
}

export const DatePickerOpen: Story = {
  name: 'The calendar itself',
  parameters: {
    docs: {
      description: {
        story:
          '`DatePicker` (and the `Calendar` it wraps) is not a popover in this family: every direction, equal and range story above renders it inline, always visible, immediately below its text input - there is no trigger to "open". Isolated here on its own page because it is a substantial component in its own right: month/year navigation, a "now" shortcut, and a day grid that answers to both click and arrow-key focus, none of which is easy to see when it is sharing a frame with a text input and an EMITS readout. Click a day to move the selection.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <DatePickerDemo />
    </FilterInputFrame>
  ),
}

function IncludeTimeFooterDemo() {
  const [includeTime, setIncludeTime] = useState(false)

  const handleChange = useCallback(() => {
    setIncludeTime((current) => !current)
  }, [])

  return (
    <Stack gap={3} style={{maxWidth: 420}}>
      <DateIncludeTimeFooter onChange={handleChange} value={includeTime} />
      <Card border padding={2} radius={2} tone="transparent">
        <Flex align="flex-start" gap={2}>
          <Box style={{flex: '0 0 auto'}}>
            <Text muted size={0} weight="medium">
              EMITS
            </Text>
          </Box>
          <Code size={0}>{JSON.stringify(includeTime)}</Code>
        </Flex>
      </Card>
    </Stack>
  )
}

export const IncludeTimeFooter: Story = {
  name: 'The include-time footer',
  parameters: {
    docs: {
      description: {
        story:
          '`DateIncludeTimeFooter`, isolated from the `DateTime*` inputs it normally lives inside. A controlled `Switch` plus a clickable label, both wired to the same `onChange` - the value it carries is a plain boolean. Flipping it is exactly what moves a `DateTimeEqual` / `DateTimeAfter` / `DateTimeRange` story between the "time not carried" and "time carried" variants shown earlier in this chapter; here it is shown without a date input attached, so the control can be read as what it actually is: a two-state switch, not a date control in its own right.',
      },
    },
  },
  render: () => (
    <FilterInputFrame>
      <IncludeTimeFooterDemo />
    </FilterInputFrame>
  ),
}
