import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {type ObjectSchemaType, type Path, type StringSchemaType} from '@sanity/types'
import {Box, Card, Flex, Menu, Select, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useId, useMemo, useRef, useState} from 'react'

import {ChangeIndicatorsTracker} from '../../../../packages/sanity/src/core/changeIndicators/tracker'
// The real native time control the calendar ships (`styled(TextInput).attrs(type: 'time')`)
// so the Current story renders the actual `<input type="time">`, not a lookalike.
import {TimeInput} from '../../../../packages/sanity/src/core/components/inputs/DateInputs/TimeInput'
import {FormValueProvider} from '../../../../packages/sanity/src/core/form/contexts/FormValue'
// Real components from real paths (org contract §8): the two date inputs under audit
// and the patch/type layer they emit.
import {DateInput} from '../../../../packages/sanity/src/core/form/inputs/DateInputs/DateInput'
import {DateTimeInput} from '../../../../packages/sanity/src/core/form/inputs/DateInputs/DateTimeInput'
import {type PatchEvent} from '../../../../packages/sanity/src/core/form/patch/PatchEvent'
import {type FormPatch} from '../../../../packages/sanity/src/core/form/patch/types'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
// Studio shadows from the ui-components barrel — the same primitives a real calendar
// rebuild would use. MenuButton enforces popover animation; Button/MenuItem are the
// canon controls. Menu/Select are raw @sanity/ui (no Studio shadow exists).
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * An `event` document with the date-family fields the stories exercise:
 * - `date` — a plain `date` (day granularity, `YYYY-MM-DD`)
 * - `datetime` — a `datetime` (instant, ISO string)
 * - `datetimeTz` — a `datetime` with `allowTimeZoneSwitch`, so the timezone chip renders
 */
const schemaTypes = [
  {
    name: 'event',
    title: 'Event',
    type: 'document',
    fields: [
      {name: 'date', title: 'Date', type: 'date'},
      {name: 'datetime', title: 'Published at', type: 'datetime'},
      {
        name: 'datetimeTz',
        title: 'Published at (timezone aware)',
        type: 'datetime',
        options: {allowTimeZoneSwitch: true},
      },
    ],
  },
]

const hostDocument = {_id: 'drafts.event-1', _type: 'event'}

/** Apply a primitive input's set/unset patch to a local string value. */
function applyStringPatch(prev: string | undefined, change: FormPatch | FormPatch[] | PatchEvent) {
  const patches: FormPatch[] = Array.isArray(change)
    ? change
    : 'patches' in change
      ? (change.patches as FormPatch[])
      : [change]
  let next = prev
  for (const patch of patches) {
    if (patch.type === 'set' && patch.path.length === 0) next = patch.value as string
    else if (patch.type === 'unset' && patch.path.length === 0) next = undefined
  }
  return next
}

interface DemoProps {
  fieldName: 'date' | 'datetime' | 'datetimeTz'
  value?: string
  validationError?: string
  readOnly?: boolean
}

/** Mounts the real `DateInput` (day granularity) with the knobs a story needs. */
function DateFieldDemo(props: DemoProps) {
  const {fieldName, validationError, readOnly} = props
  const schema = useSchema()
  const eventType = schema.get('event') as ObjectSchemaType
  const field = eventType.fields.find((candidate) => candidate.name === fieldName)!
  const schemaType = field.type as StringSchemaType

  const [value, setValue] = useState<string | undefined>(props.value)
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Unique per mounted instance so multiple canvases on the autodocs page don't collide
  // on a single fixed DOM id (the systemic duplicate-id finding). `useId` is stable across
  // renders; the `:` strip keeps it a valid id/`for` target.
  const inputId = `storybook-${fieldName}-${useId().replace(/:/g, '')}`
  const handleChange = useCallback(
    (change: FormPatch | FormPatch[] | PatchEvent) =>
      setValue((prev) => applyStringPatch(prev, change)),
    [],
  )

  const inputProps = {
    schemaType,
    value,
    path: [fieldName] as Path,
    focusPath: [] as Path,
    focused: false,
    id: inputId,
    level: 0,
    changed: false,
    readOnly,
    validation: [],
    validationError,
    presence: [],
    elementProps: {
      'id': inputId,
      'value': '',
      // `DateTimeInput` never reads a top-level `readOnly` prop — read-only reaches the
      // native input only through `elementProps.readOnly` (the real form member wires it
      // the same way). Hardcoding `false` here is what let the read-only story keep typing.
      'readOnly': Boolean(readOnly),
      'onChange': () => undefined,
      'onFocus': () => undefined,
      'onBlur': () => undefined,
      'ref': inputRef,
      'aria-describedby': undefined,
      'style': {},
    },
    onChange: handleChange,
  } as unknown as Parameters<typeof DateInput>[0]

  return (
    <Stack gap={3} style={{maxWidth: 480}}>
      <DateInput {...inputProps} />
    </Stack>
  )
}

