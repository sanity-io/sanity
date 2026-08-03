import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Component, type ReactNode} from 'react'
import {type InitialValueTemplateItem} from 'sanity'

// Real component from its real path (org contract §8).
import {PaneHeaderCreateButton} from '../../../../packages/sanity/src/structure/components/paneHeaderActions/PaneHeaderCreateButton'
import {WithStudioProviders} from '../../lib/testProvider'
import {OverlayFrame} from '../overlays/OverlayFrame'

const meta: Meta<typeof PaneHeaderCreateButton> = {
  title: 'Document Pane/Pane Header Create Button',
  component: PaneHeaderCreateButton,
  parameters: {
    docs: {
      description: {
        component: [
          'This page was first written claiming that a mistyped template id makes the create ' +
            'button quietly disappear. That was wrong, and the story is what proved it: a bad id ' +
            'does not degrade the button, it fails the whole subtree around it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/paneHeaderActions/PaneHeaderCreateButton.tsx` |',
          '| Tier | SERVICE. It decides between four presentations of one affordance and draws none of them itself |',
          '| Audit | 🔴 broken (`empty-state`, `permission-gate`) |',
          '| Patterns | `empty-state` · `permission-gate` |',
          '',
          'This is the plus button in a list pane header. Its whole job is to answer what can ' +
            'be created here, and the answer comes from the structure builder as a list of ' +
            'initial value templates.',
          '',
          'This page was the last component in its tier to get a story, and it was blocked on ' +
            'scaffolding rather than on the component itself: it calls a hook that resolves a ' +
            'grants store the shared harness did not seed. Until that existed, every permission ' +
            'branch was unreachable from a story and the live hook would sit unresolved forever, ' +
            'reading as a component that renders nothing rather than one that is waiting. The ' +
            'harness now seeds it.',
          '',
          'The four returns, quoted:',
          '',
          '| Line | Condition | Renders |',
          '| --- | --- | --- |',
          '| 86 | `templateItems.length === 0` | `null` |',
          '| 88 | `nothingGranted` | one disabled button with a permissions tooltip |',
          '| 108 | exactly one template | a direct `IntentButton` straight to that type |',
          '| 134 | more than one | a `MenuButton` listing every template |',
          '',
          'Plus a fifth exit hiding inside the third: an item with no resolvable intent also ' +
            'returns nothing.',
          '',
          'The failure happens upstream, in template-permission resolution, which looks up the ' +
            'template by id and throws when nothing matches. That throw lands inside an ' +
            'observable pipeline stage and gets re-thrown during render, where it propagates to ' +
            'the nearest error boundary. The unresolvable-template story below shows the throw, ' +
            'caught by a local boundary so the page can render it.',
          '',
          "The same file handles a softer failure carefully: when an item's own initial value " +
            'fails to resolve, it deliberately stays creatable and defers the error to the ' +
            'editor, to avoid a misleading insufficient-permissions state for what is really a ' +
            'resolution failure. Resolution failures were thought about. The missing-template ' +
            'case three lines below throws unguarded.',
          '',
          'On the permissions branch: full denial requires that every template be ungranted. ' +
            'Three of four ungranted still renders the full menu, with the three disabled ' +
            'individually and explaining themselves through a tooltip. That is the right call. ' +
            'The all-or-nothing case next to it collapses to a single unlabelled disabled button ' +
            'that no longer says what would have been created.',
          '',
          'While permissions load, every item renders disabled and then flips once the request ' +
            'resolves. The tooltip can suppress itself during that wait, but the disabled styling ' +
            'is not suppressed.',
          '',
          '> **Why it matters:** documenting a claim, testing it, and finding it wrong is ' +
            "exactly what this catalog is for. The story disproved the page's own first draft, " +
            'and the finding underneath, that a bad template id crashes rather than quietly ' +
            'hides, is the more serious defect of the two.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:structure',
    'pattern:empty-state',
    'pattern:permission-gate',
    'audit:broken',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof PaneHeaderCreateButton>

/* ── Fixtures ──────────────────────────────────────────────────────────────
   The component's input is a list of `InitialValueTemplateItem`. It resolves each against the
   registered templates itself, so the fixture must NOT pre-resolve them: whether an item has a
   findable template is exactly the decision under study (the fixture rule). */

const tpl = (id: string, title: string, schemaType = id): InitialValueTemplateItem => ({
  id,
  templateId: id,
  title,
  schemaType,
  type: 'initialValueTemplateItem',
})

/** Matches the schema types the mock workspace registers, so these resolve for real. */
const AUTHOR = tpl('author', 'Author')
const BOOK = tpl('book', 'Book')

/**
 * The default mock workspace registers only `author`, so `book` has to be declared for the
 * multi-template branches to have anything true to work with.
 *
 * `author` is restated here deliberately. `WithStudioProviders` merges its `config` one level
 * deep, so supplying `schema` REPLACES the default `schema` wholesale rather than adding to its
 * `types`. Declaring only `book` silently removes `author`, and the resulting failure is the
 * same "template not found" throw this page is about, which makes it easy to mistake a broken
 * fixture for the behaviour under study. It cost one build to learn.
 */
const withBook = {
  config: {
    schema: {
      name: 'mock',
      types: [
        {
          name: 'author',
          title: 'Author',
          type: 'document',
          fields: [{name: 'name', title: 'Name', type: 'string'}],
        },
        {
          name: 'book',
          title: 'Book',
          type: 'document',
          fields: [{name: 'title', title: 'Title', type: 'string'}],
        },
      ],
    },
  },
} as Parameters<typeof WithStudioProviders>[0]

/**
 * Deliberately unregistered. Note that `schemaType` here is a real, valid type: the item looks
 * entirely well-formed. `getIntent` ignores this field and resolves through
 * `templates.find((t) => t.id === item.templateId)`, so only the `templateId` typo matters, and
 * nothing about the item's own shape hints at the problem.
 */
const TYPO = tpl('authorr', 'Author (typo in templateId)', 'author')

class TemplateErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props)
    this.state = {error: null}
  }
  static getDerivedStateFromError(error: Error) {
    return {error}
  }
  render() {
    if (this.state.error) {
      return (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>{this.state.error.message}</Text>
        </Card>
      )
    }
    return this.props.children
  }
}

function Frame({note, children}: {note: string; children: React.ReactNode}) {
  return (
    <Stack gap={3}>
      <Text size={1} muted>
        {note}
      </Text>
      <Card radius={2} shadow={1} padding={2} style={{maxWidth: 420}}>
        <Flex align="center" justify="space-between">
          <Text size={1} weight="medium">
            Authors
          </Text>
          {children}
        </Flex>
      </Card>
    </Stack>
  )
}

/** Line 108: exactly one template, so a direct button with no menu step. */
export const SingleTemplate: Story = {
  decorators: [WithStudioProviders(withBook)],
  render: () => (
    <Frame note="One template. The button goes straight to creating an Author, no menu in the way.">
      <PaneHeaderCreateButton templateItems={[AUTHOR]} />
    </Frame>
  ),
}

/**
 * Line 134: more than one, so a menu.
 *
 * Wrapped in `OverlayFrame` (stories/overlays/OverlayFrame.tsx), the org-standard containment
 * harness, because this is the docs-surface-only variant of ledger 167. `PaneHeaderCreateButton`
 * opens a `MenuButton` popover with no boundary of its own, so the available height it constrains
 * itself to is resolved against whatever ancestor it happens to find. On its own canvas that is
 * the document and everything is fine. Stacked into the autodocs page it collapsed.
 *
 * Measured on the two surfaces, clicking the same trigger. Canvas: `MenuButton__popover`
 * max-height 818.03px, `Menu` 74x78 with `scrollHeight` 78, nothing hidden. Docs page:
 * max-height 20.03px, `Menu` 74x20 with `scrollHeight` still 78, so 58px of a 78px menu sat
 * outside a box whose `overflow-y` is `auto`. Both items are 33px tall, which is why the page
 * showed a 20px sliver of "Author" and nothing of "Book" at all.
 *
 * `OverlayFrame`'s Card is `position: relative` and is both the portal target and the boundary
 * element, so the popover measures against a box that actually has room.
 */
export const MultipleTemplates: Story = {
  decorators: [WithStudioProviders(withBook)],
  render: () => (
    <OverlayFrame minHeight={220}>
      <Frame note="Two templates. Same affordance, now one click deeper.">
        <PaneHeaderCreateButton templateItems={[AUTHOR, BOOK]} />
      </Frame>
    </OverlayFrame>
  ),
}

/** Line 86: nothing to create. Renders null, so this frame is deliberately empty. */
export const NoTemplates: Story = {
  decorators: [WithStudioProviders(withBook)],
  render: () => (
    <Frame note="An empty template list. The button is not disabled, it is absent: the earliest return is a bare null.">
      <PaneHeaderCreateButton templateItems={[]} />
    </Frame>
  ),
}

/**
 * **The finding.** One template whose `templateId` matches nothing registered.
 *
 * This does not render an empty pane header, which is what this page originally claimed. It
 * throws: `templatePermissions.ts:85-87` cannot find the template and throws inside a `mergeMap`,
 * and `createHookFromObservableFactory.ts:70` re-throws that during render. The boundary below is
 * local to this story, so what you are looking at is the real error, caught close enough to show
 * it. In a studio the nearest boundary is much further out.
 *
 * The item itself looks entirely well formed. Its `schemaType` is a real registered type; only
 * `templateId` is wrong, and nothing about the object's shape hints at it.
 */
export const UnresolvableTemplate: Story = {
  decorators: [WithStudioProviders(withBook)],
  render: () => (
    <Frame note="One template with a mistyped id. What renders below is a caught render error, not an empty header.">
      <TemplateErrorBoundary>
        <PaneHeaderCreateButton templateItems={[TYPO]} />
      </TemplateErrorBoundary>
    </Frame>
  ),
}

/**
 * The same broken item with two good ones beside it. It throws just the same: the hook resolves
 * permissions for every item before the component decides anything, so one bad entry in a list of
 * three is not a shorter menu, it is the same failure.
 */
export const OneBadTemplateAmongThree: Story = {
  decorators: [WithStudioProviders(withBook)],
  render: () => (
    <Frame note="Three templates, one mistyped. The count does not soften it: the whole affordance fails, not one row of it.">
      <TemplateErrorBoundary>
        <PaneHeaderCreateButton templateItems={[AUTHOR, TYPO, BOOK]} />
      </TemplateErrorBoundary>
    </Frame>
  ),
}

/**
 * Line 88. Every template ungranted, so the whole affordance collapses to one disabled button
 * with an aria-label and a permissions tooltip. Note what is lost: with two templates granted you
 * could see what existed to create, and here you cannot.
 */
export const NoPermissionForAnything: Story = {
  decorators: [WithStudioProviders({...withBook, canCreateDocuments: false})],
  render: () => (
    <Frame note="Two templates, neither permitted. One disabled button, and no way to learn that Author and Book were the options.">
      <PaneHeaderCreateButton templateItems={[AUTHOR, BOOK]} />
    </Frame>
  ),
}

/**
 * The same permission denial with a single template. A different branch (line 108, with
 * `disabled` true) rather than the `nothingGranted` collapse, because `nothingGranted` also
 * requires `templatePermissions?.length !== 0`. Worth seeing that the one-template case keeps its
 * aria-label naming the type, which the all-denied case above does not.
 */
export const NoPermissionSingleTemplate: Story = {
  decorators: [WithStudioProviders({...withBook, canCreateDocuments: false})],
  render: () => (
    <Frame note="One template, not permitted. Disabled, but it still says what it would have created.">
      <PaneHeaderCreateButton templateItems={[AUTHOR]} />
    </Frame>
  ),
}

/**
 * Every outcome stacked, for the contact sheet.
 *
 * Each row gets its own boundary, because two of them throw. That is the honest picture: an
 * unresolvable template id is not a quieter version of an empty list, it is a different kind of
 * event, and putting them in one column is the clearest way to see that.
 */
export const AllBranches: Story = {
  decorators: [WithStudioProviders(withBook)],
  render: () => (
    <Stack gap={4}>
      <Text size={1} muted>
        Two of these rows render nothing and mean different things, and two throw. The empty list
        returns `null` by design. The mistyped ids do not reach the component at all: the
        permissions hook throws first, and what you see is that error caught locally.
      </Text>
      {[
        {label: 'one template', items: [AUTHOR]},
        {label: 'two templates', items: [AUTHOR, BOOK]},
        {label: 'empty list (returns null)', items: []},
        {label: 'unresolvable id (throws)', items: [TYPO]},
        {label: 'one bad among three (throws)', items: [AUTHOR, TYPO, BOOK]},
      ].map((row) => (
        <Flex key={row.label} align="center" gap={3}>
          <Text size={0} muted style={{minWidth: 220}}>
            {row.label}
          </Text>
          <TemplateErrorBoundary>
            <PaneHeaderCreateButton templateItems={row.items} />
          </TemplateErrorBoundary>
        </Flex>
      ))}
    </Stack>
  ),
}
