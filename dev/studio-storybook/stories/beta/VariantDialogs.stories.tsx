import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DeleteVariantDialog} from '../../../../packages/sanity/src/core/variants/components/dialog/DeleteVariantDialog'
import {EditVariantDialog} from '../../../../packages/sanity/src/core/variants/components/dialog/EditVariantDialog'
import {getVariantTitle} from '../../../../packages/sanity/src/core/variants/tool/util'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStudioProviders} from '../../lib/testProvider'
import {fixtureVariants} from '../../lib/variantsFixtures'

const noop = () => undefined

const meta: Meta = {
  title: 'Versioning/Variant Dialogs',
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'A variant is a rule rather than a piece of content, a set of conditions deciding which ' +
            'readers see which version of a document, and that makes changing one unlike editing ' +
            'anything else in the studio.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/variants/components/dialog/` |',
          '| Tier | SERVICE |',
          '| Patterns | `destructive-confirmation` |',
          '',
          'Versioning/Variants already stories the create dialog and the tool. These are the two the ' +
            'board flagged as gaps: edit its definition, or delete it.',
          '',
          '`EditVariantDialog` reuses the same `VariantDialog` form the create flow uses, seeded from ' +
            'the existing definition, which is the right call: the thing being edited is the same ' +
            'shape as the thing that was created, and a separate edit form would be an opportunity ' +
            'for the two to drift.',
          '',
          '`DeleteVariantDialog` is the sharper one. Deleting a variant does not delete the documents ' +
            'written against it; it removes the rule that routed readers to them. The dialog names ' +
            'the variant it is about to remove, because "delete variant?" with no name is exactly the ' +
            'confirmation people click through.',
          '',
          '> **Why it matters:** editing a variant changes every document it already applies to, ' +
            'immediately, with no draft state to preview the effect first. Treat an edit like a rule ' +
            'change, not a content edit.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:destructive-confirmation',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const Edit: Story = {
  name: 'EditVariantDialog',
  parameters: {
    docs: {
      description: {
        story:
          'The edit form, seeded from an existing variant. It is the same `VariantDialog` the create flow mounts, with `toEditableVariant` mapping the stored definition back into editable shape - so anything you can express when creating a variant you can also express when editing one, by construction rather than by discipline.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <EditVariantDialog variant={fixtureVariants[0]} onCancel={noop} onSubmit={noop} />
    ),
}

export const Delete: Story = {
  name: 'DeleteVariantDialog',
  parameters: {
    docs: {
      description: {
        story:
          'The delete confirmation, naming the variant. `variantTitle` is a required prop rather than optional, which is a small piece of enforcement worth noticing: the component will not let a caller render an unnamed destructive confirmation.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <DeleteVariantDialog
        isDeleting={false}
        variantTitle={fixtureVariants[0] ? getVariantTitle(fixtureVariants[0]) : 'UK English'}
        onClose={noop}
        onConfirm={noop}
      />
    ),
}

export const Deleting: Story = {
  name: 'DeleteVariantDialog - deleting',
  parameters: {
    docs: {
      description: {
        story:
          'Mid-delete. The confirm goes to a loading state and the dialog stays open, which is the honest rendering: the variant still exists until the operation returns, and closing early would claim otherwise.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <DeleteVariantDialog
        isDeleting
        variantTitle={fixtureVariants[0] ? getVariantTitle(fixtureVariants[0]) : 'UK English'}
        onClose={noop}
        onConfirm={noop}
      />
    ),
}
