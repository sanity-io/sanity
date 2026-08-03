import {LayerProvider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ChangeFieldWrapper} from '../../../../packages/sanity/src/core/changeIndicators/ChangeFieldWrapper'
import {ChangeIndicator} from '../../../../packages/sanity/src/core/changeIndicators/ChangeIndicator'
import {ChangeIndicatorsTracker} from '../../../../packages/sanity/src/core/changeIndicators/tracker'
import {ChangeSide, FieldSide} from './changeIndicatorHarness'

/**
 * `ChangeIndicator` is the real public entry point of `core/changeIndicators`, the module the
 * whole subsystem and this chapter is named after. It is not on the brief's list of 17 (that
 * list names a module-local `ChangeBarWrapper` from the same file instead, see below), so this
 * page exists to close that gap rather than to duplicate `ChangeBarWrapper`'s page.
 *
 * `ChangeIndicator.tsx` declares a SECOND, unexported `ChangeBarWrapper` (`const ChangeBarWrapper
 * = memo(function ChangeBarWrapper(...))`, no `export` keyword). `ChangeIndicator` is the only
 * thing this file exports, and it renders that module-local wrapper directly. The brief's
 * `ChangeBarWrapper` is storied on its own page, but it is the DIFFERENT, exported
 * `ChangeBarWrapper` from `ElementWithChangeBar.styled.tsx`, a plain styled `<div>` with no
 * tracking logic. This page is the only place the module-local wrapper's actual behaviour
 * (registering a field-side reporter keyed by path, folding in focus and hover) can be shown,
 * since it cannot be imported directly.
 */
const meta: Meta<typeof ChangeIndicator> = {
  title: 'Document Pane/Change Indicators/ChangeIndicator',
  component: ChangeIndicator,
  parameters: {
    docs: {
      description: {
        component: [
          'Every changed field in a Studio form renders inside this wrapper. It draws the ' +
            'vertical bar and registers the field with a tracker, so the review-changes panel, ' +
            'elsewhere on the page, can find it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ChangeIndicator.tsx` |',
          '| Tier | SERVICE. Surfacing what changed enriches editing; it is not the act of editing itself |',
          '| Counterpart | ChangeFieldWrapper, the matching diff row in the review-changes panel |',
          '',
          'This is the field-side half of a pair. Its counterpart draws the matching row, and the ' +
            'connector overlay draws the line between the two whenever this side has focus or ' +
            'hover. None of that coordination is visible from this component mounted alone, only ' +
            'from mounting both sides together.',
          '',
          '> **Why it matters:** the in-context story pairs the form field with the review-changes ' +
            'row for the same path, the way a document pane actually does. Neither one draws the ' +
            'connecting line; that belongs to a third component, shown on its own page.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
  decorators: [
    (Story) => (
      <LayerProvider>
        <ChangeIndicatorsTracker>
          <Story />
        </ChangeIndicatorsTracker>
      </LayerProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ChangeIndicator>

/**
 * `isChanged: false`. `ElementWithChangeBar`'s bar renders `null` when `disabled || !isChanged`
 * (`ElementWithChangeBar.tsx:38`), so the field renders with no bar at all, identical to a plain
 * field.
 */
export const Unchanged: Story = {
  render: () => (
    <FieldSide path={['title']} label="Title" value="Quarterly Planning Review" isChanged={false} />
  ),
}

/**
 * `isChanged: true`, `hasFocus: false`. The default resting state: a dimmed change bar (0.5
 * opacity, see `ElementWithChangeBar.css.ts`'s `changeBarWrapper &::after` rule) is present but
 * unobtrusive.
 */
export const Changed: Story = {
  render: () => (
    <FieldSide path={['title']} label="Title" value="Quarterly Planning Review, revised" />
  ),
}

/**
 * `hasFocus: true`. The bar's `::after` marker goes to full opacity
 * (`changeBarWrapperFocused &::after`, `ElementWithChangeBar.css.ts`). This is also the state
 * this catalog uses to drive the connector harness on the `ConnectorsOverlay` and
 * `ChangeConnectorRoot` pages, since it reaches the review panel without simulating a hover.
 */
export const ChangedAndFocused: Story = {
  render: () => (
    <FieldSide path={['title']} label="Title" value="Quarterly Planning Review, revised" hasFocus />
  ),
}

/**
 * The field side and the review-panel side of the SAME path, mounted together, the way
 * `DocumentLayout` actually pairs them: the form on the left, `ChangesTabs`' `ChangesInspector`
 * on the right. Neither one draws the connector between them; that is `ConnectorsOverlay`'s job,
 * shown on its own page.
 */
export const InContext: Story = {
  render: () => (
    <Stack gap={4} style={{maxWidth: 420}}>
      <Text size={1} muted>
        Form field (left pane)
      </Text>
      <FieldSide path={['title']} label="Title" value="Quarterly Planning Review, revised" />
      <Text size={1} muted>
        Review changes panel (right pane)
      </Text>
      <ChangeSide
        path={['title']}
        from="Quarterly Planning Review"
        to="Quarterly Planning Review, revised"
      />
    </Stack>
  ),
}
