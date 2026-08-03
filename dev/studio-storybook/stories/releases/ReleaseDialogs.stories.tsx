import {type EditableReleaseDocument} from '@sanity/client'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {CreateReleaseDialog} from '../../../../packages/sanity/src/core/releases/components/dialog/CreateReleaseDialog'
import {ReleaseForm} from '../../../../packages/sanity/src/core/releases/components/dialog/ReleaseForm'
import {ReleaseLimitsMisconfigurationDialog} from '../../../../packages/sanity/src/core/releases/components/dialog/ReleaseLimitsMisconfigurationDialog'
import {TitleDescriptionForm} from '../../../../packages/sanity/src/core/releases/components/dialog/TitleDescriptionForm'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

const asapRelease: EditableReleaseDocument = {
  _id: '_.releases.rDraft',
  metadata: {title: '', description: '', releaseType: 'asap'},
} as EditableReleaseDocument

const scheduledRelease: EditableReleaseDocument = {
  _id: '_.releases.rDraft',
  metadata: {
    title: 'Autumn campaign',
    description: 'Homepage, category pages and the newsletter.',
    releaseType: 'scheduled',
    intendedPublishAt: '2026-09-01T09:00:00.000Z',
  },
} as EditableReleaseDocument

const undecidedRelease: EditableReleaseDocument = {
  _id: '_.releases.rDraft',
  metadata: {title: 'Someday ideas', description: '', releaseType: 'undecided'},
} as EditableReleaseDocument

function Frame({children}: {children: React.ReactNode}) {
  return (
    <Card border radius={2} padding={4} style={{maxWidth: 520}}>
      {children}
    </Card>
  )
}

