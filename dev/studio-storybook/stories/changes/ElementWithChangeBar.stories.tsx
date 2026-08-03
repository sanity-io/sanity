import {Card, Flex, LayerProvider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {ElementWithChangeBar} from '../../../../packages/sanity/src/core/changeIndicators/ElementWithChangeBar'

function Field({label, value}: {label: string; value: string}) {
  return (
    <Card padding={3} radius={2} border>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          {label}
        </Text>
        <Text size={1}>{value}</Text>
      </Stack>
    </Card>
  )
}

/**
 * `ElementWithChangeBar` is the assembly point: it decides whether a bar is drawn at all
 * (`disabled || !isChanged` renders no bar, `ElementWithChangeBar.tsx:38`), and composes
 * `ChangeBarWrapper`, `FieldWrapper`, `ChangeBar`, `ChangeBarMarker` and `ChangeBarButton`
 * (all from `ElementWithChangeBar.styled.tsx`, each storied separately) into the thing an editor
 * actually sees. `ChangeIndicator`'s module-local wrapper renders this directly.
 */
const meta: Meta<typeof ElementWithChangeBar> = {
  title: 'Document Pane/Change Indicators/ElementWithChangeBar',
  component: ElementWithChangeBar,
  parameters: {
    docs: {
      description: {
        component: [
          'This is the assembly point: it decides whether a bar is drawn at all, and composes the ' +
            'wrapper, the marker, and the click target into the one thing an editor actually sees. ' +
            'The field-side entry point elsewhere mounts this component directly.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.tsx` |',
          '| Tier | SERVICE |',
          '| No bar renders when | disabled, or not changed |',
          '',
          'This is the field-side bar itself, the vertical mark and its click target, without the ' +
            'path-tracking machinery wrapped around it elsewhere.',
          '',
          '> **Why it matters:** what looks like one bar brightening on hover is actually two ' +
            'different opacity rules stacking on the same spot. The visible marker sits dimmed by ' +
            'default and only reaches full opacity on focus, never on hover alone. The click ' +
            'target underneath is separately invisible at rest and only fades in on hover. Two ' +
            'rules, two triggers, one physical location.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
  // ElementWithChangeBar calls useLayer() unconditionally to get the z-index for its bar, and
  // useLayer throws "missing context value" rather than falling back to a default. In Studio the
  // provider is always somewhere above; mounted on its own it is not, so every story here needs
  // it. Nothing in the component's props or types says so.
  decorators: [
    (Story) => (
      <LayerProvider>
        <Story />
      </LayerProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ElementWithChangeBar>

/** `isChanged: false`. No bar renders at all: `changeBar` memoises to `null`. */
export const NotChanged: Story = {
  render: () => (
    <ElementWithChangeBar isChanged={false} hasFocus={false}>
      <Field label="Title" value="Quarterly Planning Review" />
    </ElementWithChangeBar>
  ),
}

/** `isChanged: true`, `hasFocus: false`. The resting state: a dimmed bar, an invisible button. */
export const Changed: Story = {
  render: () => (
    <ElementWithChangeBar isChanged hasFocus={false}>
      <Field label="Title" value="Quarterly Planning Review, revised" />
    </ElementWithChangeBar>
  ),
}

/** `hasFocus: true`. The bar's marker reaches full opacity. */
export const ChangedAndFocused: Story = {
  render: () => (
    <ElementWithChangeBar isChanged hasFocus>
      <Field label="Title" value="Quarterly Planning Review, revised" />
    </ElementWithChangeBar>
  ),
}

/**
 * `disabled: true`. The bar renders `null` (same guard as `NotChanged`) and the marker's
 * `::after` is set `display: none` besides (`changeBarWrapperDisabled &::after`), belt and
 * braces against the same visual outcome from two different rules.
 */
export const Disabled: Story = {
  render: () => (
    <ElementWithChangeBar isChanged disabled hasFocus>
      <Field label="Title" value="Quarterly Planning Review, revised" />
    </ElementWithChangeBar>
  ),
}

/**
 * `withHoverEffect: false`. The click target stays fully transparent even on hover
 * (`changeBarButtonWithHoverEffect` is the only rule that adds a `:hover` opacity, and it is not
 * applied). Used where a hover affordance would be misleading, e.g. inside an already-disabled
 * context.
 */
export const WithoutHoverEffect: Story = {
  render: () => (
    <ElementWithChangeBar isChanged hasFocus withHoverEffect={false}>
      <Field label="Title" value="Quarterly Planning Review, revised" />
    </ElementWithChangeBar>
  ),
}

/**
 * `isInteractive: false`. The tooltip is disabled (`Tooltip ... disabled={!isInteractive}`) and
 * the button loses `pointer-events: all` (`changeBarButtonInteractive` not applied), so it no
 * longer intercepts clicks even though it is still in the DOM. `ChangeIndicator` reads this from
 * `ReviewChangesContext.isInteractive`, which review-changes sets false while an operation makes
 * the panel non-interactive.
 */
export const NotInteractive: Story = {
  render: () => (
    <ElementWithChangeBar isChanged hasFocus isInteractive={false}>
      <Field label="Title" value="Quarterly Planning Review, revised" />
    </ElementWithChangeBar>
  ),
}

/**
 * The click itself. `ChangeBarButton`'s `onClick` is `isReviewChangesOpen ? undefined :
 * onOpenReviewChanges` (`ElementWithChangeBar.tsx:45`): a click OPENS the review-changes panel
 * generically. It does not carry this field's path, and once the panel is already open the
 * button has no `onClick` at all (`undefined`, not a no-op) and additionally fades to 0 opacity
 * (`changeBarWrapperReviewOpen &` in `ElementWithChangeBar.css.ts`). So there is no mechanism, at
 * this component, for scrolling to or re-focusing a specific field: the button either opens the
 * panel once, or (once open) does nothing and is invisible. Reaching a SPECIFIC field's diff, once
 * the panel is open, is `ConnectorsOverlay`'s job (hover/focus plus `findMostSpecificTarget`), a
 * completely separate mechanism with its own graceful-miss behaviour: see that page's docblock
 * for what happens when the target has become unreachable.
 */
export const ClickOpensReviewChanges: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <ReviewChangesContext.Provider
        value={{
          isReviewChangesOpen: open,
          onOpenReviewChanges: () => setOpen(true),
          onSetFocus: () => undefined,
        }}
      >
        <Flex direction="column" gap={3} style={{maxWidth: 320}}>
          <ElementWithChangeBar isChanged hasFocus>
            <Field label="Title" value="Quarterly Planning Review, revised" />
          </ElementWithChangeBar>
          <Text size={1} muted>
            Review changes panel is: <strong>{open ? 'open' : 'closed'}</strong>. Hover the field
            above to reveal the click target, then click it.
          </Text>
        </Flex>
      </ReviewChangesContext.Provider>
    )
  },
}
