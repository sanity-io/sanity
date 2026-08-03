import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {StatusSelector} from '../../../../packages/sanity/src/core/tasks/components/form/fields/StatusSelector'
import {Title} from '../../../../packages/sanity/src/core/tasks/components/form/fields/TitleField'
import {RemoveTaskDialog} from '../../../../packages/sanity/src/core/tasks/components/form/RemoveTaskDialog'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'

const STATUS_OPTIONS = [
  {title: 'To Do', value: 'open'},
  {title: 'Done', value: 'closed'},
]

const meta: Meta = {
  title: 'Collaboration/Task Fields',
  decorators: [WithStudioProviders()],
  parameters: {
    // Each story wires its own local state through a render function; no shared component
    // prop type at meta level to control.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A task form is built from individual inputs, and two of them are not really form ' +
            'inputs at all: the status control, the title field, and the confirmation for ' +
            'removing a task.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/tasks/components/form/` |',
          '| Tier | SERVICE |',
          '',
          'The task list and sidebar are already storied under CMS Patterns/Tasks. These are ' +
            'the fields inside a single task.',
          '',
          '> **Why it matters:** every one of these emits a form patch rather than calling a ' +
            'save. The status control and the title field never touch a document, never know ' +
            'whether one exists, and never decide when to write. That is what lets the same ' +
            'components serve a task being created and a task being edited without a mode flag, ' +
            'and it is why they can be storied at all: hand them a value and an onChange, and ' +
            'they are complete.',
          '',
          '**And storying that turned up a bug.** `Title` intends to emit `unset` when you ' +
            'clear it, and instead emits `unset` immediately followed by `set("")`, because the ' +
            '`if (!inputValue)` branch is missing a `return`, so it falls through. The empty ' +
            'string wins. Filed as ledger #56; the story below shows both patches.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:collaboration',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Prints what the field emitted, so a story shows the patch rather than describing it. */
function PatchReadout({patches}: {patches: string[]}) {
  return (
    <Card border radius={2} padding={3} tone="transparent">
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          EMITS
        </Text>
        {patches.length === 0 ? (
          <Text size={0} muted>
            nothing yet
          </Text>
        ) : (
          patches.slice(-4).map((p, i) => (
            <Text key={i} size={0} style={{fontFamily: 'monospace'}}>
              {p}
            </Text>
          ))
        )}
      </Stack>
    </Card>
  )
}

export const Status: Story = {
  name: 'StatusSelector',
  parameters: {
    docs: {
      description: {
        story:
          'Two statuses, and that is the whole vocabulary: open and closed. Open it and notice the selected row carries BOTH a pressed state and a trailing checkmark - belt and braces, so the current value survives a theme where the pressed background is subtle.\n\nThe trigger shows the status icon alongside the label rather than the label alone, which is what lets the same control read at a glance in a dense task list. Change it and watch the patch below.',
      },
    },
  },
  render: function StatusStory() {
    const [value, setValue] = useState<string | undefined>('open')
    const [patches, setPatches] = useState<string[]>([])
    return (
      <Stack gap={4} style={{maxWidth: 420}}>
        <StatusSelector
          value={value}
          path={['status']}
          options={STATUS_OPTIONS}
          onChange={(patch) => {
            const next = (patch as {value?: string}).value
            setValue(next)
            setPatches((p) => [...p, `set(${JSON.stringify(next)}, ['status'])`])
          }}
        />
        <PatchReadout patches={patches} />
      </Stack>
    )
  },
}

export const TitleEmpty: Story = {
  name: 'Title - empty, autofocused',
  parameters: {
    docs: {
      description: {
        story: [
          'A new task. The field autofocuses **only when empty** (`autoFocus={!value}`), so ' +
            'creating a task puts the cursor where you are about to type while opening an ' +
            'existing one does not steal focus from wherever you were.',
          '',
          'It is a `<textarea>` styled to look like a heading, not an `<input>`, so a long ' +
            'title wraps instead of scrolling sideways. The height is recomputed on every ' +
            'change, so it grows as you type. Try it.',
        ].join('\n'),
      },
    },
  },
  render: function TitleEmptyStory() {
    const [value, setValue] = useState<string | undefined>(undefined)
    const [patches, setPatches] = useState<string[]>([])
    return (
      <Stack gap={4} style={{maxWidth: 420}}>
        <Card border radius={2} padding={3}>
          <Title
            value={value}
            placeholder="Task title"
            onChange={(patch) => {
              const p = patch as {type?: string; value?: string}
              setValue(p.value)
              setPatches((prev) => [
                ...prev,
                p.type === 'unset' ? `unset([])` : `set(${JSON.stringify(p.value)})`,
              ])
            }}
          />
        </Card>
        <PatchReadout patches={patches} />
      </Stack>
    )
  },
}

export const TitleFilled: Story = {
  name: 'Title - clearing a title (ledger #56)',
  parameters: {
    docs: {
      description: {
        story:
          'Start from a filled title, then select all and delete. Watch the readout: it shows **two** patches, `unset([])` and then `set("")`.\n\nThat is a bug, and this story is how it was found. The source reads `if (!inputValue) onChange(unset(path))` with no `return`, so execution falls straight through to the `set` on the next line. The unset is emitted and then immediately overwritten, and the field is written as an empty string - the exact outcome the `if` exists to prevent. Fix: add `return`. Filed as ledger #56.\n\nThe distinction matters because `set("")` is present-and-empty while `unset` is absent. A list rendering `title || "Untitled"` cannot tell them apart; a GROQ filter on `defined(title)` very much can.\n\nSeparately, and working correctly: newlines are stripped on the way through, so pasting multi-line text into what looks like a textarea still yields a single-line title.',
      },
    },
  },
  render: function TitleFilledStory() {
    const [value, setValue] = useState<string | undefined>('Rewrite the launch announcement')
    const [patches, setPatches] = useState<string[]>([])
    return (
      <Stack gap={4} style={{maxWidth: 420}}>
        <Card border radius={2} padding={3}>
          <Title
            value={value}
            placeholder="Task title"
            onChange={(patch) => {
              const p = patch as {type?: string; value?: string}
              setValue(p.type === 'unset' ? undefined : p.value)
              setPatches((prev) => [
                ...prev,
                p.type === 'unset' ? `unset([])` : `set(${JSON.stringify(p.value)})`,
              ])
            }}
          />
        </Card>
        <PatchReadout patches={patches} />
      </Stack>
    )
  },
}

export const RemoveTask: Story = {
  name: 'RemoveTaskDialog',
  parameters: {
    docs: {
      description: {
        story:
          'The destructive confirm. It returns `null` when `showDialog` is false rather than rendering a hidden dialog, so the whole subtree - and the focus lock inside it - only exists while it is open.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <RemoveTaskDialog
        showDialog
        removeStatus="idle"
        handleCloseDialog={() => undefined}
        handleRemove={() => undefined}
        error={null}
        handleOpenDialog={() => undefined}
      />
    ),
}

export const RemoveTaskPending: Story = {
  name: 'RemoveTaskDialog - removing',
  parameters: {
    docs: {
      description: {
        story:
          'Mid-delete. The confirm button goes to a loading state and the dialog stays open, which is the honest rendering - the task is not gone yet, and closing early would claim otherwise.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <RemoveTaskDialog
        showDialog
        removeStatus="loading"
        handleCloseDialog={() => undefined}
        handleRemove={() => undefined}
        error={null}
        handleOpenDialog={() => undefined}
      />
    ),
}

export const RemoveTaskClosed: Story = {
  name: 'RemoveTaskDialog - renders nothing',
  parameters: {
    docs: {
      description: {
        story:
          'With `showDialog: false` the component returns `null`. Storied explicitly because ' +
          '"renders nothing" is a decision: the alternative, a mounted-but-hidden dialog, keeps ' +
          'a focus lock and a portalled overlay alive on every task in the list.',
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <Card border style={{borderStyle: 'dashed'}} radius={2} padding={4}>
        <RemoveTaskDialog
          showDialog={false}
          removeStatus="idle"
          handleCloseDialog={() => undefined}
          handleRemove={() => undefined}
          error={null}
          handleOpenDialog={() => undefined}
        />
      </Card>
      <Text size={0} muted>
        the dashed box is the story frame; the component itself rendered nothing
      </Text>
    </Stack>
  ),
}
