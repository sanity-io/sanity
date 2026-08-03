import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseAvatar} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {ReleaseTitle} from '../../../../packages/sanity/src/core/releases/components/ReleaseTitle'
import {releaseFixtures} from '../../lib/releaseFixtures'

/** The component truncates at 50 characters; these sit either side of that line. */
const SHORT_TITLE = 'Autumn campaign'
const LONG_TITLE =
  'Autumn campaign - homepage, category pages, the newsletter, and every regional variant'

const meta: Meta<typeof ReleaseTitle> = {
  title: 'Releases/Release Title',
  component: ReleaseTitle,
  args: {title: SHORT_TITLE, fallback: 'Untitled release'},
  parameters: {
    docs: {
      description: {
        component: [
          'Truncation here is done in JavaScript at a character count, not in CSS with an ' +
            'ellipsis, and that is a deliberate trade, so know which way it cuts before you reach ' +
            'for it elsewhere.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/ReleaseTitle.tsx` |',
          '| Tier | CHROME |',
          '',
          'This is the one place a release title is rendered, so that truncation and the ' +
            'fallback for an untitled release behave identically everywhere. It does three small ' +
            'things and nothing else: substitute a fallback when the title is absent, truncate ' +
            'past 50 characters, and attach a tooltip carrying the full title when, and only ' +
            'when, it truncated.',
          '',
          'The win of counting characters in JavaScript is that the component can tell whether ' +
            'it truncated, and so can attach a tooltip only when there is something hidden to ' +
            'reveal, a CSS ellipsis cannot do that, so interfaces built that way either tooltip ' +
            'everything or tooltip nothing. The cost is that the cut is blind to the actual ' +
            'rendered width: at 50 characters it fires the same in a wide dashboard header as in ' +
            'a narrow menu, so a title can truncate with room to spare, or overflow its container ' +
            'without truncating at all if the container is narrow enough.',
          '',
          'The `children` render prop exists for call sites that need their own markup around ' +
            'the text but still want the shared truncation and tooltip decision, the version ' +
            'chips use it to fit the title into a chip.',
          '',
          '> **Why it matters:** a character-count truncation can tell you whether it cut ' +
            'anything, and a CSS ellipsis cannot. That is what makes a tooltip that appears only ' +
            'when something is actually hidden possible at all, at the cost of a cut that ignores ' +
            'the real rendered width of the container it sits in.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:releases', 'chapter:cms', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof ReleaseTitle>

export const Default: Story = {
  name: 'A short title',
  parameters: {
    docs: {
      description: {
        story:
          'Under the limit, so it renders as plain text with no tooltip attached. Edit the title in the controls and watch the tooltip appear once you pass 50 characters.',
      },
    },
  },
}

export const Truncated: Story = {
  name: 'Truncated, with the full title on hover',
  args: {title: LONG_TITLE},
  parameters: {
    docs: {
      description: {
        story:
          'Past the limit. The visible text is cut and a tooltip carries the whole thing - hover it. The tooltip is the recovery path for information the layout removed, which is the correct use of one: nothing here is unavailable, only folded away.',
      },
    },
  },
}

export const TooltipDisabled: Story = {
  name: 'Truncated with the tooltip off',
  args: {title: LONG_TITLE, enableTooltip: false},
  parameters: {
    docs: {
      description: {
        story:
          'The same truncation with `enableTooltip: false`, and the full title now has nowhere to go. Call sites use this when the surrounding surface already shows the title in full, or when the component sits inside something that owns hover itself - a menu item, where a nested tooltip would fight the parent.',
      },
    },
  },
}

export const Fallback: Story = {
  name: 'An untitled release',
  args: {title: undefined},
  parameters: {
    docs: {
      description: {
        story:
          "A release can genuinely have no title: the create dialog does not require one. Rather than render an empty row, the component substitutes the caller's fallback. Note the fallback goes through the same truncation, so a long fallback truncates too.",
      },
    },
  },
}

export const CustomTextProps: Story = {
  name: 'Sized by the call site',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The default render is a plain `<Text>`, and `textProps` passes straight through to it. This is how one component serves a dashboard heading and a menu row without either one reimplementing the truncation rule.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      {[
        {size: 3, weight: 'semibold' as const, label: 'dashboard heading'},
        {size: 1, weight: 'medium' as const, label: 'table row'},
        {size: 0, weight: 'regular' as const, label: 'menu item'},
      ].map(({size, weight, label}) => (
        <Stack key={label} gap={2}>
          <ReleaseTitle
            title={SHORT_TITLE}
            fallback="Untitled release"
            textProps={{size, weight}}
          />
          <Text size={0} muted>
            {label}
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
}

export const RenderProp: Story = {
  name: 'The children render prop',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The escape hatch: `children` receives `{displayTitle, fullTitle, isTruncated}` and returns whatever the call site needs. The component still decides whether to wrap the result in a tooltip, so a caller gets custom markup without having to re-derive the truncation. Here the render prop appends a badge that only appears when something was cut.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      {[SHORT_TITLE, LONG_TITLE].map((title) => (
        <ReleaseTitle key={title} title={title} fallback="Untitled release">
          {({displayTitle, isTruncated}) => (
            <Flex align="center" gap={2}>
              <Text size={1}>{displayTitle}</Text>
              {isTruncated && (
                <Card padding={1} radius={2} tone="caution">
                  <Text size={0}>truncated</Text>
                </Card>
              )}
            </Flex>
          )}
        </ReleaseTitle>
      ))}
    </Stack>
  ),
}

export const InContext: Story = {
  name: 'In context - a releases list',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Four releases in a narrow list, one of them over the limit. The truncation is what keeps the rows the same height and the layout stable, which is the actual job: a list where one row grows to three lines because someone wrote a descriptive title is a list that is hard to scan.',
      },
    },
  },
  render: () => (
    <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 340}}>
      <Stack gap={1}>
        {[
          {release: releaseFixtures.asap, title: 'Hotfix - pricing page'},
          {release: releaseFixtures.scheduled, title: LONG_TITLE},
          {release: releaseFixtures.undecided, title: undefined},
          {release: releaseFixtures.scheduledDraft, title: SHORT_TITLE},
        ].map(({release, title}, index) => (
          <Card key={index} radius={2} padding={1} tone="transparent">
            <Flex align="center" gap={1}>
              <ReleaseAvatar release={release} />
              <Box flex={1}>
                <ReleaseTitle
                  title={title}
                  fallback="Untitled release"
                  textProps={{size: 1, textOverflow: 'ellipsis'}}
                />
              </Box>
            </Flex>
          </Card>
        ))}
      </Stack>
    </Card>
  ),
}
