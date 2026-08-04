import {BoldIcon} from '@sanity/icons/Bold'
import {ItalicIcon} from '@sanity/icons/Italic'
import {LinkIcon} from '@sanity/icons/Link'
import {UnderlineIcon} from '@sanity/icons/Underline'
import {Button as UIButton, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// See stories/studio/Button.stories.tsx for why the ui-components barrel is
// imported from source rather than through the `sanity` exports map.
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {TooltipDelayGroupProvider} from '../../../../packages/sanity/src/ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {OverlayFrame} from './OverlayFrame'

const meta: Meta<typeof TooltipDelayGroupProvider> = {
  title: 'Overlays & Navigation/Tooltip/Delay Group',
  component: TooltipDelayGroupProvider,
  parameters: {
    docs: {
      description: {
        component: [
          'TooltipDelayGroupProvider fixes toolbar tooltip sluggishness: once one tooltip in a ' +
            'group has shown, its siblings reveal instantly, instead of every icon button waiting ' +
            'its own 400ms as a finger moves along the row.',
          '',
          '|          |                                                                                                                                                                   |',
          '| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider.tsx`, Studio shadow of `@sanity/ui` `TooltipDelayGroupProvider`            |',
          '| Tier     | SERVICE. An opinionated shadow that hard-codes the shared Studio delay (`TOOLTIP_DELAY_PROPS`, 400ms open) so every grouped tooltip coordinates on one timing     |',
          '| Audit    | ⚪ not-audited. A coordination provider with no rendered surface of its own; it tunes how the audited `Tooltip` (`datatips`) behaves across a cluster of controls |',
          '| Patterns | `datatips`                                                                                                                                                        |',
          '',
          'Wrap a cluster of controls (a formatting toolbar, for example) in the provider: the ' +
            'first tooltip in the group still waits the full open delay, but once one is showing, ' +
            'moving between siblings reveals their tooltips instantly, no repeated 400ms wait per ' +
            'button. The provider drops the `delay` prop entirely; the value is fixed.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:datatips',
    'audit:not-audited',
    'source:studio-shadow',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof TooltipDelayGroupProvider>

const TOOLS: {icon: typeof BoldIcon; label: string}[] = [
  {icon: BoldIcon, label: 'Bold'},
  {icon: ItalicIcon, label: 'Italic'},
  {icon: UnderlineIcon, label: 'Underline'},
  {icon: LinkIcon, label: 'Link'},
]

function Toolbar() {
  return (
    <Flex gap={1}>
      {TOOLS.map(({icon, label}) => (
        <Tooltip key={label} content={label} portal>
          <UIButton icon={icon} mode="bleed" aria-label={label} />
        </Tooltip>
      ))}
    </Flex>
  )
}

/**
 * Grouped: hover any button, then slide across the others. After the first
 * 400ms wait, each sibling tooltip appears instantly because they share the
 * provider's delay group.
 */
export const Grouped: Story = {
  render: () => (
    <OverlayFrame minHeight={160}>
      <Stack gap={3}>
        <Text size={1} muted>
          First hover waits 400ms; subsequent hovers in the row are instant.
        </Text>
        <TooltipDelayGroupProvider>
          <Toolbar />
        </TooltipDelayGroupProvider>
      </Stack>
    </OverlayFrame>
  ),
}

/**
 * Ungrouped contrast: the same toolbar with no provider. Every button re-incurs
 * the full 400ms open delay, so moving along the row feels laggy.
 */
export const Ungrouped: Story = {
  render: () => (
    <OverlayFrame minHeight={160}>
      <Stack gap={3}>
        <Text size={1} muted>
          No provider: each button waits the full 400ms independently.
        </Text>
        <Toolbar />
      </Stack>
    </OverlayFrame>
  ),
}
