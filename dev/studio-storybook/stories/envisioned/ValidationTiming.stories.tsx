import {type FormNodeValidation} from '@sanity/types'
import {Button as UIButton, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useEffect, useRef, useState} from 'react'

import {WithStudioProviders} from '../../lib/testProvider'
// The real field composition the anchor stories built: real StringInput inside the
// real FormField chrome, on the studio provider stack.
import {FieldDemo} from '../forms/fieldTestHarness'

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {
        name: 'slug',
        title: 'Slug',
        type: 'string',
        description: 'Lowercase, hyphen-separated. Used in the URL.',
      },
    ],
  },
]

const SLUG_ERROR: FormNodeValidation[] = [
  {level: 'error', message: 'Slugs must be lowercase.', path: ['slug']},
]

type TimingEvent = {id: number; at: number; text: string; kind: 'input' | 'error' | 'clear'}

let eventCounter = 0

function useTimeline() {
  // The clock starts on mount (set in an effect — Date.now() is impure in render).
  const start = useRef<number | null>(null)
  useEffect(() => {
    start.current ??= Date.now()
  }, [])
  const [events, setEvents] = useState<TimingEvent[]>([])
  const push = useCallback((text: string, kind: TimingEvent['kind']) => {
    const now = Date.now()
    const base = start.current ?? now
    setEvents((prev) =>
      [...prev, {id: ++eventCounter, at: (now - base) / 1000, text, kind}].slice(-6),
    )
  }, [])
  return {events, push}
}

function TimelineLog({events, title}: {events: TimingEvent[]; title: string}) {
  return (
    <Card border padding={3} radius={2} tone="transparent">
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          {title}
        </Text>
        {events.length === 0 ? (
          <Code size={0}>n/a</Code>
        ) : (
          events.map((event) => (
            <Flex key={event.id} align="center" gap={2}>
              <Code size={0}>{`t+${event.at.toFixed(1)}s`}</Code>
              <Text size={0} muted={event.kind === 'input'}>
                {event.text}
              </Text>
            </Flex>
          ))
        )}
      </Stack>
    </Card>
  )
}

const isInvalidSlug = (value: unknown) =>
  typeof value === 'string' && value.length > 0 && value !== value.toLowerCase()

