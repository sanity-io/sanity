import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseSummary} from '../../../../packages/sanity/src/core/releases/tool/detail/ReleaseSummary'
import {asTableRelease, documentsInRelease, releaseFixtures} from '../../lib/releaseFixtures'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithStudioProviders} from '../../lib/testProvider'

const meta: Meta<typeof ReleaseSummary> = {
  title: 'Releases/Release Summary',
  component: ReleaseSummary,
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'A release is a promise that a set of documents will go live together, and this table ' +
            'is where that promise is checked: validation is per-document, but blocking is ' +
            'per-release, so one document failing its schema rules holds the entire release.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/tool/detail/ReleaseSummary.tsx` |',
          '| Tier | SERVICE |',
          '| Patterns | `bulk-actions` · `draft-publish-lifecycle` |',
          '',
          "The body of a release's detail screen: the table of every document in the release, " +
            'its validation state, and the controls for adding to or acting on it. Prop-driven on ' +
            '`{release, documents, isLoading}`, so it can be storied at all while the screen ' +
            'around it cannot.',
          '',
          'The table cannot merely list documents, it has to make the one bad row findable ' +
            'among many, which is what the filter tabs and the per-row validation column exist ' +
            'for.',
          '',
          'Note also that `goingToUnpublish` rows are counted as validated without being ' +
            'validated. That is correct rather than a shortcut: a document being removed from the ' +
            'published site does not need to satisfy the schema, because nothing will read it ' +
            'afterwards. It is the kind of rule that is obvious once stated and invisible in the ' +
            'code until you look for it.',
          '',
          'The fixtures are the shared release fixtures used across this chapter, so the same ' +
            'four documents appear here and in `Releases/Validation Progress`. `ReleaseSummary` ' +
            'renders at `height: 100%`, so the stories mount it in `ScreenFrame`.',
          '',
          'The `Edited` column reads "Not found" here, and that is the harness rather than the ' +
            'component. That column resolves through `useDocumentLastEditedBy`, which calls the ' +
            "transaction log rather than querying documents. The storybook's client answers GROQ, " +
            'not the history endpoint, so the request fails and the column reports honestly that ' +
            'it could not find an author. Everything else on the row is real.',
          '',
          'Left visible rather than stubbed, on the standing rule: the column is what a history ' +
            'lookup renders, and fabricating an author would make this page assert something it ' +
            'cannot show. It also shows what the table does when one cell cannot resolve, since ' +
            'in a real studio that is a reachable state for a document whose history has been ' +
            'compacted.',
          '',
          '> **Why it matters:** validation is per-document and blocking is per-release. A ' +
            'release showing no errors and a release that has not finished checking for them are ' +
            'different claims, and this table has to keep them visibly distinct so publishing on ' +
            'the wrong one is not a click away.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:bulk-actions',
    'pattern:draft-publish-lifecycle',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof ReleaseSummary>

const release = asTableRelease(releaseFixtures.asap)

export const Valid: Story = {
  name: 'Every document valid',
  args: {release, documents: documentsInRelease.valid()},
  parameters: {
    docs: {
      description: {
        story:
          'Three documents, all validated clean. This is the state a release has to reach before it can be published, and the table says so without a banner: there is no error column content and nothing is flagged.\n\nRead the columns. Each row carries the document, its type, who touched it last and when, and its validation state, which is the minimum set for answering "is this release ready and if not, why not" without opening anything.',
      },
    },
  },
  render: (args) => (
    <ScreenFrame>
      <ReleaseSummary {...args} />
    </ScreenFrame>
  ),
}

export const WithErrors: Story = {
  name: 'One document blocking the release',
  args: {release, documents: documentsInRelease.withErrors()},
  parameters: {
    docs: {
      description: {
        story: [
          '`War and Peace` is missing a required author. The release cannot publish, and the ' +
            'row says which document and which rule.',
          '',
          '**The design point is the ratio.** One row of three is failing here; in a real ' +
            'release it is one of two hundred. The table is built for the case where the ' +
            'failing row is not on screen. That is what the filter tabs above it are for, and ' +
            'why the validation state is a column rather than a decoration on the title.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <ScreenFrame>
      <ReleaseSummary {...args} />
    </ScreenFrame>
  ),
}

export const Validating: Story = {
  name: 'Validation still running',
  args: {release, documents: documentsInRelease.validating()},
  parameters: {
    docs: {
      description: {
        story:
          'Two documents validated, two still going. Validation is asynchronous and per-document, so a large release spends real time in this state rather than passing through it.\n\nThat is why the in-progress state is rendered rather than collapsed into the valid one: a release showing no errors and a release that has not finished looking for them are different claims, and publishing on the first while looking at the second is exactly the mistake the screen has to prevent.',
      },
    },
  },
  render: (args) => (
    <ScreenFrame>
      <ReleaseSummary {...args} />
    </ScreenFrame>
  ),
}

export const GoingToUnpublish: Story = {
  name: 'Documents marked for unpublishing',
  args: {release, documents: documentsInRelease.goingToUnpublish()},
  parameters: {
    docs: {
      description: {
        story:
          'A release that removes a document as well as publishing others. `Persuasion` is marked to unpublish.\n\nThese rows count as validated without having been validated, because a document leaving the published site does not have to satisfy the schema. Storied on its own because it is the one case where the validation column means something different from what it says, and reading it as "checked and passed" would be wrong.',
      },
    },
  },
  render: (args) => (
    <ScreenFrame>
      <ReleaseSummary {...args} />
    </ScreenFrame>
  ),
}

export const Loading: Story = {
  name: 'Loading',
  args: {release, documents: [], isLoading: true},
  parameters: {
    docs: {
      description: {
        story:
          '`isLoading` with no documents yet. Distinct from the empty state below: one says "we do not know what is in this release", the other says "nothing is".',
      },
    },
  },
  render: (args) => (
    <ScreenFrame>
      <ReleaseSummary {...args} />
    </ScreenFrame>
  ),
}

export const Empty: Story = {
  name: 'An empty release',
  args: {release, documents: []},
  parameters: {
    docs: {
      description: {
        story:
          'A release with nothing in it, which is the state every release starts in. The affordance to add documents is the substance of the screen here rather than an accessory to the table.\n\nPinned because the empty state of a bulk-action surface is where its purpose has to be legible with no content to infer it from.',
      },
    },
  },
  render: (args) => (
    <ScreenFrame>
      <ReleaseSummary {...args} />
    </ScreenFrame>
  ),
}
