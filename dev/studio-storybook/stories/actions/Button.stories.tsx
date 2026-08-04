import {AddIcon} from '@sanity/icons/Add'
import {EllipsisVerticalIcon} from '@sanity/icons/EllipsisVertical'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {
  Button as UIButton,
  type ButtonMode,
  type ButtonTone,
  Card,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useCallback, useRef, useState} from 'react'

import {TextWithTone} from '../../../../packages/sanity/src/core/components/textWithTone/TextWithTone'
// The Studio shadow (packages/sanity/src/ui-components/button). It is the component
// this page documents; the `Primitive` story renders the raw @sanity/ui Button for
// contrast. `sanity` has no exports entry reaching ui-components, so the source
// barrel is the only way in, the same path internal call sites use. The barrel's
// transitive `sanity/_singletons` import resolves through the `monorepo` condition
// set in .storybook/main.ts.
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'

const MODES: ButtonMode[] = ['default', 'ghost', 'bleed']
const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

const meta: Meta<typeof Button> = {
  title: 'Actions & Commands/Button',
  component: Button,
  args: {text: 'Label', tooltipProps: null},
  argTypes: {
    disabled: {control: 'boolean'},
    loading: {control: 'boolean'},
    text: {control: 'text'},
    mode: {control: 'radio', options: MODES},
    tone: {control: 'radio', options: TONES},
    size: {control: 'radio', options: ['default', 'large']},
  },
  parameters: {
    docs: {
      description: {
        // Docs-voice exemplar (2026-07-30): metadata rides in the mono table, the prose
        // opens with the argument, and the em-dash is retired from the essay register.
        component: [
          'Button is Studio’s shared button component. Every action control in the product ' +
            'wraps it, inheriting its padding, tone mapping, and sizing.',
          '',
          '|          |                                                                                                                            |',
          '| -------- | -------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/ui-components/button/Button.tsx`, the Studio shadow of `@sanity/ui` Button                            |',
          '| Tier     | CHROME. The most commodity control there is; the shadow only pins layout, maps tone, and requires a tooltip when icon-only |',
          '| Audit    | 🔴 needs-work (`idempotency`). Submit controls that can double-fire; see the two Idempotency stories                       |',
          '| Patterns | `button-groups` · `prominent-done` · `fitts-law`                                                                           |',
          '',
          'The component enforces this at the type level. Size and padding come from a fixed ' +
            'scale rather than arbitrary values, and an icon-only button requires `tooltipProps`, ' +
            'so it cannot compile without an accessible label.',
          '',
          'This page covers both layers. The `Primitive` story is the raw `@sanity/ui` button; ' +
            'every other story is the Studio wrapper. Comparing them shows what the wrapper ' +
            'removes from the primitive: layout and tone choices, and a nameless icon-only ' +
            'button.',
          '',
          '> **Why it matters:** submit controls must not double-fire on a fast repeat click. ' +
            'The audit found buttons that stay enabled during an async write, so a second click ' +
            'posts a duplicate mutation. The fix disables the button and sets it to `loading` the ' +
            'instant it fires; the two Idempotency stories show the defect and the fix side by ' +
            'side.',
          '',
          'The last story shows the component in its real context: the document header of the ' +
            'Anna Karenina draft. Publish, Review changes, and the overflow menu there are all ' +
            'instances of this one shared control.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'pattern:button-groups',
    'pattern:idempotency',
    'pattern:fitts-law',
    'audit:needs-work',
    'source:studio-shadow',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof Button>

/** The unwrapped Sanity UI primitive, for contrast with the Studio shadow below. */
export const Primitive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The raw `@sanity/ui` `Button`. The Studio shadow wraps this, adding fixed ' +
          'size/padding tokens and the icon-only tooltip contract.',
      },
    },
  },
  render: () => <UIButton text="Sanity UI Button" mode="default" tone="primary" padding={2} />,
}

/** The Studio `Button` from ui-components, in its default single-button state. */
export const Studio: Story = {
  render: (props) => <Button {...props} />,
}

export const Modes: Story = {
  parameters: {controls: {include: ['tone', 'disabled']}},
  render: (props) => (
    <Stack gap={3}>
      {MODES.map((mode) => (
        <Flex key={mode} align="center" gap={2}>
          {TONES.map((tone) => (
            <Button {...props} key={tone} mode={mode} tone={tone} text={`${mode}/${tone}`} />
          ))}
        </Flex>
      ))}
    </Stack>
  ),
}

export const Tones: Story = {
  parameters: {controls: {include: ['mode', 'disabled']}},
  render: (props) => (
    <Flex align="center" gap={2}>
      {TONES.map((tone) => (
        <Button {...props} key={tone} icon={AddIcon} text={tone} tone={tone} />
      ))}
    </Flex>
  ),
}

export const Sizes: Story = {
  parameters: {controls: {include: ['mode', 'tone']}},
  render: (props) => (
    <Flex align="center" gap={3}>
      <Button {...props} size="default" icon={PublishIcon} text="Default" tone="primary" />
      <Button {...props} size="large" icon={PublishIcon} text="Large" tone="primary" />
    </Flex>
  ),
}

/** Icon-only buttons require `tooltipProps` by contract: the type enforces an accessible name. */
export const IconOnlyWithTooltip: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only buttons drop `text`, so `tooltipProps` is required by the type. This is ' +
          "the shadow's answer to the audit's `accessible-labeling` finding (icon controls with " +
          'no accessible name).',
      },
    },
  },
  render: () => (
    // The Studio `Button` renders `tooltipProps` as a hover-only Tooltip; it does
    // NOT derive an accessible name from it. An icon-only button therefore needs an
    // explicit `aria-label` (matching the tooltip text) so screen readers announce
    // it at rest, which is the correct pattern this story exists to teach.
    <Flex align="center" gap={2}>
      <Button
        icon={AddIcon}
        aria-label="Add item"
        tooltipProps={{content: 'Add item'}}
        mode="ghost"
      />
      <Button
        icon={EllipsisVerticalIcon}
        aria-label="More actions"
        tooltipProps={{content: 'More actions'}}
        mode="ghost"
      />
      <Button
        icon={TrashIcon}
        aria-label="Delete"
        tooltipProps={{content: 'Delete'}}
        mode="ghost"
        tone="critical"
      />
    </Flex>
  ),
}

