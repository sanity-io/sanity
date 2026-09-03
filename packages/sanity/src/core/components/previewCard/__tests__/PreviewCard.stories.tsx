import {DocumentIcon} from '@sanity/icons/Document'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TextWithTone} from '../../textWithTone/TextWithTone'
import {PreviewCard} from '../PreviewCard'

const STATES = [
  {label: 'default', props: {}},
  {label: 'selected', props: {selected: true, tone: 'primary'}},
  {label: 'pressed', props: {pressed: true}},
  {label: 'disabled', props: {disabled: true}},
] as const

const AUTHORS = ['Leo Tolstoy', 'Jane Austen', 'Fyodor Dostoevsky', 'Virginia Woolf']

function Row(props: {title: string; status?: string}) {
  return (
    <Flex align="center" gap={3} padding={2}>
      <Text muted size={1}>
        <DocumentIcon />
      </Text>
      <Box flex={1}>
        <Text size={1} textOverflow="ellipsis">
          {props.title}
        </Text>
      </Box>
      {props.status && (
        <TextWithTone size={0} tone="caution">
          {props.status}
        </TextWithTone>
      )}
    </Flex>
  )
}

/**
 * The selectable container behind every list row and reference preview. A
 * `styled(Card)` that forwards all `CardProps` and adds two things: it
 * publishes a `PreviewCardContext` so the preview inside can read
 * `usePreviewCard().selected`, and in the `selected`, `pressed` and `:active`
 * states it forces any nested `TextWithTone` to `color: inherit`, so a toned
 * status label does not clash with the selected-row background. The rows
 * below carry a caution-toned status to show that override in effect.
 */
const meta = {
  title: 'Core Components/Preview Card',
  component: PreviewCard,
  args: {padding: 1, radius: 2},
} satisfies Meta<typeof PreviewCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The four interaction states side by side, then a list with exactly one row
 * selected, the shape of a structure list pane or reference-input result list.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5} padding={4}>
      <Stack gap={3} style={{maxWidth: 320}}>
        {STATES.map(({label, props}) => (
          <Stack gap={2} key={label}>
            <Text muted size={0} weight="medium">
              {label}
            </Text>
            <PreviewCard padding={1} radius={2} {...props}>
              <Row status="Unpublished" title="Anna Karenina" />
            </PreviewCard>
          </Stack>
        ))}
      </Stack>
      <Card border overflow="hidden" radius={2} style={{maxWidth: 320}}>
        <Stack gap={0}>
          {AUTHORS.map((author, index) => (
            <PreviewCard
              as="button"
              key={author}
              padding={1}
              radius={0}
              selected={index === 1}
              style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
              tone={index === 1 ? 'primary' : 'default'}
              type="button"
            >
              <Row status={index === 2 ? 'Draft' : undefined} title={author} />
            </PreviewCard>
          ))}
        </Stack>
      </Card>
    </Stack>
  ),
}