/**
 * Mounts the real `DateTimeInput` (instant granularity, with its own field header,
 * change bar and optional timezone chip). It reads `_id` via `useFormValue`, so it is
 * wrapped in a `FormValueProvider`; `ChangeIndicatorsTracker` silences the reporter
 * warning the bare change bar would otherwise log.
 */
function DateTimeFieldDemo(props: DemoProps) {
  const {fieldName, validationError, readOnly} = props
  const schema = useSchema()
  const eventType = schema.get('event') as ObjectSchemaType
  const field = eventType.fields.find((candidate) => candidate.name === fieldName)!
  const schemaType = field.type as StringSchemaType

  const [value, setValue] = useState<string | undefined>(props.value)
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Unique per mounted instance so multiple canvases on the autodocs page don't collide
  // on a single fixed DOM id (the systemic duplicate-id finding). `useId` is stable across
  // renders; the `:` strip keeps it a valid id/`for` target.
  const inputId = `storybook-${fieldName}-${useId().replace(/:/g, '')}`
  const handleChange = useCallback(
    (change: FormPatch | FormPatch[] | PatchEvent) =>
      setValue((prev) => applyStringPatch(prev, change)),
    [],
  )

  const inputProps = {
    schemaType,
    value,
    path: [fieldName] as Path,
    focusPath: [] as Path,
    focused: false,
    id: inputId,
    level: 0,
    changed: Boolean(value),
    readOnly,
    validation: [],
    validationError,
    presence: [],
    elementProps: {
      'id': inputId,
      'value': '',
      // `DateTimeInput` never reads a top-level `readOnly` prop — read-only reaches the
      // native input only through `elementProps.readOnly` (the real form member wires it
      // the same way). Hardcoding `false` here is what let the read-only story keep typing.
      'readOnly': Boolean(readOnly),
      'onChange': () => undefined,
      'onFocus': () => undefined,
      'onBlur': () => undefined,
      'ref': inputRef,
      'aria-describedby': undefined,
      'style': {},
    },
    onChange: handleChange,
  } as unknown as Parameters<typeof DateTimeInput>[0]

  return (
    <FormValueProvider value={hostDocument as never}>
      <ChangeIndicatorsTracker>
        <Stack gap={3} style={{maxWidth: 480}}>
          <DateTimeInput {...inputProps} />
        </Stack>
      </ChangeIndicatorsTracker>
    </FormValueProvider>
  )
}

/**
 * The calendar's month labels — the same 12 the real `CalendarMonthSelect` renders into
 * a native `<select>` (`calendar/Calendar.tsx`).
 */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Build `HH:mm` slots at a fixed minute step, for the Recommended styled time list. */
