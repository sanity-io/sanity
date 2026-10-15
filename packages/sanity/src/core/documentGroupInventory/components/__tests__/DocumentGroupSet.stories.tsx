import {Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DocumentGroupEntry} from '../DocumentGroupEntry'
import {DocumentGroupSet} from '../DocumentGroupSet'
import {TextButton} from '../TextButton'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'
import {
  AGENT_VERSION,
  DRAFT,
  MOBILE_DRAFT,
  PUBLISHED,
  RELEASE_VERSION,
  RELEASES_BY_ID,
} from './DocumentGroupHarnessStory'

const noop = () => {}

/**
 * The document group inventory's set card and version rows, rendered from
 * fixture versions: published, draft, a release version, an agent bundle and a
 * variant draft, with the draft marked as the version being viewed.
 */
const meta = {
  title: 'Document Group Inventory/Document Group Set',
  component: DocumentGroupSet,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof DocumentGroupSet>

export default meta
type Story = StoryObj<typeof meta>

export const ReadOnly: Story = {
  args: {name: 'Default', children: null},
  render: () => (
    <VStack gap={5}>
      <DocumentGroupSet name="Default">
        <DocumentGroupEntry variant={PUBLISHED} releases={RELEASES_BY_ID} onPrimaryAction={noop} />
        <DocumentGroupEntry
          variant={DRAFT}
          releases={RELEASES_BY_ID}
          isSelected
          onPrimaryAction={noop}
        />
        <DocumentGroupEntry
          variant={RELEASE_VERSION}
          releases={RELEASES_BY_ID}
          onPrimaryAction={noop}
        />
        <DocumentGroupEntry
          variant={AGENT_VERSION}
          releases={RELEASES_BY_ID}
          onPrimaryAction={noop}
        />
      </DocumentGroupSet>
      <DocumentGroupSet name="Mobile">
        <DocumentGroupEntry
          variant={MOBILE_DRAFT}
          releases={RELEASES_BY_ID}
          onPrimaryAction={noop}
        />
      </DocumentGroupSet>
    </VStack>
  ),
}

export const Selectable: Story = {
  args: {name: 'Default', children: null},
  render: () => (
    <DocumentGroupSet
      name="Default"
      headerActions={
        <TextButton onClick={noop}>
          <Text size={1}>Select all 3</Text>
        </TextButton>
      }
    >
      <DocumentGroupEntry
        variant={PUBLISHED}
        releases={RELEASES_BY_ID}
        onPrimaryAction={noop}
        leading={<VariantCheckbox checked={false} readOnly />}
      />
      <DocumentGroupEntry
        variant={DRAFT}
        releases={RELEASES_BY_ID}
        isSelected
        onPrimaryAction={noop}
        leading={<VariantCheckbox checked readOnly />}
      />
      <DocumentGroupEntry
        variant={RELEASE_VERSION}
        releases={RELEASES_BY_ID}
        onPrimaryAction={noop}
        leading={<VariantCheckbox checked readOnly />}
      />
    </DocumentGroupSet>
  ),
}
