import {Card, Flex, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {VersionContextMenuItem} from '../../../../packages/sanity/src/core/releases/components/documentHeader/contextMenu/VersionContextMenuItem'
import {VersionChip} from '../../../../packages/sanity/src/core/releases/components/documentHeader/VersionChip'
import {
  getDraftId,
  getPublishedId,
  getVersionId,
} from '../../../../packages/sanity/src/core/util/draftUtils'
import {allReleaseFixtures, releaseFixtures} from '../../lib/releaseFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

const DOCUMENT_GROUP_ID = 'article-launch'

// VersionChip's contextValues needs both the base document identity (documentGroupId) and the
// exact document id for whatever perspective it's showing (versionId) - published/draft ids
// have their own fixed form, a release version's id is derived from (documentGroupId, bundleId).
function versionIdFor(bundleId: string, isVersion: boolean) {
  if (!isVersion)
    return bundleId === 'published'
      ? getPublishedId(DOCUMENT_GROUP_ID)
      : getDraftId(DOCUMENT_GROUP_ID)
  return getVersionId(DOCUMENT_GROUP_ID, bundleId)
}

function baseContext(overrides: {bundleId?: string; isVersion?: boolean} = {}) {
  const bundleId = overrides.bundleId ?? 'rScheduled'
  const isVersion = overrides.isVersion ?? true
  return {
    documentGroupId: DOCUMENT_GROUP_ID,
    versionId: versionIdFor(bundleId, isVersion),
    documentType: 'article',
    releases: allReleaseFixtures,
    releasesLoading: false,
    bundleId,
    isVersion,
  }
}

function Bar({children}: {children: React.ReactNode}) {
  return (
    <Card border radius="full" padding={1} style={{width: 'fit-content'}}>
      <Flex gap={1} align="center">
        {children}
      </Flex>
    </Card>
  )
}

const meta: Meta = {
  title: 'Releases/Version Chips',
  decorators: [WithStudioProviders({releases: allReleaseFixtures})],
  parameters: {
    docs: {
      description: {
        component: [
          'The chip row is the only place in the studio that shows a document has more than one ' +
            'simultaneous truth, and the states it has to distinguish are unusually dense for one ' +
            'small control.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/documentHeader/` |',
          '| Tier | SERVICE |',
          '| Patterns | `visible-system-state` |',
          '',
          'The row of chips at the top of a document that names every version of it, published, ' +
            'draft, and one per release, and lets you switch between them. Each chip is a button ' +
            'plus a right-click context menu. Selecting one changes which version of the document ' +
            'the form below is editing.',
          '',
          'A chip can be selected or not; locked, because its release is scheduled and its ' +
            'content is frozen; Canvas-linked, meaning the text is being authored somewhere else; ' +
            'paused, for a scheduled draft that has stopped; or disabled outright. Several of ' +
            'those can be true at once. That is a lot of meaning for something the width of two ' +
            'words. The chip leans on tone, a leading avatar glyph and a trailing lock rather ' +
            'than on text; there is no room for text.',
          '',
          'A literal that will catch you: the `bundleId` for the two system chips is ' +
            '`published` and `draft`, singular. `useVersionIsLinked` special-cases exactly those ' +
            'two strings and otherwise calls `getVersionId`, which throws on anything else. ' +
            'Passing the plural `drafts`, which is what the perspective system uses everywhere ' +
            'else, crashes the chip.',
          '',
          'A behaviour easy to miss: the selected chip scrolls itself into view on mount. On a ' +
            'document in eight releases the row overflows, and without that the version you are ' +
            'editing can be scrolled off screen.',
          '',
          '> **Why it matters:** the interface would otherwise show you content while hiding ' +
            'which content it is. A control this small is carrying an unusual amount of state, ' +
            'and every one of its behaviours exists to keep that state legible rather than merely ' +
            'present.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'pattern:visible-system-state',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const States: Story = {
  name: 'Every chip state',
  parameters: {
    docs: {
      description: {
        story:
          'The vocabulary, in one row. Selected carries the release tone as a filled background; unselected is quiet. **Locked** adds a padlock - the release is scheduled, so the content is frozen and editing it means unscheduling first. **Disabled** is a chip you can see but not switch to.\n\nRead them together and the ranking is deliberate: selection is the loudest signal, because it answers "what am I editing", which is the question the row exists for.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Bar>
        <VersionChip
          selected
          text="Autumn campaign"
          tone="suggest"
          onClick={noop}
          onCopyToDraftsComplete={noop}
          contextValues={{...baseContext(), release: releaseFixtures.scheduled}}
        />
        <VersionChip
          selected={false}
          text="Published"
          tone="positive"
          onClick={noop}
          onCopyToDraftsComplete={noop}
          contextValues={{
            ...baseContext({bundleId: 'published', isVersion: false}),
            isVersion: false,
            bundleId: 'published',
          }}
        />
        <VersionChip
          selected={false}
          locked
          text="Locked release"
          tone="suggest"
          onClick={noop}
          onCopyToDraftsComplete={noop}
          contextValues={{...baseContext(), release: releaseFixtures.scheduledLocked}}
        />
        <VersionChip
          selected={false}
          disabled
          text="Unavailable"
          tone="default"
          onClick={noop}
          onCopyToDraftsComplete={noop}
          contextValues={{...baseContext(), disabled: true}}
        />
      </Bar>
      <Text size={0} muted>
        selected · unselected · locked (padlock) · disabled
      </Text>
    </Stack>
  ),
}

export const Tones: Story = {
  name: 'One chip per release type',
  parameters: {
    docs: {
      description: {
        story:
          'The tone comes from the release, through the same `getReleaseTone` the avatar uses - caution for asap, suggest for scheduled, neutral for undecided, default for archived. A chip and its avatar can never disagree about what kind of release they name, because both derive from one function.',
      },
    },
  },
  render: () => (
    <Bar>
      {[
        {release: releaseFixtures.asap, tone: 'caution' as const},
        {release: releaseFixtures.scheduled, tone: 'suggest' as const},
        {release: releaseFixtures.undecided, tone: 'neutral' as const},
        {release: releaseFixtures.archived, tone: 'default' as const},
      ].map(({release, tone}) => (
        <VersionChip
          key={release._id}
          selected={false}
          text={release.metadata.title}
          tone={tone}
          onClick={noop}
          onCopyToDraftsComplete={noop}
          contextValues={{...baseContext(), release}}
        />
      ))}
    </Bar>
  ),
}

export const Selecting: Story = {
  name: 'Switching version',
  parameters: {
    docs: {
      description: {
        story:
          "Stateful: click the chips and selection moves. In a real document the form underneath would swap to that version's content, which is why this control is worth more attention than its size suggests - it silently changes what every field below it is showing.",
      },
    },
  },
  render: function SelectingStory() {
    const [selected, setSelected] = useState('rScheduled')
    return (
      <Stack gap={4}>
        <Bar>
          {[
            {
              id: 'published',
              text: 'Published',
              tone: 'positive' as const,
              release: undefined,
              isVersion: false,
            },
            {
              id: 'draft',
              text: 'Draft',
              tone: 'default' as const,
              release: undefined,
              isVersion: false,
            },
            {
              id: 'rAsap',
              text: releaseFixtures.asap.metadata.title,
              tone: 'caution' as const,
              release: releaseFixtures.asap,
              isVersion: true,
            },
            {
              id: 'rScheduled',
              text: releaseFixtures.scheduled.metadata.title,
              tone: 'suggest' as const,
              release: releaseFixtures.scheduled,
              isVersion: true,
            },
            // `isVersion` must be FALSE for the two system chips. It is what decides whether the
            // context menu resolves a version id, and `getVersionId(doc, 'published')` throws.
          ].map(({id, text, tone, release, isVersion}) => (
            <VersionChip
              key={id}
              selected={selected === id}
              text={text}
              tone={tone}
              onClick={() => setSelected(id)}
              onCopyToDraftsComplete={noop}
              contextValues={{...baseContext({bundleId: id, isVersion}), release, isVersion}}
            />
          ))}
        </Bar>
        <Text size={0} muted>
          editing: {selected}
        </Text>
      </Stack>
    )
  },
}

export const ContextMenuItems: Story = {
  name: 'VersionContextMenuItem',
  parameters: {
    docs: {
      description: {
        story:
          'The row used inside the chip\'s context menu, and inside every "copy to release" menu. It is a denser thing than the chip: avatar, title, and a second line saying *when* - "as soon as possible", a relative date, or "undecided".\n\nThat second line is why the menu is usable. A list of release names asks you to remember which is which; a list of names with their timing attached does not. The scheduled one also carries a trailing padlock, so a locked target is refused visibly rather than after you pick it.',
      },
    },
  },
  render: () => (
    <Card border radius={2} shadow={1} padding={1} style={{maxWidth: 320}}>
      <Menu>
        <Stack gap={1}>
          {[
            releaseFixtures.asap,
            releaseFixtures.scheduled,
            releaseFixtures.scheduledLocked,
            releaseFixtures.undecided,
          ].map((release) => (
            <Card key={release._id} padding={2} radius={2} tone="transparent">
              <VersionContextMenuItem release={release} />
            </Card>
          ))}
        </Stack>
      </Menu>
    </Card>
  ),
}

export const Overflow: Story = {
  name: 'A document in many releases',
  parameters: {
    docs: {
      description: {
        story:
          'Seven chips in a constrained row. This is the state that motivates the `scrollIntoView` on selection: the row scrolls horizontally, and without it the chip you are editing could sit off screen while the form below shows its content.\n\nIt is also the state that argues the chip row does not scale indefinitely - past a handful of releases, a row of chips is a scroll container pretending to be a summary.',
      },
    },
  },
  render: () => (
    <Card border radius="full" padding={1} style={{maxWidth: 420, overflowX: 'auto'}}>
      <Flex gap={1} align="center">
        {allReleaseFixtures.map((release, i) => (
          <VersionChip
            key={release._id}
            selected={i === 3}
            text={release.metadata.title || 'Untitled release'}
            tone={i === 3 ? 'suggest' : 'default'}
            onClick={noop}
            onCopyToDraftsComplete={noop}
            contextValues={{...baseContext(), release}}
          />
        ))}
      </Flex>
    </Card>
  ),
}