const meta: Meta = {
  title: 'Releases/Dialogs',
  decorators: [WithStudioProviders({releases: fixtureReleases})],
  parameters: {
    docs: {
      description: {
        component: [
          'ReleaseForm writes to local storage as you type, and restores from it on mount, ' +
            'unusual for a form in a modal, and aimed at a specific failure: an editor starts ' +
            'describing a release, gets interrupted, closes the dialog, and comes back to find ' +
            'the text still there.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/releases/components/dialog/` |',
          '| Tier | SERVICE |',
          '',
          'The form an editor fills in to create a release, the two halves it is built from, ' +
            'and the dialog shown when a workspace is misconfigured. `CreateReleaseDialog` is a ' +
            'shell around `ReleaseForm`, which is itself `TitleDescriptionForm` plus a ' +
            'release-type picker. All three are storied, because the pieces are reused elsewhere, ' +
            'the release dashboard edits a title with the same form the create dialog does.',
          '',
          'The type picker is the other half of the form, and it is not a preference. Choosing ' +
            '"At time" reveals a date picker and turns the release into something the system will ' +
            'act on; asap and undecided have no date at all. Switching between them changes what ' +
            'the form is asking for. They are radio-style rather than a dropdown.',
          '',
          '> **Why it matters:** the cost of persisting to local storage is that the form is ' +
            'not purely a function of its props, mount it twice in one session and the second ' +
            'mount may show what was typed into the first. These stories run against real ' +
            'storage, so a title typed here persists into the other stories on this page. Not a ' +
            'bug in the harness; it is the component.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:releases',
    'chapter:cms',
    'chapter:forms',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const TitleDescriptionEmpty: Story = {
  name: 'TitleDescriptionForm - empty',
  parameters: {
    docs: {
      description: {
        story:
          'The two text fields on their own. Both are auto-growing textareas rather than inputs, so a long release description wraps and the field grows into it instead of scrolling sideways - the same treatment the task title field gets, and for the same reason: these are sentences, not identifiers.',
      },
    },
  },
  render: function TitleDescriptionEmptyStory() {
    const [value, setValue] = useState<EditableReleaseDocument>(asapRelease)
    return (
      <Frame>
        <TitleDescriptionForm release={value} onChange={setValue} />
      </Frame>
    )
  },
}

export const TitleDescriptionFilled: Story = {
  name: 'TitleDescriptionForm - filled',
  parameters: {
    docs: {
      description: {
        story:
          'With content in both fields. Type into them and watch the description grow; the height is recomputed from `scrollHeight` on every change rather than set by a row count.',
      },
    },
  },
  render: function TitleDescriptionFilledStory() {
    const [value, setValue] = useState<EditableReleaseDocument>(scheduledRelease)
    return (
      <Frame>
        <TitleDescriptionForm release={value} onChange={setValue} />
      </Frame>
    )
  },
}

export const TitleDescriptionReadOnly: Story = {
  name: 'TitleDescriptionForm - read only',
  parameters: {
    docs: {
      description: {
        story:
          'An archived or published release cannot be renamed, so the same form goes read-only rather than being replaced by static text. Keeping the field shape means the dashboard does not reflow when a release is archived, and the value stays selectable and copyable - which a paragraph of static text would also give you, but a differently-sized one.',
      },
    },
  },
  render: () => (
    <Frame>
      <TitleDescriptionForm release={scheduledRelease} onChange={noop} disabled />
    </Frame>
  ),
}

export const FormAsap: Story = {
  name: 'ReleaseForm - publish as soon as released',
  parameters: {
    docs: {
      description: {
        story:
          'The default. "ASAP" is selected and there is no date control at all - not a disabled one, not an empty one. The form asks for exactly what this release type needs and nothing more.',
      },
    },
  },
  render: function FormAsapStory() {
    const [value, setValue] = useState<EditableReleaseDocument>(asapRelease)
    return (
      <Frame>
        <ReleaseForm value={value} onChange={setValue} />
      </Frame>
    )
  },
}

export const FormScheduled: Story = {
  name: 'ReleaseForm - at a specific time',
  parameters: {
    docs: {
      description: {
        story: [
          'Selecting "At time" reveals a date picker. Switch between the three types and ' +
            'watch the form change shape: this is a control that changes what is being asked, ' +
            'not a value being set. It reads as a segmented choice rather than a select.',
          '',
          'The date here is an *intent*, not a schedule - see `ReleaseTime`, which renders it ' +
            'as "Estimated" until the release is actually scheduled.',
        ].join('\n'),
      },
    },
  },
  render: function FormScheduledStory() {
    const [value, setValue] = useState<EditableReleaseDocument>(scheduledRelease)
    return (
      <Frame>
        <ReleaseForm value={value} onChange={setValue} />
      </Frame>
    )
  },
}

export const FormUndecided: Story = {
  name: 'ReleaseForm - undecided',
  parameters: {
    docs: {
      description: {
        story:
          'The third type, and the one most content models leave out. "Undecided" is a first-class answer here rather than an empty date: a release you intend to make but have not scheduled is a real state, and forcing a placeholder date on it would make the overview table lie about when things are going live.',
      },
    },
  },
  render: function FormUndecidedStory() {
    const [value, setValue] = useState<EditableReleaseDocument>(undecidedRelease)
    return (
      <Frame>
        <ReleaseForm value={value} onChange={setValue} />
      </Frame>
    )
  },
}

export const CreateDialog: Story = {
  name: 'CreateReleaseDialog',
  parameters: {
    docs: {
      description: {
        story: [
          'The whole thing: the form in a dialog, with a confirm button that is disabled ' +
            'while the release is invalid. `getIsReleaseInvalid` gates it, so the button ' +
            'reflects the form state rather than letting you submit and then explaining what ' +
            'was wrong.',
          '',
          'Submitting runs the real create operation against the mock client, so the outcome ' +
            'here is a harness artifact rather than a behaviour - the states to read are the ' +
            'form and the disabled confirm.',
        ].join('\n'),
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <CreateReleaseDialog onCancel={noop} onSubmit={noop} origin="structure" />
    ),
}

export const MisconfigurationDialog: Story = {
  name: 'ReleaseLimitsMisconfigurationDialog',
  parameters: {
    docs: {
      description: {
        story: [
          'Shown when the workspace release limits do not make sense - a plan says one thing ' +
            'and the config says another. There is exactly one action, and it is "contact ' +
            'support", because this is not a state an editor or even a developer can fix from ' +
            'inside the studio.',
          '',
          'Most error surfaces in this codebase work hard to give the reader something to do; ' +
            'this one correctly concludes there is nothing, and says so in one sentence rather ' +
            'than offering a retry that cannot help.',
        ].join('\n'),
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ReleaseLimitsMisconfigurationDialog onClose={noop} />
    ),
}

export const StorageNote: Story = {
  name: 'The local-storage behaviour, stated',
  parameters: {
    docs: {
      description: {
        story:
          'Not a component - a warning worth having in the catalog. `ReleaseForm` restores from local storage on mount, so these stories are not independent of each other and not independent of what you typed a minute ago. Clear the stored draft below if a story looks pre-filled with something you do not recognise.',
      },
    },
  },
  render: function StorageNoteStory() {
    const [cleared, setCleared] = useState(false)
    return (
      <Card border radius={2} padding={4} tone="caution" style={{maxWidth: 520}}>
        <Stack gap={4}>
          <Text size={1} weight="medium">
            ReleaseForm persists to local storage
          </Text>
          <Text size={1} muted>
            It reads stored title, description, release type and intended publish date on mount, so
            a form you filled in earlier reappears filled in. That is deliberate - it protects work
            against an accidentally closed dialog - but it means the stories on this page share
            state with each other and with any real studio on this origin.
          </Text>
          <button
            type="button"
            onClick={() => {
              Object.keys(localStorage)
                .filter((key) => key.toLowerCase().includes('release'))
                .forEach((key) => localStorage.removeItem(key))
              setCleared(true)
            }}
          >
            Clear stored release drafts
          </button>
          {cleared && (
            <Text size={1} muted>
              Cleared. Reload a form story to see it empty.
            </Text>
          )}
        </Stack>
      </Card>
    )
  },
}
