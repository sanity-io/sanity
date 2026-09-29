import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Container} from '../Container'
import {SelectBundle} from '../CreateVariant/SelectBundle'
import {SelectVariantDefinition} from '../CreateVariant/SelectVariantDefinition'
import {
  type DocumentGroupHarnessOptions,
  MOBILE_VARIANT,
  PARTNER_VARIANT,
  useDocumentGroupHarness,
} from './DocumentGroupHarnessStory'

function SelectVariantDefinitionHarness() {
  const {variantCreationRef} = useDocumentGroupHarness({activate: 'variantCreation'})

  return (
    <Card border radius={3} style={{display: 'inline-block'}}>
      <Container>
        <SelectVariantDefinition variantCreationRef={variantCreationRef} />
      </Container>
    </Card>
  )
}

function SelectBundleHarness(options: Pick<DocumentGroupHarnessOptions, 'selectedVariantId'>) {
  const {variantCreationRef, selectionRef} = useDocumentGroupHarness({
    activate: 'variantCreation',
    selectedVariantId: options.selectedVariantId,
  })

  return (
    <Card border radius={3} style={{display: 'inline-block'}}>
      <Container>
        <SelectBundle variantCreationRef={variantCreationRef} selectionRef={selectionRef} />
      </Container>
    </Card>
  )
}

/**
 * The two steps of the inventory's "Create variant" flow. The variant creation
 * machine is spawned by a harness parent with the variants and releases stores
 * replaced by fixtures, and put in its `active` state before the first render.
 */
const meta = {
  title: 'Document Group Inventory/Create Variant',
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const VariantDefinitions: Story = {
  render: () => <SelectVariantDefinitionHarness />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Create variant')).toBeVisible(), {timeout: 3000})
    await waitFor(() => expect(canvas.getByRole('button', {name: 'Mobile'})).toBeVisible())
    await waitFor(() => expect(canvas.getByRole('button', {name: 'Partner portal'})).toBeVisible())
  },
}

/** No version of this variant exists yet, so every target is offered. */
export const BundlesForNewVariant: Story = {
  render: () => <SelectBundleHarness selectedVariantId={PARTNER_VARIANT._id} />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(
      () => expect(canvas.getByText('Create variant for Partner portal')).toBeVisible(),
      {timeout: 3000},
    )
    await waitFor(() => expect(canvas.getByText('As a draft')).toBeVisible())
    await waitFor(() => expect(canvas.getByText('Into a release')).toBeVisible())
    await waitFor(() =>
      expect(canvas.getByRole('button', {name: 'active asap Release'})).toBeVisible(),
    )
    await waitFor(() =>
      expect(canvas.getByRole('button', {name: 'undecided Release'})).toBeVisible(),
    )
  },
}

/** A draft of this variant already exists: it is listed instead of "As a draft". */
export const BundlesWithExistingVariant: Story = {
  render: () => <SelectBundleHarness selectedVariantId={MOBILE_VARIANT._id} />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Create variant for Mobile')).toBeVisible(), {
      timeout: 3000,
    })
    await expect(canvas.queryByText('As a draft')).toBeNull()
    await waitFor(() => expect(canvas.getByText('Or view existing variants')).toBeVisible())
  },
}
