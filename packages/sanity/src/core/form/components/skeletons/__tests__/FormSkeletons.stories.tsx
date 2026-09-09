import {Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {FormBlockSkeleton} from '../FormBlockSkeleton'
import {FormFieldSkeleton} from '../FormFieldSkeleton'
import {FormInlineSkeleton} from '../FormInlineSkeleton'
import {FormInputSkeleton} from '../FormInputSkeleton'
import {FormItemSkeleton} from '../FormItemSkeleton'

const TEXT_BLOCK = {
  _type: 'block',
  _key: 'a',
  children: [{_type: 'span', _key: 'a1', text: 'A paragraph', marks: []}],
  markDefs: [],
}

const OBJECT_BLOCK = {_type: 'image', _key: 'b'}

/**
 * The placeholders form middleware sites show while a lazy input, field, item, block, inline
 * object or annotation component loads, one per kind. Each stands in for the component it
 * precedes, so the row it occupies keeps its height when the real component mounts. Rendered
 * inside `TestWrapper` because the item placeholder's preview resolves its label through the
 * studio i18n instance.
 */
const meta = {
  title: 'Form/Skeletons',
  component: FormFieldSkeleton,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof FormFieldSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Kinds: Story = {
  render: () => (
    <Stack gap={5} style={{maxWidth: 480}}>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          input
        </Text>
        <FormInputSkeleton />
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          field
        </Text>
        <FormFieldSkeleton />
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          item
        </Text>
        <FormItemSkeleton />
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          text block
        </Text>
        <FormBlockSkeleton value={TEXT_BLOCK} />
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          object block
        </Text>
        <FormBlockSkeleton value={OBJECT_BLOCK} />
      </Stack>
      <Stack gap={2}>
        <Text muted size={1} weight="medium">
          inline object or annotation
        </Text>
        <Text>
          Text before <FormInlineSkeleton /> and after the placeholder.
        </Text>
      </Stack>
    </Stack>
  ),
}
