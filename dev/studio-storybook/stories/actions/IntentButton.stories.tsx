import {EditIcon} from '@sanity/icons/Edit'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {route, RouterProvider} from 'sanity/router'

// Real component from its real path (org contract §8). IntentButton is a ui-components
// `Button` that navigates through a router *intent* (e.g. "edit this document") instead
// of an `onClick`. When enabled it renders `as={IntentLink}`; when disabled it renders a
// non-navigating `<a role="link" aria-disabled>`.
import {IntentButton} from '../../../../packages/sanity/src/core/components/IntentButton'

// IntentLink resolves its href from the router, so the story needs a RouterProvider.
// `route.intents('/intents')` is the same intents route the studio test harness uses.
// Without an intents route, `useIntentLink` has nowhere to resolve the intent and throws.
const withRouter: Decorator = (Story) => (
  <RouterProvider router={route.intents('/intents')} state={{}} onNavigate={() => undefined}>
    <Story />
  </RouterProvider>
)

const meta: Meta<typeof IntentButton> = {
  title: 'Actions & Commands/IntentButton',
  component: IntentButton,
  decorators: [withRouter],
  args: {text: 'Edit author', mode: 'ghost'},
  argTypes: {
    text: {control: 'text'},
    mode: {control: 'radio', options: ['default', 'ghost', 'bleed']},
    tone: {control: 'radio', options: ['default', 'primary', 'positive', 'caution', 'critical']},
    size: {control: 'radio', options: ['default', 'large']},
    disabled: {control: 'boolean'},
  },
  parameters: {
    docs: {
      description: {
        component: [
          'IntentButton is how Studio avoids a navigation trap: a button that navigates through ' +
            'a plain click handler quietly takes the web away from a person, no right-click, no ' +
            'middle-click into a new tab, no address to copy.',
          '',
          '|               |                                                                                                                                                |',
          '| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source        | `packages/sanity/src/core/components/IntentButton.tsx`, Studio-only (no design-system equivalent)                                              |',
          '| Tier          | CHROME. A navigation affordance: the ui-components `Button` bound to a router intent instead of an `onClick`                                   |',
          '| Enabled path  | renders `as={IntentLink}`, a real anchor with an `href` the router resolved                                                                    |',
          '| Disabled path | renders `as="a" role="link" aria-disabled="true"` with no `href`. Inert, still announced                                                       |',
          '| Audit         | ⚪ not-audited as a unit, but it sits on `clear-entry-points` and deep-linking: the affordance the audit found missing at the pane-stack level |',
          '| Patterns      | `clear-entry-points`                                                                                                                           |',
          '',
          'The destination is described as an intent, "edit this document" or "create this ' +
            'type", and the router turns it into a genuine link.',
          '',
          'Everything cosmetic passes straight through to `Button`: tone, mode, size, icon, ' +
            'text. So an intent button is indistinguishable from an action button until somebody ' +
            'right-clicks it, which is exactly the point. The affordance costs nothing at the ' +
            'call site, and the two render paths in the table above are the whole of the ' +
            'behaviour.',
          '',
          '> **Why it matters:** if a target can be reached by URL, make it reachable by URL. A ' +
            'JS-only button throws away deep-linking, new-tab opening and address copying, and ' +
            'nobody files a bug about it, because nothing looks broken. The loss is silent. The ' +
            'default has to be the link.',
          '',
          'The last story shows it in context: an author reference row (Leo Tolstoy) whose ' +
            '_Open author_ button is a real, right-clickable, copyable intent link.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:actions',
    'chapter:nav',
    'pattern:clear-entry-points',
    'audit:not-audited',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof IntentButton>

/** Standard usage: an "Edit" intent targeting a document id, rendered as a real anchor. */
export const Default: Story = {
  render: (props) => (
    <IntentButton
      {...props}
      intent="edit"
      params={{id: 'doc-123', type: 'author'}}
      icon={EditIcon}
    />
  ),
}

/** The tones, all navigating the same intent. */
export const Tones: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={3} align="center">
      {(['default', 'primary', 'positive', 'caution', 'critical'] as const).map((tone) => (
        <Stack key={tone} gap={3}>
          <IntentButton
            intent="edit"
            params={{id: 'doc-123', type: 'author'}}
            text="Edit"
            tone={tone}
          />
          <Text align="center" size={0} muted>
            {tone}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/**
 * The two distinct render paths, side by side. The enabled button is an `IntentLink`
 * anchor with a resolved `href` (hover it); the disabled button is a bare
 * `<a role="link" aria-disabled="true">` with no `href`, inert but still announced.
 */
export const EnabledVsDisabled: Story = {
  name: 'Enabled vs disabled',
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      <Stack gap={3}>
        <IntentButton
          intent="edit"
          params={{id: 'doc-123', type: 'author'}}
          text="Edit author"
          mode="ghost"
        />
        <Text align="center" size={0} muted>
          enabled: real href
        </Text>
      </Stack>
      <Stack gap={3}>
        <IntentButton
          intent="edit"
          params={{id: 'doc-123', type: 'author'}}
          text="Edit author"
          mode="ghost"
          disabled
        />
        <Text align="center" size={0} muted>
          disabled: aria-disabled link
        </Text>
      </Stack>
    </Flex>
  ),
}

/**
 * In context: a reference field pointing at the author "Leo Tolstoy". The trailing **Open
 * author** button is an `IntentButton`, an `edit` intent the router resolves to a real
 * `<a href>`, so an editor can right-click it, middle-click it into a new tab, or copy its
 * address. That is the deep-link affordance a plain click handler throws away.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={2} radius={2} shadow={1} style={{maxWidth: 420}}>
      <Flex align="center" gap={3} paddingLeft={2}>
        <Stack gap={2} flex={1}>
          <Text size={0} muted>
            Author
          </Text>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            Leo Tolstoy
          </Text>
        </Stack>
        <IntentButton
          intent="edit"
          params={{id: 'author-tolstoy', type: 'author'}}
          text="Open author"
          icon={EditIcon}
          mode="ghost"
        />
      </Flex>
    </Card>
  ),
}
