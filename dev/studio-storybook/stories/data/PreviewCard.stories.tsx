import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {PreviewCard} from '../../../../packages/sanity/src/core/components/previewCard/PreviewCard'
// Real components from real source paths (org contract §8): the selectable card that
// wraps every list row and reference preview, plus the default preview it typically
// contains — so the states below read like real list rows, not empty boxes.
import {DefaultPreview} from '../../../../packages/sanity/src/core/components/previews/general/DefaultPreview'
import {fixtureDocuments} from '../../lib/mockDocumentPreviewStore'

const authorRows = fixtureDocuments
  .filter((doc) => doc._type === 'author' && !doc._id.startsWith('drafts.'))
  .map((doc) => ({id: doc._id, title: doc.name as string, subtitle: doc.era as string}))

function SampleRow(props: {title: string; subtitle: string}) {
  return <DefaultPreview title={props.title} subtitle={props.subtitle} />
}

const meta: Meta<typeof PreviewCard> = {
  title: 'Lists & Data/PreviewCard',
  component: PreviewCard,
  args: {radius: 2, padding: 1},
  argTypes: {
    selected: {control: 'boolean'},
    pressed: {control: 'boolean'},
    disabled: {control: 'boolean'},
    tone: {
      control: 'select',
      options: ['default', 'transparent', 'primary', 'positive', 'caution', 'critical'],
    },
    radius: {control: {type: 'range', min: 0, max: 4, step: 1}},
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'PreviewCard is the selectable container behind every list row and reference result. ' +
            "It gives Studio's lists their consistent hit-area, radius, and selection look, and " +
            'quietly tells the preview inside it whether it is the active row.',
          '',
          '|          |                                                                                                                                                                                                                          |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source   | `packages/sanity/src/core/components/previewCard/PreviewCard.tsx`, Studio-only (no DS equivalent)                                                                                                                        |',
          '| Tier     | SERVICE. The selectable row container behind every list item and reference preview; carries the `selected` / `pressed` interaction state and the context (`usePreviewCard`) a preview reads to know it is the active row |',
          "| Audit    | 🟢 holds (`cards`). The audit scored Studio's card-based list rows as a pattern that holds: consistent hit-area, radius, and selection affordance across lists, reference inputs, and menus                              |",
          '| Patterns | `cards`                                                                                                                                                                                                                  |',
          '',
          'A thin `styled(@sanity/ui Card)` that forwards all `CardProps` (`tone`, `radius`, ' +
            '`padding`, `selected`, `pressed`, `as`, …) and adds two things a plain `Card` lacks: ' +
            'it publishes a `PreviewCardContext` so a child preview can call `usePreviewCard()` ' +
            'to read its own selected state, and it overrides `[data-ui="TextWithTone"]` colour ' +
            'to `inherit` in the `selected` / `pressed` / `:active` states, without which a toned ' +
            'status label would keep its own colour and clash with the selected-row background.',
          '',
          'Harness notes: prop-driven, no store or provider stack (only the global theme + i18n ' +
            'decorators). Rows contain a real `DefaultPreview` filled from the shared fixture ' +
            'authors (`lib/mockDocumentPreviewStore.ts`) so selection reads against real content. ' +
            'The `as="button"` story is the one to keyboard-focus (Tab) to see the focus ring the ' +
            'card renders.',
          '',
          '> **Why it matters:** selecting a row re-colours the content inside, not just its ' +
            'background. The colour override is what keeps selection legible: without it, a ' +
            'coloured status label would hold its own hue against the selected-row background and ' +
            'clash.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:lists',
    'pattern:cards',
    'audit:holds',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof PreviewCard>

/** Playground: toggle selected / pressed / disabled and tone from the controls. */
export const Playground: Story = {
  render: (args) => (
    <Box padding={4} style={{maxWidth: 320}}>
      <PreviewCard {...args}>
        <SampleRow title="Leo Tolstoy" subtitle="Realism" />
      </PreviewCard>
    </Box>
  ),
}

/** The four interaction states side by side, each wrapping the same list row. */
export const States: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const states: {label: string; props: Record<string, unknown>}[] = [
      {label: 'Default', props: {}},
      {label: 'Selected', props: {selected: true, tone: 'primary'}},
      {label: 'Pressed', props: {pressed: true}},
      {label: 'Disabled', props: {disabled: true}},
    ]
    return (
      <Box padding={4}>
        <Stack gap={4} style={{maxWidth: 320}}>
          {states.map(({label, props}) => (
            <Stack key={label} gap={2}>
              <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
                {label}
              </Text>
              <PreviewCard radius={2} padding={1} {...props}>
                <SampleRow title="Leo Tolstoy" subtitle="Realism" />
              </PreviewCard>
            </Stack>
          ))}
        </Stack>
      </Box>
    )
  },
}

/**
 * Rendered `as="button"` and focusable: Tab into it to see the card’s focus ring, and
 * click to toggle the selected state: the interaction contract a list row implements.
 */
export const Focusable: Story = {
  name: 'Focusable (as button)',
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const [selected, setSelected] = useState(false)
      return (
        <Box padding={4} style={{maxWidth: 320}}>
          <Stack gap={3}>
            <Text size={1} muted>
              Tab to focus, Enter/Space or click to toggle selection.
            </Text>
            <PreviewCard
              as="button"
              type="button"
              radius={2}
              padding={1}
              selected={selected}
              tone={selected ? 'primary' : 'default'}
              onClick={() => setSelected((value) => !value)}
              style={{width: '100%', textAlign: 'left', cursor: 'pointer'}}
            >
              <SampleRow title="Leo Tolstoy" subtitle="Realism" />
            </PreviewCard>
          </Stack>
        </Box>
      )
    }
    return <Demo />
  },
}

/**
 * The real use: a list where exactly one row is selected. Click a row to move the
 * selection: every other row falls back to the default tone, mirroring a structure
 * list pane or the reference-input result list.
 */
export const SelectedInList: Story = {
  name: 'Selected in a list',
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const [selectedId, setSelectedId] = useState(authorRows[1]?.id)
      return (
        <Box padding={4} style={{maxWidth: 320}}>
          <Card border radius={2} overflow="hidden">
            <Stack gap={0}>
              {authorRows.map((row) => (
                <PreviewCard
                  key={row.id}
                  as="button"
                  type="button"
                  padding={1}
                  radius={0}
                  selected={row.id === selectedId}
                  tone={row.id === selectedId ? 'primary' : 'default'}
                  onClick={() => setSelectedId(row.id)}
                  style={{width: '100%', textAlign: 'left', cursor: 'pointer'}}
                >
                  <Flex align="center">
                    <Box flex={1}>
                      <SampleRow title={row.title} subtitle={row.subtitle} />
                    </Box>
                  </Flex>
                </PreviewCard>
              ))}
            </Stack>
          </Card>
        </Box>
      )
    }
    return <Demo />
  },
}
