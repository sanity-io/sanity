import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {GteIcon} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/icons/GteIcon'
import {GtIcon} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/icons/GtIcon'
import {LteIcon} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/icons/LteIcon'
import {LtIcon} from '../../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/icons/LtIcon'

/**
 * A JUDGEMENT CALL: four bare SVG glyphs, one operator symbol each, with no props, no state and
 * no branch to enumerate - `GtIcon` is `() => <svg>...</svg>` and nothing else. Four separate
 * component pages would each be a docblock repeating "this is a static SVG" with a single symbol
 * changed; one page showing all four side by side, labelled with the operator each denotes, is
 * the whole story. Not the same judgement as Debug Panels: these are trivial rather than
 * unreachable, and the right response to trivial is one page, not zero.
 */
const meta: Meta = {
  title: 'Search/Filter Operator Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Number and date filter operators need comparison glyphs the standard icon set does ' +
            'not carry: greater-than-or-equal and less-than-or-equal have no equivalents there, ' +
            'so these four fill the gap.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/icons/` (`GtIcon.tsx`, `GteIcon.tsx`, `LtIcon.tsx`, `LteIcon.tsx`) |',
          '| Tier | SERVICE |',
          '| Audit | ⚪ not-audited |',
          '| Patterns | `filters` |',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:search', 'pattern:filters', 'audit:not-audited', 'source:studio', 'tier:service'],
}

export default meta
type Story = StoryObj

function IconCell({icon, symbol, label}: {icon: React.ReactNode; symbol: string; label: string}) {
  return (
    <Card border padding={4} radius={2}>
      <Stack gap={3}>
        <Text align="center" size={4}>
          {icon}
        </Text>
        <Text align="center" size={1} weight="medium">
          {symbol}
        </Text>
        <Text align="center" muted size={0}>
          {label}
        </Text>
      </Stack>
    </Card>
  )
}

export const AllFour: Story = {
  name: 'The four comparison operators',
  render: () => (
    <Flex gap={3} wrap="wrap">
      <IconCell icon={<GtIcon />} symbol=">" label="greater than" />
      <IconCell icon={<GteIcon />} symbol="≥" label="greater than or equal" />
      <IconCell icon={<LtIcon />} symbol="<" label="less than" />
      <IconCell icon={<LteIcon />} symbol="≤" label="less than or equal" />
    </Flex>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "All four operator icons at once, in the size they actually render at (`1em`, so they inherit whatever text size surrounds them - shown here at `size={4}` purely so the glyph is legible on this page). Used by the number and date-range operators (`numberGt`, `numberGte`, `dateAfter`'s sibling operators, and so on) as `iconRight` on their `OperatorsMenuButton` menu item.",
      },
    },
  },
}
