import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useState} from 'react'

// Real component from its real path (org contract §8): the schedule editor form and
// the plain `{date}` payload it emits. The scheduled-publishing folder is import-
// restricted (it is being deprecated); storying its live UI is a deliberate exception,
// so the two source imports carry a targeted, used disable, matching the folder's own
// cross-import convention.
// oxlint-disable-next-line no-restricted-imports -- documenting the still-shipping (deprecated) surface
import {EditScheduleForm} from '../../../../packages/sanity/src/core/scheduled-publishing/components/editScheduleForm'
// oxlint-disable-next-line no-restricted-imports -- documenting the still-shipping (deprecated) surface
import {type ScheduleFormData} from '../../../../packages/sanity/src/core/scheduled-publishing/types'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Mounts the real `EditScheduleForm` (which renders the internal `ScheduleForm`) with a
 * controlled `{date}` value. The form is a single datetime field: the shared
 * scheduled-publishing `DateTimeInput`, formatted with the workspace's
 * `scheduledPublishing.inputDateTimeFormat` (`dd/MM/yyyy HH:mm`) and validated so a
 * chosen instant must be in the future. The instant is interpreted in the
 * scheduled-publishing time zone, the calendar popover carries a time-zone affordance
 * that opens the picker storied in `Scheduling/Time Zone Dialog`.
 */
