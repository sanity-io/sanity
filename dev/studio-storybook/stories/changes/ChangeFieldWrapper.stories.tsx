import {Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {ChangeFieldWrapper} from '../../../../packages/sanity/src/core/changeIndicators/ChangeFieldWrapper'
import {ChangeIndicatorsTracker} from '../../../../packages/sanity/src/core/changeIndicators/tracker'
import {ChangeSide, FieldSide} from './changeIndicatorHarness'

/**
 * `ChangeFieldWrapper` draws the bar that wraps each diff row in the review-changes panel. It is
 * the change-side counterpart to `ChangeIndicator`'s field-side wrapper: same tracker, same path
 * key, opposite pane.
 */
const meta: Meta<typeof ChangeFieldWrapper> = {
  title: 'Document Pane/Change Indicators/ChangeFieldWrapper',
  component: ChangeFieldWrapper,
  parameters: {
    docs: {
      description: {
        component: [
          'Every diff row in the review-changes panel reports itself as changed, unconditionally. ' +
            'There is no prop to say otherwise, because the one place this wrapper mounts never ' +
            'wraps anything that is not a real change.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ChangeFieldWrapper.tsx` |',
          '| Tier | SERVICE |',
          '| Counterpart | `ChangeIndicator`, the same wrapper on the field side |',
          '',
          'It registers a change-side reporter under the same path the field-side counterpart ' +
            'uses, and forwards a click to the review-changes context so clicking a diff can jump ' +
            'the form straight to that field.',
          '',
          'Because `isChanged` is hard-coded true with no prop to override it, this page cannot ' +
            'demonstrate an unchanged state; that branch belongs to the field side, not here.',
          '',
          '> **Why it matters:** the click handler stops its own event from propagating, so ' +
            "clicking one diff never also triggers a parent diff's handler. The click-focus story " +
            'below supplies a real context value and prints the path it receives, so that claim is ' +
            'evidence, not assertion.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
  decorators: [
    (Story) => (
      <ChangeIndicatorsTracker>
        <Story />
      </ChangeIndicatorsTracker>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ChangeFieldWrapper>

/**
 * The plain diff row: `children` is the fixture's own input (the diff renderer, e.g.
 * `DiffFromTo`, is what would actually produce it in a real panel; here it is a literal string
 * pair, per the fixture rule, since `ChangeFieldWrapper` itself only renders whatever it is
 * handed).
 */
export const Default: Story = {
  render: () => (
    <ChangeSide
      path={['title']}
      from="Quarterly Planning Review"
      to="Quarterly Planning Review, revised"
    />
  ),
}

/**
 * `hasRevertHover: true`. Read from the wrapper's own reporter snapshot
 * (`ChangeFieldWrapper.tsx:56`) and consumed downstream by `ConnectorsOverlay`'s `ConnectorPair`
 * to flag the connector as mid-revert; it changes no styling on `ChangeFieldWrapper` itself.
 */
export const WithRevertHover: Story = {
  render: () => (
    <ChangeSide
      path={['title']}
      from="Quarterly Planning Review"
      to="Quarterly Planning Review, revised"
      hasRevertHover
    />
  ),
}

/**
 * `onClick` calls `onSetFocus(path)` off `ReviewChangesContext`, after `event.stopPropagation()`
 * (`ChangeFieldWrapper.tsx:67-72,92-98`) so it does not also trigger a parent diff's own
 * `onClick`. This story supplies a REAL context value and prints the path it receives, so the
 * click is evidence of behaviour rather than an assertion in prose. Click the diff card below.
 */
export const ClickCallsOnSetFocus: Story = {
  render: function Render() {
    const [lastFocused, setLastFocused] = useState<string>('(none yet, click the card)')
    return (
      <ReviewChangesContext.Provider
        value={{
          isReviewChangesOpen: true,
          onOpenReviewChanges: () => undefined,
          onSetFocus: (path) => setLastFocused(JSON.stringify(path)),
        }}
      >
        <Stack gap={3} style={{maxWidth: 420}}>
          <ChangeSide
            path={['title']}
            from="Quarterly Planning Review"
            to="Quarterly Planning Review, revised"
          />
          <Text size={1} muted>
            onSetFocus last called with: <code>{lastFocused}</code>
          </Text>
        </Stack>
      </ReviewChangesContext.Provider>
    )
  },
}

/**
 * The change side and the field side of the same path, mounted together the way the real
 * document pane pairs them. Same fixture as `ChangeIndicator`'s `InContext` story, viewed from
 * the changes-panel side.
 */
export const InContext: Story = {
  render: () => (
    <Stack gap={4} style={{maxWidth: 420}}>
      <Text size={1} muted>
        Review changes panel
      </Text>
      <ChangeSide
        path={['title']}
        from="Quarterly Planning Review"
        to="Quarterly Planning Review, revised"
      />
      <Text size={1} muted>
        Form field
      </Text>
      <FieldSide path={['title']} label="Title" value="Quarterly Planning Review, revised" />
    </Stack>
  ),
}
