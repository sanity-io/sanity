import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FieldWrapper} from '../../../../packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled'

/**
 * `FieldWrapper` is the smallest component in this chapter: `flex-grow: 1; min-width: 0`, and
 * nothing else. Its whole job is making the field content claim the remaining row width inside
 * `ChangeBarWrapper`'s flex layout, leaving a fixed strip for the change bar.
 */
const meta: Meta<typeof FieldWrapper> = {
  title: 'Document Pane/Change Indicators/FieldWrapper',
  component: FieldWrapper,
  parameters: {
    docs: {
      description: {
        component: [
          'The smallest component in this family does exactly one thing: it claims the remaining ' +
            "width of the change-bar row, so the field's own content has somewhere to grow into.",
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Layout | `flex-grow: 1; min-width: 0` |',
          '',
          '> **Why it matters:** the minimum width is doing real work, not decoration. Without it, ' +
            'a flex child with long unbreakable content, a long field title, an inline code value, ' +
            'refuses to shrink below its own intrinsic width and pushes the change bar out of the ' +
            'row instead of wrapping. The long-content story below is that failure averted.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof FieldWrapper>

/** A short value: the wrapper claims the row, nothing interesting to see. */
export const ShortContent: Story = {
  render: () => (
    <div style={{display: 'flex', width: 220, border: '1px dashed var(--card-border-color)'}}>
      <FieldWrapper>
        <Card padding={2}>
          <Text size={1}>Title</Text>
        </Card>
      </FieldWrapper>
      <div style={{width: 16, flexShrink: 0, background: 'var(--card-badge-caution-dot-color)'}} />
    </div>
  ),
}

/**
 * A long, unbroken value in a narrow row: `min-width: 0` lets `FieldWrapper` shrink and the text
 * wraps instead of overflowing the fixed change-bar strip on the right.
 */
export const LongUnbreakableContent: Story = {
  render: () => (
    <div style={{display: 'flex', width: 220, border: '1px dashed var(--card-border-color)'}}>
      <FieldWrapper>
        <Card padding={2}>
          <Text size={1}>ThisIsOneVeryLongUnbrokenValueWithNoSpacesToWrapOn</Text>
        </Card>
      </FieldWrapper>
      <div style={{width: 16, flexShrink: 0, background: 'var(--card-badge-caution-dot-color)'}} />
    </div>
  ),
}

/** As it appears assembled inside `ElementWithChangeBar`: see that page for the full composition. */
export const InContext: Story = {
  render: () => (
    <div style={{display: 'flex', width: 320, border: '1px dashed var(--card-border-color)'}}>
      <FieldWrapper>
        <Card padding={2} border radius={2}>
          <Text size={1}>Title field, as it appears in a real form row</Text>
        </Card>
      </FieldWrapper>
      <div style={{width: 16, flexShrink: 0}} />
    </div>
  ),
}