function ScheduleFormDemo(props: {value?: ScheduleFormData | null; hint?: ReactNode}) {
  const [value, setValue] = useState<ScheduleFormData | null>(props.value ?? null)
  return (
    <Stack gap={4} style={{maxWidth: 420}}>
      {/* oxlint-disable-next-line no-deprecated -- deliberate exception, matches this file's own documented stance on the still-shipping scheduled-publishing surface */}
      <EditScheduleForm onChange={setValue} value={value} />
      <Card border padding={3} radius={2} tone="transparent">
        <Stack gap={3}>
          <Text muted size={1}>
            Emitted value: <code>{value ? JSON.stringify(value) : 'null'}</code>
          </Text>
          {props.hint && (
            <Text muted size={0}>
              {props.hint}
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * The calendar popover portals to `document.body` (outside the story canvas), and the
 * harness suspends while the mock workspace compiles, so the play function polls the
 * document for each trigger before acting. Plain DOM, real clicks (the same idiom as the
 * PortableText and Tasks stories).
 */
function waitForElement(root: ParentNode, selector: string, timeout = 8000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const poll = () => {
      const element = root.querySelector<HTMLElement>(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Timed out waiting for ${selector}`))
      } else {
        setTimeout(poll, 100)
      }
    }
    poll()
  })
}

const FUTURE_ONLY_HINT =
  'The form validates future instants only ("Date cannot be in the past."): in the calendar, ' +
  'every past day is a disabled button, clicking one is a no-op by design. Pick a day from ' +
  'today forward and the emitted value updates.'

const meta: Meta = {
  title: 'Scheduling/Schedule Form',
  parameters: {
    docs: {
      description: {
        component: [
          'ScheduleForm accepts only a future instant, and the calendar enforces that before a ' +
            'value is ever typed.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/scheduled-publishing/components/editScheduleForm/`, Studio-only (no DS equivalent) |',
          '| Tier | SERVICE. A schema-driven datetime form: the shared scheduled-publishing `DateTimeInput` wrapped with a future-date constraint and a `{date}` payload. The value is a plain ISO string; the affordance is the service |',
          "| Audit | 🟡 partial (`content-versioning`, timezone legibility). The field accepts a date/time, but the zone the instant is read in is not surfaced inline on the field itself, reachable only through the calendar popover's time-zone affordance (see Scheduling, Time Zone Dialog). Scheduled publishing is deprecated in source, folding into Releases, which is the content-versioning context the audit flagged |",
          '| Patterns | `content-versioning` · `schema-driven-forms` |',
          '',
          'The story mounts the real `EditScheduleForm` on the studio provider stack ' +
            '(`lib/testProvider.tsx`). The `{date}` value is controlled locally and echoed below ' +
            'the form so the emitted payload is visible.',
          '',
          '`ScheduleForm` passes `customValidation: (d) => d > now` into the shared ' +
            '`DateTimeInput`: a typed instant in the past is rejected with a field-level "Date ' +
            'cannot be in the past." error and emits nothing, and `CalendarDay` renders every ' +
            'past day as a disabled button, so clicking one is silently a no-op. With an empty ' +
            'value the calendar opens on the current month, where most visible days are past, ' +
            'disabled, and, see below, barely visible. The "Pick a date (live emit)" story drives ' +
            'the full round-trip with real clicks so the emitted `{date}` payload is proven live.',
          '',
          '> **Why it matters:** disabled calendar days are illegible in the dark scheme, a ' +
            "real defect flagged for the ledger. A disabled day takes the theme's disabled-card " +
            'tokens, foreground #2a2d3f on background #13141b, roughly 1.2 to 1 contrast, ' +
            "functionally invisible day numbers. The studio's default and custom-built themes " +
            'produce identical disabled-card colors, so this is exactly how the real Studio ' +
            'renders past days in this calendar in dark mode, not a harness artifact, and easily ' +
            'misread as a blank, clipped, or broken day grid, which it was, twice, in QA. Enabled ' +
            'days render normally.',
          '',
          'The last story shows the form in a real publish moment: picking when the "Anna ' +
            'Karenina" draft goes live, the emitted `{date}` payload shown below it.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders()],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:content-versioning',
    'pattern:schema-driven-forms',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * Empty form: the datetime field shows its `dd/MM/yyyy HH:mm` placeholder. Opening the
 * calendar from here lands on the current month, where every day up to today is disabled
 * by the future-only rule (and near-invisible in the dark scheme, the documented defect):
 * to see the emitted value update, pick a day from today forward, or type a future
 * `dd/MM/yyyy HH:mm` instant and blur. A past instant is rejected with the field-level
 * "Date cannot be in the past." error and emits nothing, by design.
 */
export const Empty: Story = {
  name: 'Empty',
  // Own iframe with room for the open calendar: the field's date/time picker opens into a
  // body-level portal (placement `bottom-end`) that is taller than the field, so the frame
  // must be tall enough that opening it doesn't clip the calendar in the docs canvas.
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => <ScheduleFormDemo hint={FUTURE_ONLY_HINT} />,
}

/** Pre-filled with a fixed future instant so the render is deterministic. */
export const WithValue: Story = {
  name: 'With value',
  parameters: {docs: {story: {inline: false, height: '520px'}}},
  render: () => (
    <ScheduleFormDemo value={{date: '2027-03-15T10:30:00.000Z'}} hint={FUTURE_ONLY_HINT} />
  ),
}

/**
 * The emitted-value round-trip, proven live: the play function opens the calendar with a
 * real click, steps to **next month** (where every day passes the future-only rule), and
 * clicks the 15th, the `{date}` payload lands in the panel below the form. This is the
 * behavioural counter-evidence to the "onChange wiring is dead" QA read: the wiring was
 * always live; the clicks in that repro landed on *disabled past days* (see the component
 * docblock for why those are also nearly invisible in the dark scheme).
 */
export const PickDateLive: Story = {
  name: 'Pick a date (live emit)',
  parameters: {docs: {story: {inline: false, height: '640px'}}},
  render: () => <ScheduleFormDemo hint={FUTURE_ONLY_HINT} />,
  play: async () => {
    // All targets portal-adjacent: the calendar button lives in the story canvas, the
    // popover in a body-level portal, poll the document root for both.
    const openButton = await waitForElement(document, '[data-testid="select-date-button"]')
    openButton.click()
    await waitForElement(document, '[data-ui="Calendar"]')
    const nextMonth = await waitForElement(document, '[aria-label="Go to next month"]')
    nextMonth.click()
    // In next month's grid every current-month day is enabled; the 15th always exists.
    const nextMonthDate = new Date()
    nextMonthDate.setDate(15)
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
    const day = await waitForElement(
      document,
      `[data-ui="CalendarDay"] [aria-label="${nextMonthDate.toDateString()}"]`,
    )
    day.click()
  },
}

/**
 * **In context.** The schedule editor in a real publish moment: setting when the "Anna
 * Karenina" draft goes live. Same real `EditScheduleForm`, now under the document it acts
 * on, pre-filled with a future instant so the panel reads as a committed schedule, with
 * the emitted `{date}` payload echoed beneath. Open the calendar to change the day (the
 * future-only rule still applies: past days are disabled, and near-invisible in the dark
 * scheme, the documented defect); the zone the instant is read in is the one the
 * `Time Zone Dialog` picker sets.
 */
export const InContext: Story = {
  name: 'In context (schedule Anna Karenina)',
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '640px'}}},
  render: () => (
    <Stack gap={4} style={{maxWidth: 420}}>
      <Card border padding={3} radius={3}>
        <Stack gap={2}>
          <Text muted size={1}>
            Schedule for publish
          </Text>
          <Text size={2} weight="semibold">
            Anna Karenina
          </Text>
        </Stack>
      </Card>
      <ScheduleFormDemo value={{date: '2027-03-15T10:30:00.000Z'}} hint={FUTURE_ONLY_HINT} />
    </Stack>
  ),
}
