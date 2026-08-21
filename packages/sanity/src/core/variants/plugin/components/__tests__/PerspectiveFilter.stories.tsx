import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card, Flex, Stack, Text, type CardTone} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {RhombusIcon} from '../../../../components/temporary-icons/Rhombus'
import {ReleaseAvatarIcon} from '../../../../releases/components/ReleaseAvatar'
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
 *
 * The triggers render the real `ReleaseAvatarIcon` at `size="small"`, which is the
 * status-dot mark rather than the full-size icon — 11.4 of 25 units across instead
 * of 16. Every perspective surface uses that size, so a placeholder here would
 * hide a mismatch rather than show it.
 */
const meta = {
  title: 'Releases/Perspective Filter',
  component: PerspectiveFilter,
} satisfies Meta<typeof PerspectiveFilter>

export default meta
type Story = StoryObj<typeof meta>

const CASES: {tone: CardTone; label: string; caption: string; icon: ReactNode}[] = [
  {
    tone: 'default',
    label: 'Draft',
    caption: 'default — draft',
    icon: <ReleaseAvatarIcon size="small" release="drafts" />,
  },
  {
    tone: 'positive',
    label: 'Published',
    caption: 'positive — published',
    icon: <ReleaseAvatarIcon size="small" release="published" />,
  },
  {
    tone: 'caution',
    label: 'ASAP',
    caption: 'caution — asap',
    icon: <ReleaseAvatarIcon size="small" releaseType="asap" />,
  },
  {
    tone: 'suggest',
    label: 'Scheduled',
    caption: 'suggest — scheduled',
    icon: <ReleaseAvatarIcon size="small" releaseType="scheduled" />,
  },
  {
    tone: 'neutral',
    label: 'Undecided',
    caption: 'neutral — undecided',
    icon: <ReleaseAvatarIcon size="small" releaseType="undecided" />,
  },
]

function TriggerButton({
  text,
  icon,
  disabled,
}: {
  text: string
  icon: ReactNode
  disabled?: boolean
}) {
  return (
    <Button disabled={disabled} icon={icon} iconRight={ChevronDownIcon} mode="bleed" text={text} />
  )
}

/** Enabled: no filter set, so no remove segment. */
export const Enabled: Story = {
  args: {prefix: 'Version', tone: 'default', children: null},
  render: () => (
    <Card padding={4}>
      <Stack gap={4}>
        {CASES.map(({tone, label, caption, icon}) => (
          <Flex key={tone} align="center" gap={4}>
            <PerspectiveFilter prefix="Version" tone={tone}>
              <TriggerButton text={label} icon={icon} />
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
        {CASES.map(({tone, label, caption, icon}) => (
          <Flex key={tone} align="center" gap={4}>
            <PerspectiveFilter
              prefix="Version"
              tone={tone}
              onRemove={() => {}}
              removeLabel="Clear version selection"
            >
              <TriggerButton text={label} icon={icon} />
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
      <Flex align="center" gap={4}>
        <PerspectiveFilter prefix="Variant" tone="default">
          {/* The variant pill's rhombus is already drawn at dot scale, so it has
              no `size="small"` counterpart. */}
          <TriggerButton text="All users (Default)" icon={<RhombusIcon />} disabled />
        </PerspectiveFilter>
        <Text muted size={0}>
          disabled
        </Text>
      </Flex>
    </Card>
  ),
}
