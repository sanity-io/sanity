import {Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {ChangeBarButton} from '../../../../packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled'

/**
 * `ChangeBarButton` is a real, always-mounted, clickable `<button>` that is invisible by design
 * at rest: `opacity: 0` in its base style (`ElementWithChangeBar.css.ts`'s `changeBarButton`).
 */
const meta: Meta<typeof ChangeBarButton> = {
  title: 'Document Pane/Change Indicators/ChangeBarButton',
  component: ChangeBarButton,
  parameters: {
    docs: {
      description: {
        component: [
          'A real, always mounted button that is invisible at rest by design: a generous, ' +
            'forgiving hit target over the change bar rather than a control that competes for ' +
            'attention, drawn with zero opacity until the pointer arrives.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/ElementWithChangeBar.styled.tsx` |',
          '| Tier | SERVICE |',
          '| Mechanism | fully transparent at rest, fades in on hover, opens review changes on click |',
          '',
          'A screenshot of any story here taken without an active hover shows nothing where the ' +
            'button sits, no outline, no fill, no border. That is not an empty story. The button ' +
            'is present in the document, sized, positioned, and clickable; it is simply drawn ' +
            'with no visible surface until the pointer reveals it.',
          '',
          '> **Why it matters:** invisible controls are only safe when their hit area is honest. ' +
            'The dashed boxes in these stories mark the actual bounds so that claim is checkable ' +
            'rather than asserted, and the not-interactive story shows the one state where clicks ' +
            'pass straight through to whatever sits behind it.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ChangeBarButton>

/**
 * Base state: `withHoverEffect={false}`. Fully transparent at rest AND on hover; only its
 * presence and hit area matter here. The dashed box marks the button's actual bounds so the
 * invisible-by-design claim above is checkable rather than asserted.
 */
export const RestingInvisible: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <ChangeBarButton aria-label="Open review changes" type="button" />
    </div>
  ),
}

/**
 * `withHoverEffect`. Hover the dashed box: the button fades in to 0.2 opacity
 * (`changeBarButtonWithHoverEffect`'s `:hover` rule). It has no visible resting state; a static
 * screenshot of this story, unhovered, looks identical to `RestingInvisible`.
 */
export const HoverReveals: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <ChangeBarButton
        aria-label="Open review changes"
        type="button"
        withHoverEffect
        isInteractive
      />
    </div>
  ),
}

/**
 * `isInteractive={false}`: the button loses `pointer-events: all` (`changeBarButtonInteractive`
 * not applied), so clicks pass through to whatever is behind it. Used when
 * `ReviewChangesContext.isInteractive` is false, e.g. mid-operation.
 */
export const NotInteractive: Story = {
  render: function Render() {
    const [clicks, setClicks] = useState(0)
    return (
      <Stack gap={2}>
        <div
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            border: '1px dashed var(--card-border-color)',
          }}
        >
          <ChangeBarButton
            aria-label="Open review changes"
            type="button"
            withHoverEffect
            isInteractive={false}
            onClick={() => setClicks((c) => c + 1)}
          />
        </div>
        <Text size={1} muted>
          Clicks registered: {clicks} (should stay 0; pointer-events are off)
        </Text>
      </Stack>
    )
  },
}

/** As it appears assembled inside `ElementWithChangeBar`, layered under `ChangeBarMarker`. */
export const InContext: Story = {
  render: () => (
    <div
      style={{
        position: 'relative',
        width: 40,
        height: 56,
        border: '1px dashed var(--card-border-color)',
      }}
    >
      <ChangeBarButton
        aria-label="Open review changes"
        type="button"
        withHoverEffect
        isInteractive
      />
    </div>
  ),
}