const meta: Meta = {
  title: 'Envisioned/Validation Timing',
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}})],
  parameters: {
    docs: {
      description: {
        component: [
          'Validation timing is a two-sided cliff, and products fall off both edges: validate too ' +
            "early and the form scolds people for work they haven't done, validate too late and " +
            'the publish attempt becomes an audit of everything at once.',
          '',
          '| | |',
          '|---|---|',
          '| Anchor | `Forms & Input/StringInput`, the Validation timing (Current / Recommended) pair. That pair argues on-blur beats publish-only; this story completes the argument by adding the failure mode on the other side (premature red) and running all three policies simultaneously on the same rule |',
          '| Evidence | design law 5 (validate after first meaningful interaction, never before input, never only at publish); audit `inline-validation-timing` and `error-messages`; the pattern library’s ch10 Inline Validation Timing entry, whose cross-product capture shows both failure modes shipping in the field today |',
          '| Patterns | `inline-validation-timing` · `error-messages` · `schema-driven-forms` |',
          '',
          'A field that is red before the first keystroke teaches editors that red is noise, ' +
            'which is `error-messages` debt bought at form-load. The audit’s actual finding is the ' +
            'other edge, where a fixable slip typed at minute one surfaces at minute forty. The ' +
            'law threads the cliff: the first meaningful interaction ends the editor’s claim on ' +
            'the field, and that is the moment the system may speak. Blur after typing is that ' +
            'moment for text.',
          '',
          'All three fields run the same lowercase rule on the real `StringInput` + `FormField` ' +
            'composition; under each, a timeline records when input happened and when the error ' +
            'appeared, in seconds.',
          '',
          '> **Why it matters:** type UPPERCASE into each field and tab away. Premature logs an ' +
            'error at t+0.0 before any input existed; publish-only stays silent until you press ' +
            'its Publish, logging the gap between the mistake and its discovery; after-touch logs ' +
            'the error at the blur boundary, the one timestamp that coincides with the editor ' +
            'actually finishing. The timestamps are the argument.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'variant:envisioned',
    'chapter:forms',
    'chapter:cms',
    'pattern:inline-validation-timing',
    'pattern:error-messages',
    'pattern:schema-driven-forms',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * Three policies, one rule, one clock. Type `UPPERCASE` in each field, tab away, and
 * read the three logs, then correct the value and watch which surfaces clear at the
 * moment you fix it versus the one that waits to be asked again.
 */
export const ThreeWay: Story = {
  name: 'Three-way timing (premature · publish-only · after touch)',
  render: () => {
    function PrematurePanel() {
      const {events, push} = useTimeline()
      const [value, setValue] = useState<unknown>('')
      // The premature policy: the rule is live from mount — an empty, untouched field
      // already shows as failing (required-style red before any input).
      useEffect(() => {
        push('error visible, no input has happened yet', 'error')
      }, [push])
      const invalid = value === '' || isInvalidSlug(value)
      return (
        <Stack gap={3}>
          <FieldDemo
            documentType="article"
            fieldName="slug"
            kind="string"
            value={value}
            onValueChange={(next) => {
              if (value === '' && next !== '') push('first keystroke', 'input')
              setValue(next)
            }}
            validation={invalid ? SLUG_ERROR : []}
          />
          <TimelineLog events={events} title="Premature, red precedes input" />
        </Stack>
      )
    }

    function PublishOnlyPanel() {
      const {events, push} = useTimeline()
      const [value, setValue] = useState<unknown>('')
      const [validation, setValidation] = useState<FormNodeValidation[]>([])
      const typed = useRef(false)
      return (
        <Stack gap={3}>
          <FieldDemo
            documentType="article"
            fieldName="slug"
            kind="string"
            value={value}
            onValueChange={(next) => {
              if (!typed.current && next !== '') {
                typed.current = true
                push('first keystroke', 'input')
              }
              setValue(next)
              // Typing does not re-validate — the shipped behaviour.
            }}
            validation={validation}
          />
          <Flex>
            <UIButton
              text="Publish"
              tone="primary"
              onClick={() => {
                const invalid = isInvalidSlug(value)
                setValidation(invalid ? SLUG_ERROR : [])
                push(
                  invalid ? 'error surfaced, only because Publish asked' : 'publish clean',
                  invalid ? 'error' : 'clear',
                )
              }}
            />
          </Flex>
          <TimelineLog events={events} title="Publish-only, the error waits (as shipped)" />
        </Stack>
      )
    }

    function AfterTouchPanel() {
      const {events, push} = useTimeline()
      const [value, setValue] = useState<unknown>('')
      const [validation, setValidation] = useState<FormNodeValidation[]>([])
      const typed = useRef(false)
      return (
        <Stack gap={3}>
          <FieldDemo
            documentType="article"
            fieldName="slug"
            kind="string"
            value={value}
            onValueChange={(next) => {
              if (!typed.current && next !== '') {
                typed.current = true
                push('first keystroke', 'input')
              }
              setValue(next)
              if (validation.length > 0 && !isInvalidSlug(next)) {
                setValidation([])
                push('error cleared as you corrected it', 'clear')
              }
            }}
            onInputBlur={() => {
              if (!typed.current) return // untouched fields are never scolded
              const invalid = isInvalidSlug(value)
              if (invalid && validation.length === 0) {
                setValidation(SLUG_ERROR)
                push('error shown at blur, the touch boundary', 'error')
              }
            }}
            validation={validation}
          />
          <TimelineLog events={events} title="After touch, law 5 (envisioned default)" />
        </Stack>
      )
    }

    return (
      <Flex gap={4} align="flex-start" wrap="wrap">
        <Card padding={3} radius={2} border style={{width: 340}} tone="critical">
          <Stack gap={3}>
            <Text size={1} weight="medium">
              Premature
            </Text>
            <PrematurePanel />
          </Stack>
        </Card>
        <Card padding={3} radius={2} border style={{width: 340}} tone="critical">
          <Stack gap={3}>
            <Text size={1} weight="medium">
              Publish-only
            </Text>
            <PublishOnlyPanel />
          </Stack>
        </Card>
        <Card padding={3} radius={2} border style={{width: 340}} tone="positive">
          <Stack gap={3}>
            <Text size={1} weight="medium">
              After first meaningful interaction
            </Text>
            <AfterTouchPanel />
          </Stack>
        </Card>
      </Flex>
    )
  },
}
