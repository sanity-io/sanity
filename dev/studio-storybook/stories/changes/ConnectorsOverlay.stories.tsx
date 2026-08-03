import {type Path} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo, useState} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {ConnectorsOverlay} from '../../../../packages/sanity/src/core/changeIndicators/overlay/ConnectorsOverlay'
import {ChangeIndicatorsTracker} from '../../../../packages/sanity/src/core/changeIndicators/tracker'
import {ChangeSide, FieldSide} from './changeIndicatorHarness'

/**
 * `ConnectorsOverlay` is the case the brief calls out by name: it draws nothing from its own
 * props, only from what it reads back out of the shared tracker (`useChangeIndicatorsReportedValues`)
 * and measures off real DOM elements (`getOffsetsTo`). This page builds the tracker/context stack
 * BY HAND, without `ChangeConnectorRoot`, specifically to story `ConnectorsOverlay` on its own;
 * see the `ChangeConnectorRoot` page for the same coupling shown through the real production
 * entry point instead.
 *
 * Read `stories/changes/changeIndicatorHarness.tsx`'s top docblock before this one: it explains
 * why every story below hands `FieldSide` `hasFocus` instead of simulating a hover, and why the
 * connector converges roughly 10-30ms after mount rather than on first paint (a 10ms trailing
 * debounce in the tracker, then one `requestAnimationFrame` in `ConnectorsOverlay` itself).
 */
