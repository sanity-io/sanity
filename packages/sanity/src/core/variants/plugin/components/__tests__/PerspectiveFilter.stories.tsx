import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CircleIcon} from '@sanity/icons/Circle'
import {Card, Stack, Text, type CardTone} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Flex} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {PerspectiveFilter} from '../PerspectiveFilter'

/**
 * The perspective bar's filter pill. Figma specifies three states — enabled,
 * selected (a filter is set, so the pill gains a remove segment) and disabled —
 * across the tones a release can carry. Hover and pressed are not specified in
 * Figma: they come from the standard Sanity UI button states, layered inside the
 * pill. The pill's outline is an overlay so it survives those states.
 *
 * Tones map to release types via `getReleaseTone`: positive = published,
 * caution = asap, suggest = scheduled and variants, neutral = undecided.
 */
const meta = {
  title: 'Releases/Perspective Filter',
  component: PerspectiveFilter,
} satisfies Meta<typeof PerspectiveFilter>

export default meta
type Story = StoryObj<typeof meta>

const CASES: {tone: CardTone; label: string; caption: string}[] = [
  {tone: 'default', label: 'Draft', caption: 'default — draft'},
  {tone: 'positive', label: 'Published', caption: 'positive — published'},
  {tone: 'caution', label: 'ASAP', caption: 'caution — asap'},
  {tone: 'suggest', label: 'Scheduled', caption: 'suggest — scheduled'},
  {tone: 'neutral', label: 'Undecided', caption: 'neutral — undecided'},
]

function TriggerButton({text, disabled}: {text: string; disabled?: boolean}) {
  return (
    <Button
      disabled={disabled}
      icon={CircleIcon}
      iconRight={ChevronDownIcon}
      mode="bleed"
      text={text}
    />
  )
}

/** Enabled: no filter set, so no remove segment. */
export const Enabled: Story = {
  args: {prefix: 'Version', tone: 'default', children: null},
  render: () => (
    <Card padding={4}>
      <Stack gap={4}>
        {CASES.map(({tone, label, caption}) => (
          <Flex key={tone} alignItems="center" gap={4}>
            <PerspectiveFilter prefix="Version" tone={tone}>
              <TriggerButton text={label} />
            </PerspectiveFilter>
            <Text muted size={0}>
              {caption}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Card>
  ),
}

/** Selected: a filter is set, so the pill is split by a hairline and gains the remove segment. */
export const Selected: Story = {
  args: {prefix: 'Version', tone: 'default', children: null},
  render: () => (
    <Card padding={4}>
      <Stack gap={4}>
        {CASES.map(({tone, label, caption}) => (
          <Flex key={tone} alignItems="center" gap={4}>
            <PerspectiveFilter
              prefix="Version"
              tone={tone}
              onRemove={() => {}}
              removeLabel="Clear version selection"
            >
              <TriggerButton text={label} />
            </PerspectiveFilter>
            <Text muted size={0}>
              {caption}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Card>
  ),
}

/** Disabled: the pill keeps its outline while the control inside is inert. */
export const Disabled: Story = {
  args: {prefix: 'Variant', tone: 'default', children: null},
  render: () => (
    <Card padding={4}>
      <Flex alignItems="center" gap={4}>
        <PerspectiveFilter prefix="Variant" tone="default">
          <TriggerButton text="All users (Default)" disabled />
        </PerspectiveFilter>
        <Text muted size={0}>
          disabled
        </Text>
      </Flex>
    </Card>
  ),
}