function buildTimeSlots(stepMinutes: number): string[] {
  const slots: string[] = []
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
    const mm = String(minutes % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

/**
 * **Current (as shipped).** The two calendar controls exactly as the real picker builds
 * them: the month is an `@sanity/ui` `<Select>` — a styled **native `<select>`**, so its
 * open option list is the OS browser menu (`calendar/Calendar.tsx` `CalendarMonthSelect`,
 * line 475) — and the time is the real `TimeInput`, a **native `<input type="time">`**
 * (`components/inputs/DateInputs/TimeInput.tsx`). The trigger boxes are themed, but the
 * moment either opens its picker the design system stops: the option list and the time
 * spinner are OS chrome the theme cannot reach.
 */
function CurrentCalendarControls() {
  const [month, setMonth] = useState(2) // March, to match the dated stories
  const [time, setTime] = useState('10:30')

  return (
    <Card border padding={3} radius={2} style={{maxWidth: 340}}>
      <Stack gap={3}>
        <Text size={1} muted>
          Month + time, as the calendar ships them
        </Text>
        <Flex gap={2} align="center">
          <Box flex={1}>
            <Select
              fontSize={1}
              radius={2}
              padding={2}
              value={month}
              onChange={(event) => setMonth(Number(event.currentTarget.value))}
            >
              {MONTH_NAMES.map((monthName, index) => (
                // oxlint-disable-next-line no-array-index-key
                <option key={index} value={index}>
                  {monthName}
                </option>
              ))}
            </Select>
          </Box>
          <Box style={{width: 104}}>
            <TimeInput
              aria-label="Select time"
              value={time}
              onChange={(event) => setTime(event.currentTarget.value)}
            />
          </Box>
        </Flex>
      </Stack>
    </Card>
  )
}

/**
 * **Recommended (design argument, not a shipped component).** The same two controls built
 * from product-native primitives, so nothing OS-drawn breaks through. The month is a
 * `MenuButton` + `Menu` of `MenuItem`s (opens **our** portaled popover, themed with the
 * surface, keyboard-navigable, checkmark on the selected month). The time is a styled,
 * scrollable list of `@sanity/ui` `Button`s at a fixed step — a real, themeable surface
 * in place of the native spinner. Prop-driven; it argues the pattern, it does not ship it.
 */
function RecommendedCalendarControls() {
  const [month, setMonth] = useState(2)
  const [time, setTime] = useState('10:30')
  const slots = useMemo(() => buildTimeSlots(30), [])

  return (
    <Card border padding={3} radius={2} style={{maxWidth: 340}}>
      <Stack gap={3}>
        <Text size={1} muted>
          Month + time, product-native
        </Text>
        <Flex gap={2} align="flex-start">
          <Box flex={1}>
            <MenuButton
              id="recommended-month-picker"
              button={
                <Button
                  mode="ghost"
                  text={MONTH_NAMES[month]}
                  iconRight={ChevronDownIcon}
                  style={{width: '100%'}}
                />
              }
              menu={
                <Menu>
                  {MONTH_NAMES.map((monthName, index) => (
                    <MenuItem
                      // oxlint-disable-next-line no-array-index-key
                      key={index}
                      text={monthName}
                      iconRight={index === month ? CheckmarkIcon : undefined}
                      selected={index === month}
                      onClick={() => setMonth(index)}
                    />
                  ))}
                </Menu>
              }
              popover={{placement: 'bottom-start', constrainSize: true}}
            />
          </Box>
          <Box style={{width: 104}}>
            <Card border radius={2} style={{maxHeight: 168, overflow: 'auto'}}>
              <Stack gap={1} padding={1}>
                {slots.map((slot) => (
                  <Button
                    key={slot}
                    mode="bleed"
                    text={slot}
                    selected={slot === time}
                    onClick={() => setTime(slot)}
                    style={{justifyContent: 'flex-start'}}
                  />
                ))}
              </Stack>
            </Card>
          </Box>
        </Flex>
      </Stack>
    </Card>
  )
}

const meta: Meta = {
  title: 'Forms & Input/DateInputs',
  parameters: {
    docs: {
      description: {
        component: [
          'An unparseable date never reaches `onChange`: the field keeps its last valid value ' +
            'and flags the problem only as a native outline whose message is hidden until the ' +
            'author happens to hover it, so a red field can look like a data problem when it is ' +
            'only a display one.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/DateInputs/`, Studio-only, no DS equivalent |',
          '| Tier | SERVICE. Date and datetime inputs are schema-driven form primitives layered over the shared calendar picker; the value is a plain string, the affordance is the service |',
          '| Audit | 🔴 needs-work (`forgiving-format`, `inline-validation-timing`, `error-messages`). An unparseable entry never reaches `onChange`; the parse error is surfaced only as `customValidity` on the native input (a red outline whose message is hidden until hover), the same hover-hidden pattern the audit flagged on slug validation |',
          '| Patterns | `forgiving-format` · `inline-validation-timing` · `error-messages` · `visual-framework` |',
          '',
          'The date and datetime fields, a calendar picker for a plain day, or a day plus a ' +
            'time (and optionally a timezone) for an exact instant. These are the fields an ' +
            'editor reaches for to set a publish date or an event time. `DateInput` captures a ' +
            'plain day (`YYYY-MM-DD`); `DateTimeInput` captures an exact instant and, when the ' +
            'schema turns it on, shows a timezone chip so a reader in another zone still sees the ' +
            'right moment. Both open the same shared calendar, and both store a simple string, ' +
            'the affordance is the value they add on top.',
          '',
          'Both stories mount the real inputs on the studio provider stack ' +
            '(`lib/testProvider.tsx`). `DateInput` renders bare (day granularity, `YYYY-MM-DD`). ' +
            '`DateTimeInput` carries its own field header, change bar and, when the schema ' +
            'enables it, a timezone chip; it reads `_id` via `useFormValue`, so it is wrapped in ' +
            'a `FormValueProvider`.',
          '',
          'Harness note: parse errors are transient (they appear only after you type an ' +
            'unparseable value), so the "invalid" stories are interactive, type e.g. `not-a-date` ' +
            'and the field outlines red. `useReportParseError` is a no-op outside a ' +
            '`ParseErrorsProvider`, so the parse message is not routed to a document-level panel ' +
            "here; the input's own `customValidity` still fires.",
          '',
          '**Native controls breaking through the design (`visual-framework`).** A second, ' +
            'screenshot-verified finding, independent of the validation one. Inside the calendar, ' +
            'the month control is a native `<select>` (`@sanity/ui` `Select`, styled `<select>`, ' +
            '`calendar/Calendar.tsx:475`) and the time control is a native `<input type="time">` ' +
            '(`components/inputs/DateInputs/TimeInput.tsx:4`). The trigger boxes are themed, but ' +
            "a native control's open surface, the `<select>` option list, the time spinner, is OS " +
            'chrome the theme cannot style, so it breaks through a fully-designed picker. ' +
            'Everything else here is opinionated; a native control breaking through a designed ' +
            'surface is not a taste call, it reads as un-design. The Current/Recommended pair is ' +
            'the argument: the Recommended month opens our `MenuButton` popover and swaps the ' +
            'native spinner for a styled time list built from `@sanity/ui` primitives.',
          '',
          '> **Why it matters:** an unparseable entry never reaches `onChange`. The field keeps ' +
            'its last valid value and flags the problem only as a native outline whose message is ' +
            'hidden until the author hovers it. A red field here does not mean the bad text made ' +
            'it into the data.',
          '',
          'The page closes in context: the Date and Published-at datetime fields side by side ' +
            'on an "Anna Karenina, book launch" event being scheduled.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
    }),
  ],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:forgiving-format',
    'pattern:inline-validation-timing',
    'pattern:error-messages',
    'pattern:visual-framework',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Date input, empty: placeholder shows the expected `YYYY-MM-DD` example. */
export const DateEmpty: Story = {
  name: 'Date, empty',
  // Own iframe so the body-portaled calendar (opened from the field button) stays bounded
  // in the docs canvas rather than escaping over the next story.
  parameters: {docs: {story: {inline: false, height: '420px'}}},
  render: () => <DateFieldDemo fieldName="date" />,
}

/** Date input with a value (`2026-03-15`): the calendar opens on the field button. */
export const DateWithValue: Story = {
  name: 'Date, with value',
  // The calendar opens into a body-level portal positioned against the viewport, so on the
  // inline docs page it escapes the canvas. Render this story in its own iframe (inline:
  // false) where the portal is bounded to the frame, and give the frame room for the picker.
  parameters: {docs: {story: {inline: false, height: '420px'}}},
  render: () => <DateFieldDemo fieldName="date" value="2026-03-15" />,
}

/** Datetime input with a value: the ISO instant rendered in the configured format. */
export const DateTimeWithValue: Story = {
  name: 'Datetime, with value',
  // Own iframe: the datetime calendar (calendar grid plus a time row) is taller than the
  // field, and its body-level portal would otherwise escape the inline canvas.
  parameters: {docs: {story: {inline: false, height: '470px'}}},
  render: () => <DateTimeFieldDemo fieldName="datetime" value="2026-03-15T10:30:00.000Z" />,
}

/**
 * Datetime with `allowTimeZoneSwitch`; the field header shows a **timezone chip**
 * (offset + abbreviation). Switching zones re-renders the displayed value without
 * changing the stored ISO instant.
 */
export const DateTimeWithTimezone: Story = {
  name: 'Datetime, timezone aware',
  // Own iframe: field header carries the timezone chip and the datetime calendar portals
  // at body level; the frame gives both the header and the open picker room.
  parameters: {docs: {story: {inline: false, height: '470px'}}},
  render: () => <DateTimeFieldDemo fieldName="datetimeTz" value="2026-03-15T10:30:00.000Z" />,
}

/**
 * **Current (audit finding).** `error-messages` / `forgiving-format`: type an
 * unparseable value (e.g. `not-a-date`) into the field. It never reaches `onChange`;
 * instead the input outlines red and the reason is set as `customValidity`, visible
 * only on hover. The empty-then-invalid path is the one the audit walked.
 */
export const CurrentInvalidDate: Story = {
  name: 'Current (parse error hidden until hover)',
  tags: ['audit:needs-work'],
  render: () => (
    <Stack gap={3} style={{maxWidth: 480}}>
      <Card border padding={3} radius={2} tone="caution">
        <Text size={1}>
          Type an unparseable value such as <code>not-a-date</code>. The field outlines red; hover
          it to reveal the message, nothing is shown inline.
        </Text>
      </Card>
      <DateFieldDemo fieldName="date" />
    </Stack>
  ),
}

/**
 * **Recommended.** The same failure surfaced as a persistent, legible inline strip, no
 * hover required, with copy that states the accepted format. Here the message is
 * passed through `validationError` (which also drives the outline) and echoed inline;
 * the full fix would also evaluate on blur rather than only at publish time.
 */
export const RecommendedInvalidDate: Story = {
  name: 'Recommended (visible inline message)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <Stack gap={3} style={{maxWidth: 480}}>
      <DateFieldDemo
        fieldName="date"
        value="2026-13-40"
        validationError="Enter a date as YYYY-MM-DD."
      />
      <Card border padding={3} radius={2} tone="critical">
        <Text size={1}>Enter a date as YYYY-MM-DD.</Text>
      </Card>
    </Stack>
  ),
}

/** Read-only datetime: the field and its calendar trigger are disabled. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <DateTimeFieldDemo fieldName="datetime" value="2026-03-15T10:30:00.000Z" readOnly />
  ),
}

/**
 * **Current (native controls).** `visual-framework`: the calendar's month is a native
 * `<select>` and its time is a native `<input type="time">`. Open the month dropdown:
 * it is the OS browser menu, not a Studio surface; the time spinner is native chrome too.
 * The trigger boxes are themed, but the picker each opens breaks through the design.
 */
export const CurrentNativeControls: Story = {
  name: 'Current (native controls)',
  tags: ['audit:needs-work'],
  // Own iframe: the native `<select>` option list and the time spinner escape as OS-level
  // popups; the frame keeps the story bounded on the inline docs page.
  parameters: {docs: {story: {inline: false, height: '220px'}}},
  render: () => <CurrentCalendarControls />,
}

/**
 * **Recommended (product-native picker).** The month opens **our** `MenuButton` popover
 * (themed, keyboard-navigable, checkmark on the selection) and the time is a styled,
 * scrollable list of `@sanity/ui` `Button`s, no OS chrome breaks through. A design
 * argument built from real primitives, not a shipped component.
 */
export const RecommendedNativeControls: Story = {
  name: 'Recommended (product-native picker)',
  tags: ['!audit:needs-work', 'audit:holds'],
  // Own iframe: the MenuButton popover portals to the frame body; the height gives the
  // open month menu and the scrolling time list room.
  parameters: {docs: {story: {inline: false, height: '320px'}}},
  render: () => <RecommendedCalendarControls />,
}

/**
 * In context: the two real date inputs as sibling fields of an event being scheduled,
 * the "Anna Karenina" book launch. The plain `DateInput` captures the event day and the
 * `DateTimeInput` (with its own field header and change bar) captures the exact publish
 * instant. Open either field to reach the shared calendar; this is the everyday moment
 * an editor sets a date, not an isolated control.
 */
export const InContext: Story = {
  name: 'In context',
  // Own iframe: both fields portal their calendars at body level; the frame keeps them
  // bounded on the inline docs page and gives the open pickers room.
  parameters: {docs: {story: {inline: false, height: '540px'}}},
  render: () => (
    <Card border padding={4} radius={3} style={{maxWidth: 480}}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} muted>
            Event
          </Text>
          <Text size={2} weight="semibold">
            Anna Karenina, book launch
          </Text>
        </Stack>
        <Stack gap={3}>
          <Text size={1} weight="medium">
            Event date
          </Text>
          <DateFieldDemo fieldName="date" value="2026-03-15" />
        </Stack>
        <DateTimeFieldDemo fieldName="datetime" value="2026-03-15T18:30:00.000Z" />
      </Stack>
    </Card>
  ),
}