const meta: Meta<typeof ConnectorsOverlay> = {
  title: 'Document Pane/Change Indicators/ConnectorsOverlay',
  component: ConnectorsOverlay,
  parameters: {
    docs: {
      description: {
        component: [
          'This is the one page in the family that could pass every gate while drawing nothing ' +
            'at all: everything it renders comes from what it reads back out of a shared tracker ' +
            'and measures off real, laid-out elements, never from its own props.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/ConnectorsOverlay.tsx` |',
          '| Tier | SERVICE |',
          '| Timing | both reporters register synchronously at mount; the tracker snapshot updates on a 10ms trailing debounce with no leading edge; this layer re-measures on the next animation frame |',
          '| Confirmed | the static build paints real path geometry, driven only by the `hasFocus` prop, no pointer and no `play` function |',
          '',
          'It finds the one change bar with hover or focus, matches it to its diff in the ' +
            'review panel, and draws the connector between the two real elements. This page ' +
            'builds the tracker and context stack by hand, without the production root component, ' +
            'specifically so this layer can be storied on its own; the sibling page shows the ' +
            'same coupling through the real entry point instead.',
          '',
          'The unreachable-target case: this layer filters its candidate pairs down to only ' +
            'those where both the field element and the change element are present. If a field is ' +
            'hidden by a conditional and unmounts, its reporter cleans itself out of the tracker ' +
            'entirely, so there is simply nothing left to find for that pair, and it drops out.',
          '',
          '> **Why it matters:** a hidden field produces no stale reference, no crash, no line ' +
            'pointing at an element that no longer exists. The whole connector for that field ' +
            'disappears cleanly, a different outcome from a hidden-conditional-field bug the ' +
            'ledger already tracks in the comments panel, and not the same class of failure.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ConnectorsOverlay>

function Harness({
  path,
  from,
  to,
  fieldChanged = true,
  isReviewChangesOpen = true,
  removeField = false,
}: {
  path: Path
  from: string
  to: string
  fieldChanged?: boolean
  isReviewChangesOpen?: boolean
  removeField?: boolean
}) {
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const contextValue = useMemo(
    () => ({
      isReviewChangesOpen,
      onOpenReviewChanges: () => undefined,
      onSetFocus: () => undefined,
    }),
    [isReviewChangesOpen],
  )

  return (
    <ReviewChangesContext.Provider value={contextValue}>
      <ChangeIndicatorsTracker>
        <div ref={setRootElement} style={{position: 'relative', width: 460}}>
          <Stack gap={5} padding={4}>
            {!removeField && (
              <FieldSide path={path} label="Title" value={to} hasFocus isChanged={fieldChanged} />
            )}
            <ChangeSide path={path} from={from} to={to} />
          </Stack>
          {rootElement && (
            <ConnectorsOverlay rootElement={rootElement} onSetFocus={() => undefined} />
          )}
        </div>
      </ChangeIndicatorsTracker>
    </ReviewChangesContext.Provider>
  )
}

/**
 * The coupled pair, per the realtime-coupling test (storybook-decomposition skill): a field-side
 * `FieldSide` (real `ChangeIndicator`, `hasFocus`) and a change-side `ChangeSide` (real
 * `ChangeFieldWrapper`), mounted under one tracker with the review panel open. This is the
 * harness the brief asked for: two real, laid-out elements with matching tracking ids.
 */
export const FocusedPairDrawsConnector: Story = {
  render: () => (
    <Harness
      path={['title']}
      from="Quarterly Planning Review"
      to="Quarterly Planning Review, revised"
    />
  ),
}

/**
 * `isReviewChangesOpen: false`. `updateConnectors` short-circuits to `EMPTY_CONNECTORS` whenever
 * the panel is closed (`ConnectorsOverlay.tsx:111-115`), regardless of focus or hover state. The
 * overlay mounts, the tracker has a valid pair, and still nothing is drawn: by design.
 */
export const ReviewPanelClosed: Story = {
  render: () => (
    <Harness
      path={['title']}
      from="Quarterly Planning Review"
      to="Quarterly Planning Review, revised"
      isReviewChangesOpen={false}
    />
  ),
}

/**
 * `fieldChanged: false` (`isChanged={false}` on the field side). `getConnectors` skips any
 * reported value where `!value[1].isChanged` (`ConnectorsOverlay.tsx:52-54`) before it even
 * checks hover or focus, so a focused-but-unchanged field never becomes a candidate.
 */
export const FieldNotChanged: Story = {
  render: () => (
    <Harness
      path={['title']}
      from="Quarterly Planning Review"
      to="Quarterly Planning Review, revised"
      fieldChanged={false}
    />
  ),
}

/**
 * The unreachable-target case from the brief: the field side is never mounted at all (as if the
 * field were hidden by a conditional), while the change side stays in the panel. `getConnectors`
 * finds no `field` match for the change's id and filters the pair out (`:81, :85-88`). Read next
 * to the docblock above: this is a clean, silent no-op, not a crash or a stale line pointing at
 * nothing.
 */
export const FieldUnreachable: Story = {
  render: () => (
    <Harness
      path={['title']}
      from="Quarterly Planning Review"
      to="Quarterly Planning Review, revised"
      removeField
    />
  ),
}

/** Two changed fields with the same tracker: only the FOCUSED one's connector should draw. */
export const InContext: Story = {
  render: function Render() {
    const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
    const contextValue = useMemo(
      () => ({
        isReviewChangesOpen: true,
        onOpenReviewChanges: () => undefined,
        onSetFocus: () => undefined,
      }),
      [],
    )
    return (
      <ReviewChangesContext.Provider value={contextValue}>
        <ChangeIndicatorsTracker>
          <div ref={setRootElement} style={{position: 'relative', width: 460}}>
            <Stack gap={5} padding={4}>
              <Text size={1} muted>
                Form
              </Text>
              <FieldSide
                path={['title']}
                label="Title"
                value="Quarterly Planning Review, revised"
                hasFocus
              />
              <FieldSide
                path={['body']}
                label="Body"
                value="Planning starts in April and wraps by June."
              />
              <Text size={1} muted>
                Review changes panel
              </Text>
              <ChangeSide
                path={['title']}
                from="Quarterly Planning Review"
                to="Quarterly Planning Review, revised"
              />
              <ChangeSide
                path={['body']}
                from="Planning starts in April."
                to="Planning starts in April and wraps by June."
              />
            </Stack>
            {rootElement && (
              <ConnectorsOverlay rootElement={rootElement} onSetFocus={() => undefined} />
            )}
          </div>
        </ChangeIndicatorsTracker>
      </ReviewChangesContext.Provider>
    )
  },
}
