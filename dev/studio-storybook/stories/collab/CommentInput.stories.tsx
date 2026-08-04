import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {MentionsMenu} from '../../../../packages/sanity/src/core/comments/components/mentions/MentionsMenu'
import {CommentInput} from '../../../../packages/sanity/src/core/comments/components/pte/comment-input/CommentInput'
import {
  createUserServingClient,
  currentUserDoug,
  fixtureMentionOptions,
  ptMessage,
} from '../../lib/mockCollabFixtures'
import {WithStudioProviders} from '../../lib/testProvider'

const meta: Meta = {
  title: 'Collaboration/Comment Input',
  parameters: {
    // Each story is a fixed demo of one CommentInputDemo configuration; no component prop
    // type at meta level for a controls panel to drive.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'CommentInput is the composer, with live mentions, that a comment conversation ' +
            'happens in wherever comments live in Studio.',
          '',
          '|        |                                                                                                                                                                                                                                                                                         |',
          '| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/comments/components/pte/comment-input/CommentInput.tsx`. Studio-only, no DS equivalent                                                                                                                                                                        |',
          '| Tier   | SERVICE. The comments-specific Portable Text composer (a purpose-built PTE instance with a mentions plugin), reused across the inspector, field popovers and task descriptions                                                                                                          |',
          '| Audit  | ⚪ not-audited individually. The composer itself was not a scored surface; its chapter-14 pattern (`collaborative-presence`) fails on the field-seam affordance and badges, which the Comments page reproduces. The mentions affordance in here worked as expected during the benchmark |',
          '',
          'It is a Portable Text editor built for one job: write a comment, drop an `@mention`. ' +
            'Studio reuses the same instance everywhere comments surface: the comments inspector, ' +
            'the per-field popover, a task description. Learn it here and it is known across all ' +
            'three.',
          '',
          'These stories mount the **real** `CommentInput`, a live editor, not a mock. Type `@` ' +
            '(or press the mention button) and the real mentions popover opens over the fixture ' +
            'user list, including the disabled "no access" treatment for a user without read ' +
            'permission on the document. Submit with Enter; Escape opens the real discard flow ' +
            'when there is content.',
          '',
          'Harness notes: the current-user avatar and mention rows resolve through the real ' +
            '`createUserStore` against a fixture-serving client. The mentions popover portals; ' +
            'interact in the story canvas, since docs previews reserve height for it.',
          '',
          '> **Why it matters:** the mentions popover portals out of the composer to the ' +
            'document body rather than nesting inside the card. Interact with it in the full ' +
            'story canvas: in the compact docs preview the popover renders outside the reserved ' +
            'frame. These stories set an explicit height.',
          '',
          'The last story shows the composer in context: open on the **Title** of the "Anna ' +
            'Karenina" draft, an editor typing a note in the margin, mention live.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({client: createUserServingClient()})],
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:collaborative-presence',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

function CommentInputDemo(props: {
  initialValue?: PortableTextBlock[] | null
  readOnly?: boolean
  expandOnFocus?: boolean
  withAvatar?: boolean
  placeholder?: string
}) {
  const {
    initialValue = null,
    readOnly,
    expandOnFocus,
    withAvatar = true,
    placeholder = 'Create a new comment',
  } = props
  const [value, setValue] = useState<PortableTextBlock[] | null>(initialValue)

  return (
    <Box padding={4} style={{maxWidth: 420}}>
      <Card border padding={3} radius={3}>
        <CommentInput
          currentUser={currentUserDoug}
          expandOnFocus={expandOnFocus}
          mentionOptions={fixtureMentionOptions}
          onChange={setValue}
          onDiscardConfirm={() => setValue(null)}
          onSubmit={() => setValue(null)}
          placeholder={placeholder}
          readOnly={readOnly}
          value={value}
          withAvatar={withAvatar}
        />
      </Card>
    </Box>
  )
}

/**
 * The resting composer: avatar, placeholder, mention (`@`) and send affordances. The
 * send button is disabled until there is content: type to arm it, `@` to mention.
 */
export const Empty: Story = {
  parameters: {docs: {story: {height: '420px'}}},
  render: () => <CommentInputDemo />,
}

/** Pre-filled with a message ending in a resolved `@mention` chip (Octavia). */
export const WithValue: Story = {
  name: 'With value + mention',
  parameters: {docs: {story: {height: '420px'}}},
  render: () => (
    <CommentInputDemo
      initialValue={ptMessage('Handing the fact-check to', 'story-input', 'octavia')}
    />
  ),
}

/**
 * `expandOnFocus`: the compact single-line variant the thread reply slot uses;
 * actions reveal on focus.
 */
export const ExpandOnFocus: Story = {
  name: 'Expand on focus (reply variant)',
  parameters: {docs: {story: {height: '420px'}}},
  render: () => <CommentInputDemo expandOnFocus placeholder="Reply" />,
}

/** Read-only (the upsell/no-permission rendering path). */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <CommentInputDemo readOnly initialValue={ptMessage('This thread is locked.', 'story-ro')} />
  ),
}

/**
 * The mentions list mounted directly (inline, un-portaled): the real `MentionsMenu` +
 * `CommandList` over the fixture users. Ted Chiang is `granted: false`, the real
 * "no access on this document" row treatment, disabled for selection.
 */
export const MentionsList: Story = {
  name: 'Mentions list (inline)',
  render: () => (
    <Box padding={4}>
      <Card border radius={3} style={{width: 240}}>
        <MentionsMenu
          loading={false}
          onSelect={() => undefined}
          options={fixtureMentionOptions.data ?? []}
        />
      </Card>
    </Box>
  ),
}

/** The mentions list while user permissions are still resolving. */
export const MentionsLoading: Story = {
  name: 'Mentions list (loading)',
  render: () => (
    <Box padding={4}>
      <Card border radius={3} style={{width: 240}}>
        <MentionsMenu loading onSelect={() => undefined} options={null} />
      </Card>
    </Box>
  ),
}

/** Live composer for the in-context field-comment moment (holds its own value state). */
function FieldCommentComposer() {
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  return (
    <CommentInput
      currentUser={currentUserDoug}
      mentionOptions={fixtureMentionOptions}
      onChange={setValue}
      onDiscardConfirm={() => setValue(null)}
      onSubmit={() => setValue(null)}
      placeholder="Add a comment on Title"
      value={value}
    />
  )
}

/**
 * **In context.** The per-field comment composer, open on the **Title** of the "Anna
 * Karenina" draft, the moment an editor drops a note in the margin. This is the same
 * `CommentInput` the field popover mounts, sitting under the field breadcrumb that says
 * *what* is being discussed: type a comment and press `@` to hand it to a teammate (the
 * real mentions list opens over the fixture cast, Ted Chiang greyed out, no read access
 * on this document). Enter submits; the send button stays disabled until there is
 * something to say.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}, docs: {story: {height: '460px'}}},
  render: () => (
    <Box padding={4} style={{maxWidth: 440}}>
      <Card border padding={3} radius={3}>
        <Stack gap={3}>
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              Anna Karenina
            </Text>
            <Text muted size={1}>
              ›
            </Text>
            <Text muted size={1}>
              Title
            </Text>
          </Flex>
          <Card border padding={2} radius={2} tone="transparent">
            <FieldCommentComposer />
          </Card>
        </Stack>
      </Card>
    </Box>
  ),
}
