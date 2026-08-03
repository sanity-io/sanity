import {AccessDeniedIcon} from '@sanity/icons/AccessDenied'
import {type CurrentUser} from '@sanity/types'
import {Box, Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). InsufficientPermissionsMessage is
// Studio's standard access-denied panel, shown when the current user lacks the grant for
// an action (publish, delete, create a reference, …). It reads translations + list
// formatting via studio i18n, so it needs the LocaleContext — WithStudioProviders here.
import {InsufficientPermissionsMessage} from '../../../../packages/sanity/src/core/components/InsufficientPermissionsMessage'
import {WithStudioProviders} from '../../lib/testProvider'

const editorUser: CurrentUser = {
  id: 'jane',
  name: 'Jane Editor',
  email: 'jane@example.com',
  // oxlint-disable-next-line no-deprecated -- role remains a required (if deprecated) field on CurrentUser; roles is also provided
  role: 'editor',
  roles: [{name: 'editor', title: 'Editor'}],
}

const meta: Meta<typeof InsufficientPermissionsMessage> = {
  title: 'Laws & Behaviors/InsufficientPermissionsMessage',
  component: InsufficientPermissionsMessage,
  decorators: [WithStudioProviders()],
  args: {currentUser: editorUser, context: 'publish-document'},
  argTypes: {
    context: {
      control: 'select',
      options: [
        'create-new-reference',
        'create-document',
        'delete-document',
        'discard-changes',
        'duplicate-document',
        'publish-document',
        'unpublish-document',
      ],
    },
  },
  render: (props) => (
    <Card padding={4} radius={2} shadow={1} style={{maxWidth: 360}}>
      <InsufficientPermissionsMessage {...props} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'Permission walls are inevitable on a real content team, and the way they are worded ' +
            'decides whether a blocked editor feels informed or stonewalled. This is the one ' +
            'surface Studio reuses for every "no", and it currently tells you who you are without ' +
            'ever telling you what would unblock you.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/InsufficientPermissionsMessage.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | SERVICE. The reusable access-denial surface. It composes the access-denied icon, a localized "not authorized" explanation keyed by `context`, and a list-formatted rendering of the roles the current user *does* hold |',
          '| Audit | 🔴 needs-work (`permission-legibility`). The message tells you that you are blocked and which roles you have, but never which permission is missing or how to get it |',
          '| Patterns | `permission-legibility` |',
          '',
          'It pairs the access-denied icon with a localized explanation keyed to the action you ' +
            'attempted, and lists the roles you *do* hold, so the denial at least reads ' +
            'consistently wherever you hit it.',
          '',
          'The Current stories render the real component across several `context` values (the ' +
            'copy is the shipped i18n). Recommended is a mocked panel, the fix does not exist in ' +
            'the component yet, that names the specific missing grant and gives a next step, per ' +
            'org contract §4.',
          '',
          '> **Why it matters:** the shipped message is legible about *you* and silent about ' +
            'the *block*. It names your roles but never the one grant that is actually missing, ' +
            'nor who could give it to you, so a blocked editor learns they are stuck without ' +
            'learning how to get unstuck. That gap is the permission-legibility finding, and what ' +
            'the Recommended panel closes.',
          '',
          'The page closes *in context*: the "Anna Karenina" document footer, where an editor ' +
            'opens Publish and meets this exact access-denied panel.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:lawsofux',
    'pattern:permission-legibility',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof InsufficientPermissionsMessage>

/** Playground: pick the denied action from the `context` control. */
export const Default: Story = {}

/** The same panel across a range of denied actions, only the explanation line changes. */
export const AcrossContexts: Story = {
  name: 'Across contexts',
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} wrap="wrap">
      {(
        ['publish-document', 'delete-document', 'create-new-reference', 'discard-changes'] as const
      ).map((context) => (
        <Card key={context} padding={4} radius={2} shadow={1} style={{maxWidth: 320}}>
          <Stack gap={3}>
            <Text size={0} weight="medium" muted>
              context={context}
            </Text>
            <InsufficientPermissionsMessage currentUser={editorUser} context={context} />
          </Stack>
        </Card>
      ))}
    </Flex>
  ),
}

/**
 * Current, the audit finding: `permission-legibility`. The shipped message, verbatim.
 * It states you are not authorized and lists your role, but a blocked editor still does
 * not know *which* grant is missing or what to do next. Legible about who you are, silent
 * on the block itself.
 */
export const Current: Story = {
  name: 'permission-legibility · Current (shipped message)',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1} style={{maxWidth: 360}}>
      <InsufficientPermissionsMessage currentUser={editorUser} context="publish-document" />
    </Card>
  ),
}

/**
 * Recommended: same denial, made actionable. Name the exact missing grant
 * (`publish` on this document type), state plainly what it would let you do, and give a
 * concrete next step (request it, and from whom). Mocked panel, the component ships none
 * of this yet, showing what "addressed" looks like for `permission-legibility`.
 */
export const Recommended: Story = {
  name: 'permission-legibility · Recommended (names the grant + next step)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1} style={{maxWidth: 380}}>
      <Stack gap={4}>
        <Inline gap={2}>
          <Text size={1}>
            <AccessDeniedIcon />
          </Text>
          <Text size={1} weight="medium">
            You can’t publish this document
          </Text>
        </Inline>
        <Text size={1}>
          Publishing an <code>author</code> needs the <code>publish</code> grant. Your{' '}
          <code>Editor</code> role can create and edit drafts, but not publish them.
        </Text>
        <Card padding={3} radius={2} tone="primary" border>
          <Text size={1}>
            Ask a project <code>Administrator</code> to grant you <code>publish</code> on{' '}
            <code>author</code>, or send this draft for review.
          </Text>
        </Card>
      </Stack>
    </Card>
  ),
}

/**
 * In context, Jane (an Editor) opens Publish on the "Anna Karenina" draft and hits
 * the wall. The document footer shows the disabled Publish action, and the shipped
 * access-denied panel sits right beneath it: it tells her she is not authorized and
 * lists the role she holds, the real surface, in the real place an editor meets it.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card radius={2} shadow={1} style={{maxWidth: 420}}>
      <Flex
        align="center"
        justify="space-between"
        padding={3}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            Anna Karenina
          </Text>
          <Text size={0} muted>
            Book · Draft
          </Text>
        </Stack>
        <Button text="Publish" tone="positive" disabled />
      </Flex>
      <Box padding={3}>
        <InsufficientPermissionsMessage currentUser={editorUser} context="publish-document" />
      </Box>
    </Card>
  ),
}
