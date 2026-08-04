import {DocumentIcon} from '@sanity/icons/Document'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NewDocumentButton} from '../../../../packages/sanity/src/core/studio/components/navbar/new-document/NewDocumentButton'
import {type NewDocumentOption} from '../../../../packages/sanity/src/core/studio/components/navbar/new-document/types'
import {NavbarProviders, NavbarStoryFrame} from '../../lib/navbarHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const studioConfig = {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}}

// The button is presentational: its parent (`useNewDocumentOptions`) does the schema + permission
// work and hands it a ready list. So we supply fixture options directly.
// oxlint-disable-next-line no-unsafe-type-assertion -- fixture options; only the fields the button reads are set
const options = [
  {
    id: 'article',
    templateId: 'article',
    schemaType: 'article',
    title: 'Article',
    hasPermission: true,
    icon: DocumentIcon,
  },
  {
    id: 'author',
    templateId: 'author',
    schemaType: 'author',
    title: 'Author',
    hasPermission: true,
    icon: DocumentIcon,
  },
  {
    id: 'page',
    templateId: 'page',
    schemaType: 'page',
    title: 'Landing page',
    hasPermission: true,
    icon: DocumentIcon,
  },
] as unknown as NewDocumentOption[]

// `CannotCreate` needs a genuinely permission-denied option set, not an empty one - see the
// docblock's note on tooltip ordering for why an empty array does not reach this state at all.
// oxlint-disable-next-line no-unsafe-type-assertion -- fixture options; only the fields the button reads are set
const deniedOptions = [
  {
    id: 'article',
    templateId: 'article',
    schemaType: 'article',
    title: 'Article',
    hasPermission: false,
    icon: DocumentIcon,
  },
  {
    id: 'author',
    templateId: 'author',
    schemaType: 'author',
    title: 'Author',
    hasPermission: false,
    icon: DocumentIcon,
  },
] as unknown as NewDocumentOption[]

const meta: Meta = {
  title: 'Navbar & Shell/New Document Button',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    layout: 'fullscreen',
    // Every story fixes canCreateDocument/loading/options to demonstrate one specific state;
    // a live controls panel would let a reader break the fixture out of that combination.
    controls: {include: []},
    docs: {
      description: {
        component: [
          "NewDocumentButton is the navbar's create affordance, the plus that opens the list of " +
            'document types an author can start. It is deliberately presentational: the schema ' +
            'walk, the permission checks, and the sort all happen upstream, and the button just ' +
            'renders the resulting list and its empty, loading, and no-permission states.',
          '',
          '|        |                                                                                        |',
          '| ------ | -------------------------------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/components/navbar/new-document/NewDocumentButton.tsx` |',
          '| Tier   | CHROME, the entry point to creating, not the creation                                  |',
          '',
          '> **Why it matters:** separating the button from the hook that computes its options ' +
            'is the pattern here. The story feeds it fixture options, so the states (has options, ' +
            'loading, cannot create) are each addressable without a live schema.',
          '',
          '**Tooltip ordering, read from the source** (`tooltipContent`, L177-189). The check ' +
            'is `!hasNewDocumentOptions` first, `canCreateDocument` second: an empty `options` ' +
            'array always yields the "No document types" tooltip, no matter what ' +
            '`canCreateDocument` says, because the permission branch is never reached. To ' +
            'actually show the insufficient-permissions tooltip, `options` must be non-empty ' +
            '(declared types exist) and `canCreateDocument` must be `false` (the person is ' +
            'granted none of them); an empty array is not a stand-in for that, it is a different ' +
            'situation entirely. `CannotCreate` below was fixed to reflect this: it now passes ' +
            'populated, all-`hasPermission: false` options rather than `[]`.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:navbar', 'pattern:document-creation', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'With document types',
  render: () => (
    <NavbarProviders>
      <NavbarStoryFrame align="end">
        <NewDocumentButton canCreateDocument loading={false} modal="popover" options={options} />
      </NavbarStoryFrame>
    </NavbarProviders>
  ),
}

export const Loading: Story = {
  name: 'Loading',
  render: () => (
    <NavbarProviders>
      <NavbarStoryFrame align="end">
        <NewDocumentButton canCreateDocument loading modal="popover" options={[]} />
      </NavbarStoryFrame>
    </NavbarProviders>
  ),
}

/**
 * Declared types exist (`options` is non-empty) but the person is granted none of them
 * (`canCreateDocument={false}`, every option `hasPermission: false`). This is the only prop
 * combination that reaches the insufficient-permissions tooltip; `options={[]}` does not; see
 * the docblock's note on tooltip ordering.
 */
export const CannotCreate: Story = {
  name: 'No create permission',
  render: () => (
    <NavbarProviders>
      <NavbarStoryFrame align="end">
        <NewDocumentButton
          canCreateDocument={false}
          loading={false}
          modal="popover"
          options={deniedOptions}
        />
      </NavbarStoryFrame>
    </NavbarProviders>
  ),
}

/**
 * `options={[]}`: no declared types at all. This is what an empty array actually means, and it
 * is a configuration problem, not a permissions one - the tooltip says "No document types"
 * regardless of `canCreateDocument`, which is why the prop's value here does not change what
 * renders. Set to `false` anyway for internal consistency: with nothing declared, upstream
 * `useNewDocumentOptions` could never compute `canCreateDocument: true` for real.
 */
export const NoDocumentTypesDeclared: Story = {
  name: 'No document types declared',
  render: () => (
    <NavbarProviders>
      <NavbarStoryFrame align="end">
        <NewDocumentButton canCreateDocument={false} loading={false} modal="popover" options={[]} />
      </NavbarStoryFrame>
    </NavbarProviders>
  ),
}
