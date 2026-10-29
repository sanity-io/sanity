import {type ReleaseDocument} from '@sanity/client'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Box} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {type Variant} from '../../machines/selectionMachine'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'

const NOOP = () => undefined
const PUBLISHED_ID = 'story-document-group'
const GROUP = {_ref: PUBLISHED_ID, _weak: true} as const

function variant(
  id: string,
  name: string,
  system: Partial<Variant['document']['_system']> = {},
  releaseDocument?: ReleaseDocument,
): Variant {
  return {
    id,
    name,
    releaseDocument,
    document: {
      _id: id,
      _rev: 'rev',
      _createdAt: '2026-01-01T00:00:00.000Z',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      _type: 'article',
      _system: {group: GROUP, ...system},
    },
  }
}

const PUBLISHED = variant(PUBLISHED_ID, 'Published')
const DRAFT = variant(`drafts.${PUBLISHED_ID}`, 'Draft', {bundleId: 'drafts'})
const IN_ASAP_RELEASE = variant(
  `versions.${activeASAPRelease.name}.${PUBLISHED_ID}`,
  activeASAPRelease.metadata.title,
  {bundleId: activeASAPRelease.name, release: {_ref: activeASAPRelease._id, _weak: true}},
  activeASAPRelease,
)
// Resolved through the `releases` map rather than an attached release document.
const IN_SCHEDULED_RELEASE = variant(
  `versions.${activeScheduledRelease.name}.${PUBLISHED_ID}`,
  activeScheduledRelease.metadata.title,
  {
    bundleId: activeScheduledRelease.name,
    release: {_ref: activeScheduledRelease._id, _weak: true},
  },
)
const AGENT = variant(`versions.agent-story.${PUBLISHED_ID}`, 'Agent draft', {
  bundleId: 'agent-story',
})

const RELEASES = new Map<string, ReleaseDocument>([
  [activeScheduledRelease._id, activeScheduledRelease],
])

/**
 * Chromatic sentinel for the shared document group set chrome
 * (`DocumentGroupSet`) and the per-version row (`DocumentGroupEntry`) that the
 * inventory and the version picker both render: the published, draft, release
 * and agent avatars, the "editing" badge and the optional leading selection
 * control.
 */
const meta = {
  title: 'Document Group Inventory/Document Group Set',
  component: DocumentGroupSet,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Box style={{width: 360}}>
          <Story />
        </Box>
      </TestWrapper>
    ),
  ],
  args: {
    name: 'All users (Default)',
    children: null,
    selectedIds: new Set(),
    checked: false,
    onCheckedChange: NOOP,
  },
} satisfies Meta<typeof DocumentGroupSet>

export default meta

type Story = StoryObj<typeof meta>

export const Picker: Story = {
  args: {
    readOnly: true,
    children: (
      <>
        <DocumentGroupEntry variant={PUBLISHED} releases={RELEASES} onPrimaryAction={NOOP} />
        <DocumentGroupEntry variant={DRAFT} releases={RELEASES} isSelected onPrimaryAction={NOOP} />
        <DocumentGroupEntry variant={IN_ASAP_RELEASE} releases={RELEASES} onPrimaryAction={NOOP} />
        <DocumentGroupEntry
          variant={IN_SCHEDULED_RELEASE}
          releases={RELEASES}
          onPrimaryAction={NOOP}
        />
        <DocumentGroupEntry variant={AGENT} releases={RELEASES} onPrimaryAction={NOOP} />
      </>
    ),
  },
}

const SELECTABLE_VARIANTS = [PUBLISHED, DRAFT, IN_ASAP_RELEASE]

/**
 * The rows the inventory renders for {@link SELECTABLE_VARIANTS}, mirroring
 * `ManagedVariantRow`: every checkbox is revealed once anything is selected.
 */
function selectableRows(selectedIds: ReadonlySet<string>) {
  return SELECTABLE_VARIANTS.map((entry) => (
    <DocumentGroupEntry
      key={entry.id}
      variant={entry}
      releases={RELEASES}
      isSelected={entry === DRAFT}
      leading={
        <VariantCheckbox
          data-visible={selectedIds.size !== 0}
          checked={selectedIds.has(entry.id)}
          onChange={NOOP}
        />
      }
      onPrimaryAction={NOOP}
    />
  ))
}

const NOTHING_SELECTED = new Set<string>()
const PUBLISHED_SELECTED = new Set([PUBLISHED.id])

/** Nothing selected: the checkboxes stay hidden and the set shows its release avatar. */
export const Selectable: Story = {
  args: {
    name: activeASAPRelease.metadata.title,
    bundle: {type: 'perspective', perspective: activeASAPRelease},
    selectedIds: NOTHING_SELECTED,
    children: selectableRows(NOTHING_SELECTED),
  },
}

/** Part of the set selected: every checkbox, the set's included, is revealed. */
export const PartiallySelected: Story = {
  args: {
    name: activeASAPRelease.metadata.title,
    bundle: {type: 'perspective', perspective: activeASAPRelease},
    selectedIds: PUBLISHED_SELECTED,
    children: selectableRows(PUBLISHED_SELECTED),
  },
}
