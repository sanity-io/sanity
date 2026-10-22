import {type ReleaseDocument} from '@sanity/client'
import {Text} from '@sanity/ui'
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
import {TextButton} from '../TextButton'
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
 * and agent avatars, the "viewing" badge and the optional leading selection
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
  args: {name: 'All users (Default)', children: null},
} satisfies Meta<typeof DocumentGroupSet>

export default meta

type Story = StoryObj<typeof meta>

export const Picker: Story = {
  args: {
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

export const Selectable: Story = {
  args: {
    name: 'Summer sale',
    headerActions: (
      <TextButton onClick={NOOP}>
        <Text size={1}>Select all 3</Text>
      </TextButton>
    ),
    children: (
      <>
        <DocumentGroupEntry
          variant={PUBLISHED}
          releases={RELEASES}
          leading={<VariantCheckbox checked readOnly />}
          onPrimaryAction={NOOP}
        />
        <DocumentGroupEntry
          variant={DRAFT}
          releases={RELEASES}
          isSelected
          leading={<VariantCheckbox checked={false} readOnly />}
          onPrimaryAction={NOOP}
        />
        <DocumentGroupEntry
          variant={IN_ASAP_RELEASE}
          releases={RELEASES}
          leading={<VariantCheckbox checked={false} readOnly />}
          onPrimaryAction={NOOP}
        />
      </>
    ),
  },
}
