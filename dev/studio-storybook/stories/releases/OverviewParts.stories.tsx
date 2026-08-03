import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {CardinalityViewPicker} from '../../../../packages/sanity/src/core/releases/tool/overview/CardinalityViewPicker'
import {ConfirmActiveScheduledDraftsBanner} from '../../../../packages/sanity/src/core/releases/tool/overview/ConfirmActiveScheduledDraftsBanner'
import {DraftsDisabledBanner} from '../../../../packages/sanity/src/core/releases/tool/overview/DraftsDisabledBanner'
import {ReleaseNotFoundBanner} from '../../../../packages/sanity/src/core/releases/tool/overview/ReleaseNotFoundBanner'
import {ReleasesEmptyState} from '../../../../packages/sanity/src/core/releases/tool/overview/ReleasesEmptyState'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {allReleaseFixtures, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

/** Releases including a scheduled draft, which is what most of these components key off. */
const WITH_SCHEDULED_DRAFT = [...allReleaseFixtures]
/** Releases with no cardinality-one release in them at all. */
const NO_SCHEDULED_DRAFTS = allReleaseFixtures.filter(
  (release) => release.metadata.cardinality !== 'one',
)

function Stage({children, label}: {children: React.ReactNode; label?: string}) {
  return (
    <Stack gap={3}>
      {label && (
        <Text size={0} muted>
          {label}
        </Text>
      )}
      <Card border radius={2} padding={2} style={{maxWidth: 720}}>
        {children}
      </Card>
    </Stack>
  )
}

const meta: Meta = {
  title: 'Releases/Overview Parts',
  decorators: [WithStudioProviders({releases: allReleaseFixtures})],
  parameters: {
    docs: {
      description: {
        component: [
          'Three of these components render `null` under conditions their props do not mention, ' +
            'and that is the recurring shape of this screen: the overview cannot predict its own ' +
            'layout from its own state, it hands data down and finds out what appears.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/overview/` |',
          '| Tier | SERVICE |',
          '| Patterns | `empty-states` |',
          '',
          'The pieces the Releases overview screen is assembled from: its empty state, its four ' +
            'banners, and the control that switches between releases and scheduled drafts. The ' +
            'overview root itself runs a live query and is out of scope; everything around it is ' +
            'prop-driven and storied here.',
          '',
          '`ReleasesEmptyState` returns null in upsell mode. `DraftsDisabledBanner` returns ' +
            'null unless a cardinality-one release actually exists. ' +
            '`ConfirmActiveScheduledDraftsBanner` returns null when the count is zero. Each of ' +
            'those is a decision made from context the caller did not pass in.',
          '',
          'So the null cases are storied explicitly below, in dashed frames. "Renders nothing" ' +
            'is a behaviour, and an empty story frame is the only honest way to show it.',
          '',
          '> **Why it matters:** each of these components decides for itself, from context the ' +
            'caller did not pass in, whether it has anything worth saying. Check that before you ' +
            'go looking for why a banner did not show up: the absence may be the component ' +
            'working correctly, not a wiring bug.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:empty-states',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const EmptyState: Story = {
  name: 'ReleasesEmptyState',
  parameters: {
    docs: {
      description: {
        story:
          'A studio with releases enabled and none created. Illustration, a heading, a sentence, and two actions - and note the second is a link to the documentation rather than a second thing to click in the product.\n\nThat is the right call for a feature nobody has used yet. The primary action is passed in as `createReleaseButton` rather than owned by the empty state, so the button carries whatever permission and limit rules apply (see `CreateReleaseMenuItem`) and the empty state does not have to know about any of them.',
      },
    },
  },
  render: () => (
    <Stage>
      <div style={{height: 420, display: 'flex'}}>
        <ReleasesEmptyState createReleaseButton={<Button text="New release" tone="primary" />} />
      </div>
    </Stage>
  ),
}

export const NotFoundBanner: Story = {
  name: 'ReleaseNotFoundBanner',
  parameters: {
    docs: {
      description: {
        story:
          'You followed a link to a release that no longer exists. The banner is caution-toned, sits above the table, and is **dismissible** - which is the distinguishing feature. The release is gone and nothing further will happen; the only remaining job is to explain the discrepancy once and then get out of the way.\n\nContrast the two banners below, which are not dismissible because their conditions persist.',
      },
    },
  },
  render: () => (
    <Stage>
      <ReleaseNotFoundBanner onDismiss={noop} />
    </Stage>
  ),
}

export const DraftsDisabled: Story = {
  name: 'DraftsDisabledBanner - two messages',
  parameters: {
    docs: {
      description: {
        story:
          'Two different configurations produce two different sentences. With scheduled drafts on but drafts mode off, the message names drafts mode; with scheduled drafts off, it names scheduled drafts. Same banner, and the distinction matters because the two are fixed in different places.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="drafts mode disabled">
        <DraftsDisabledBanner
          isDraftModelEnabled={false}
          isScheduledDraftsEnabled
          allReleases={WITH_SCHEDULED_DRAFT}
        />
      </Stage>
      <Stage label="scheduled drafts disabled">
        <DraftsDisabledBanner
          isDraftModelEnabled
          isScheduledDraftsEnabled={false}
          allReleases={WITH_SCHEDULED_DRAFT}
        />
      </Stage>
    </Stack>
  ),
}

export const DraftsDisabledHidden: Story = {
  name: 'DraftsDisabledBanner - renders nothing',
  parameters: {
    docs: {
      description: {
        story:
          'The same disabled configuration, but with no cardinality-one release in the workspace - so the banner returns `null`.\n\nThe logic is `(!isDraftModelEnabled || !isScheduledDraftsEnabled) && hasSingleDocRelease`, and the second half is the interesting one: the warning only appears if there is something to warn *about*. Telling an editor that scheduled drafts are disabled when they have never made one is noise. The banner reads the release list to decide whether its own message is relevant, which is more restraint than most banners show.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 720}}>
        <DraftsDisabledBanner
          isDraftModelEnabled={false}
          isScheduledDraftsEnabled={false}
          allReleases={NO_SCHEDULED_DRAFTS}
        />
      </Card>
      <Text size={0} muted>
        same disabled config as above; no scheduled draft exists, so the banner rendered nothing
      </Text>
    </Stack>
  ),
}

export const ConfirmScheduledDrafts: Story = {
  name: 'ConfirmActiveScheduledDraftsBanner',
  parameters: {
    docs: {
      description: {
        story:
          'Counts the active cardinality-one releases and offers an action. The count is interpolated through `Translate` rather than concatenated, so a translator gets a whole sentence with a plural rule instead of a fragment plus a number.\n\nThe button does two different things depending on where you are: in the paused view with no date filter it opens a confirm dialog, otherwise it navigates to the paused view. One control, two behaviours, and the label changes to match - so the button never promises something it will not do.',
      },
    },
  },
  render: () => (
    <Stage>
      <ConfirmActiveScheduledDraftsBanner
        releases={WITH_SCHEDULED_DRAFT}
        releaseGroupMode="active"
        hasDateFilter={false}
        onNavigateToPaused={noop}
      />
    </Stage>
  ),
}

export const ConfirmScheduledDraftsNone: Story = {
  name: 'ConfirmActiveScheduledDraftsBanner - renders nothing',
  parameters: {
    docs: {
      description: {
        story:
          'No active scheduled drafts, so the banner returns `null` before rendering anything. Storied because the overview screen mounts this unconditionally and lets the component decide - the caller does not gate it.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Card border radius={2} padding={4} style={{borderStyle: 'dashed', maxWidth: 720}}>
        <ConfirmActiveScheduledDraftsBanner
          releases={NO_SCHEDULED_DRAFTS}
          releaseGroupMode="active"
          hasDateFilter={false}
          onNavigateToPaused={noop}
        />
      </Card>
      <Text size={0} muted>
        the dashed box is the story frame; the banner itself rendered nothing
      </Text>
    </Stack>
  ),
}

export const ViewPickerBoth: Story = {
  name: 'CardinalityViewPicker - a menu',
  parameters: {
    docs: {
      description: {
        story:
          'With both releases and scheduled drafts available, the control is a menu and you can switch. Open it and pick the other view; the label follows.',
      },
    },
  },
  render: function ViewPickerStory() {
    const [view, setView] = useState<'releases' | 'drafts'>('releases')
    return (
      <Stage>
        <Flex padding={2}>
          <CardinalityViewPicker
            cardinalityView={view}
            loading={false}
            isScheduledDraftsEnabled
            isDraftModelEnabled
            isReleasesEnabled
            allReleases={WITH_SCHEDULED_DRAFT}
            onCardinalityViewChange={(next) => () => setView(next)}
          />
        </Flex>
      </Stage>
    )
  },
}

export const ViewPickerSingle: Story = {
  name: 'CardinalityViewPicker - a label, not a control',
  parameters: {
    docs: {
      description: {
        story:
          'When only one view is available the component stops being a button and becomes a **label**: an icon and a word, with nothing to click.\n\nThis is the good version of a disabled state. A greyed-out menu button would say "there is a choice here you cannot make", which is false - there is no choice, there is one view. Removing the affordance entirely is the honest rendering, and it is a distinction worth copying: disable a control when the option exists but is unavailable, remove it when the option does not exist.',
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stage label="releases only">
        <Flex padding={2}>
          <CardinalityViewPicker
            cardinalityView="releases"
            loading={false}
            isScheduledDraftsEnabled={false}
            isDraftModelEnabled
            isReleasesEnabled
            allReleases={NO_SCHEDULED_DRAFTS}
            onCardinalityViewChange={() => noop}
          />
        </Flex>
      </Stage>
      <Stage label="scheduled drafts only">
        <Flex padding={2}>
          <CardinalityViewPicker
            cardinalityView="drafts"
            loading={false}
            isScheduledDraftsEnabled
            isDraftModelEnabled
            isReleasesEnabled={false}
            allReleases={WITH_SCHEDULED_DRAFT}
            onCardinalityViewChange={() => noop}
          />
        </Flex>
      </Stage>
    </Stack>
  ),
}

export const ViewPickerLoading: Story = {
  name: 'CardinalityViewPicker - loading',
  parameters: {
    docs: {
      description: {
        story:
          'While the release list is still loading the menu button is disabled rather than hidden. Correct here, and the mirror image of the story above: the choice definitely exists, it is just not answerable yet, so the control stays and goes inert.',
      },
    },
  },
  render: () => (
    <Stage>
      <Flex padding={2}>
        <CardinalityViewPicker
          cardinalityView="releases"
          loading
          isScheduledDraftsEnabled
          isDraftModelEnabled
          isReleasesEnabled
          allReleases={WITH_SCHEDULED_DRAFT}
          onCardinalityViewChange={() => noop}
        />
      </Flex>
    </Stage>
  ),
}

export const InContext: Story = {
  name: 'In context - the top of the overview',
  parameters: {
    docs: {
      description: {
        story:
          'The pieces assembled the way the overview screen stacks them: the view picker in the header, then whichever banners have decided they are relevant, then the table. Seen together, the banner stack is the screen telling you what is unusual about your current configuration before you start reading rows.',
      },
    },
  },
  render: () => (
    <Card border radius={2} padding={3} style={{maxWidth: 720}}>
      <Stack gap={4}>
        <Flex align="center" justify="space-between">
          <CardinalityViewPicker
            cardinalityView="releases"
            loading={false}
            isScheduledDraftsEnabled
            isDraftModelEnabled
            isReleasesEnabled
            allReleases={WITH_SCHEDULED_DRAFT}
            onCardinalityViewChange={() => noop}
          />
          <Button text="New release" tone="primary" />
        </Flex>
        <ConfirmActiveScheduledDraftsBanner
          releases={WITH_SCHEDULED_DRAFT}
          releaseGroupMode="active"
          hasDateFilter={false}
          onNavigateToPaused={noop}
        />
        <DraftsDisabledBanner
          isDraftModelEnabled={false}
          isScheduledDraftsEnabled
          allReleases={WITH_SCHEDULED_DRAFT}
        />
        <Card border radius={2} padding={4} tone="transparent">
          <Text size={1} muted align="center">
            {releaseFixtures.asap.metadata.title} and {allReleaseFixtures.length - 1} more would be
            listed here
          </Text>
        </Card>
      </Stack>
    </Card>
  ),
}