export const LoadingAndDisabled: Story = {
  render: (props) => (
    <Flex align="center" gap={3}>
      <Button {...props} text="Loading" tone="primary" loading />
      <Button {...props} text="Disabled" tone="primary" disabled />
    </Flex>
  ),
}

// --- Two-variant illustration: `idempotency` (audit finding) --------------------

function Submitter({guarded}: {guarded: boolean}) {
  const [submits, setSubmits] = useState(0)
  const [pending, setPending] = useState(false)
  // A ref, not state: the re-entry guard must read/write synchronously within one
  // click so a burst of clicks fired before React re-renders (and applies
  // `disabled`) still sees the in-flight flag. State alone is a stale closure and
  // lets the rapid second/third click through.
  const inFlight = useRef(false)

  const onSubmit = useCallback(() => {
    // Guarded path refuses to fire while a submit is already in flight.
    if (guarded && inFlight.current) return
    if (guarded) inFlight.current = true
    setPending(true)
    // Simulate an async write; the unguarded button stays live throughout, so a
    // second click before this resolves posts a duplicate.
    window.setTimeout(() => {
      setSubmits((n) => n + 1)
      setPending(false)
      inFlight.current = false
    }, 900)
  }, [guarded])

  return (
    <Stack gap={3}>
      <Button
        text={guarded && pending ? 'Publishing…' : 'Publish'}
        icon={guarded && pending ? undefined : PublishIcon}
        tone="primary"
        onClick={onSubmit}
        loading={guarded ? pending : false}
        disabled={guarded ? pending : false}
      />
      <Card padding={3} radius={2} tone={submits > 1 ? 'critical' : 'transparent'} border>
        <Flex align="center" gap={2}>
          <Text size={1} muted>
            Documents published:
          </Text>
          <Text size={1} weight="semibold">
            {submits}
          </Text>
          {submits > 1 && (
            <TextWithTone size={1} tone="critical">
              · duplicate publish
            </TextWithTone>
          )}
        </Flex>
      </Card>
    </Stack>
  )
}

/** Current: the button stays live during the async submit, so rapid clicks double-fire. */
export const IdempotencyCurrent: Story = {
  parameters: {
    controls: {disable: true},
    docs: {
      description: {
        story:
          'Reproduces the audit finding: click **Publish** twice quickly. Nothing disables the ' +
          'control while the write is in flight, so the second click posts a duplicate (counter ' +
          'goes past 1). This is the same class of defect as the comment send button that fires ' +
          'on every activation.',
      },
    },
  },
  render: () => <Submitter guarded={false} />,
}

/** Recommended, disable-after-fire: the button enters a pending state and cannot re-fire. */
export const IdempotencyRecommended: Story = {
  parameters: {
    controls: {disable: true},
    docs: {
      description: {
        story:
          'The fix: on click the button flips to a `loading` + `disabled` pending state until the ' +
          'write resolves, so a second click is impossible and the count never exceeds 1. The ' +
          'action is idempotent from the UI down.',
      },
    },
  },
  render: () => <Submitter guarded />,
}

/**
 * In context: the document-header action row for the "Anna Karenina" draft. The primary
 * **Publish** anchors the group; **Review changes** sits beside it as a bleed action, and
 * the icon-only "…" overflow (named for screen readers) trails the row. This is where
 * almost every Studio action lands: one shared `Button`, several tones and modes reading
 * as a single, coherent toolbar.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={3} shadow={1} style={{maxWidth: 460}}>
      <Flex align="center" gap={3}>
        <Stack gap={2} flex={1}>
          <Text size={2} weight="semibold" textOverflow="ellipsis">
            Anna Karenina
          </Text>
          <Text size={1} muted>
            Draft · unpublished changes
          </Text>
        </Stack>
        <Flex align="center" gap={2}>
          <Button mode="bleed" text="Review changes" />
          <Button icon={PublishIcon} text="Publish" tone="primary" />
          <Button
            icon={EllipsisVerticalIcon}
            aria-label="More actions"
            tooltipProps={{content: 'More actions'}}
            mode="bleed"
          />
        </Flex>
      </Flex>
    </Card>
  ),
}
