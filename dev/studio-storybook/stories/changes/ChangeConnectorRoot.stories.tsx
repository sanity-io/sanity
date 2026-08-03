import {Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {ChangeConnectorRoot} from '../../../../packages/sanity/src/core/changeIndicators/overlay/ChangeConnectorRoot'
import {ChangeSide, FieldSide} from './changeIndicatorHarness'

/**
 * `ChangeConnectorRoot` is the real production entry point: `DocumentLayout.tsx:222-242` mounts
 * exactly one of these around the whole document panel (`StyledChangeConnectorRoot`, a thin
 * `clsx`-only wrapper), feeding it `changesOpen && paneParams?.changesInspectorTab === 'review'`
 * for `isReviewChangesOpen`. It composes `ReviewChangesContext.Provider`, `ChangeIndicatorsTracker`,
 * a `ScrollContainer`, and `ConnectorsOverlay` (storied on its own page) into one mountable unit,
 * so this page uses it exactly as production does rather than rebuilding its internals by hand.
 *
 * `ChangeConnectorRootProps` (the exported type) declares only `children`, `className`,
 * `isReviewChangesOpen`, `onOpenReviewChanges` and `onSetFocus`, it does not extend
 * `HTMLProps<div>`, so there is no typed `style` prop to reach for even though `restProps` is
 * spread onto the inner `ScrollContainer` at runtime. The harness below reaches the same effect
 * through `className` and a scoped `<style>` tag instead, deliberately anchored on
 * `ChangeConnectorRoot`'s OWN rendered element (not an outer wrapper div): `ConnectorsOverlay`
 * measures every field against `rootElement`, which is that same `ScrollContainer` node
 * (`ChangeConnectorRoot.tsx:27,41-44`), so giving `position: relative` to any other ancestor would
 * measure from one origin and paint from another.
 */
const meta: Meta<typeof ChangeConnectorRoot> = {
  title: 'Document Pane/Change Indicators/ChangeConnectorRoot',
  component: ChangeConnectorRoot,
  parameters: {
    docs: {
      description: {
        component: [
          'A document pane wires up its change bars, its review-changes panel, and the connector ' +
            'painted between them through exactly one provider. Get that wiring wrong and the ' +
            'marks stop pointing at the fields they describe.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/changeIndicators/overlay/ChangeConnectorRoot.tsx` |',
          '| Tier | SERVICE |',
          '| Mounted by | `DocumentLayout.tsx:222-242`, around `DocumentPanel`, whenever a document pane renders |',
          '| Timing | 10ms trailing debounce, then one `requestAnimationFrame` |',
          '',
          'It composes a review-changes context provider, a change tracker, a scroll container ' +
            'and the connector overlay into one mountable unit, so this page uses it exactly as ' +
            'production does rather than rebuilding its internals by hand.',
          '',
          'The exported prop type declares only `children`, `className`, `isReviewChangesOpen`, ' +
            "`onOpenReviewChanges` and `onSetFocus`; it does not extend a div's own HTML props, so " +
            'there is no typed `style` prop to reach for even though extra props are spread onto ' +
            'the inner scroll container at runtime. The harness below reaches the same effect ' +
            "through `className` and a scoped style tag instead, anchored on this component's own " +
            'rendered element rather than an outer wrapper: the overlay measures every field ' +
            'against that same node, so giving position to any other ancestor would measure from ' +
            'one origin and paint from another.',
          '',
          'The timing mechanics live on the connector overlay page and in the harness file next to ' +
            'this one. Both were written from source before a static build existed to check them ' +
            'against; the build has since confirmed the geometry, with real path elements present ' +
            'in these stories.',
          '',
          '> **Why it matters:** this page mounts the real production entry point, not a ' +
            'hand-assembled stand-in, so the coupling between the panel and the review-changes ' +
            'panel shows through the path a studio actually takes to get there.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:cms', 'tier:service', 'source:studio'],
}

export default meta
type Story = StoryObj<typeof ChangeConnectorRoot>

const ROOT_CLASS = 'change-connector-root-harness'
const rootStyleTag = <style>{`.${ROOT_CLASS} { position: relative; width: 460px; }`}</style>

/**
 * Mirrors `DocumentLayout`'s real props: `isReviewChangesOpen`, `onOpenReviewChanges`,
 * `onSetFocus`. The toggle button drives `isReviewChangesOpen` the same way opening "Review
 * changes" would, showing `ConnectorsOverlay`'s own closed-panel behaviour (see that page's
 * `ReviewPanelClosed` story) through the real root instead of a hand-built one.
 */
export const Default: Story = {
  render: function Render() {
    const [reviewOpen, setReviewOpen] = useState(true)
    return (
      <Stack gap={3}>
        {rootStyleTag}
        <button type="button" onClick={() => setReviewOpen((v) => !v)}>
          {reviewOpen ? 'Close' : 'Open'} review changes
        </button>
        <ChangeConnectorRoot
          className={ROOT_CLASS}
          isReviewChangesOpen={reviewOpen}
          onOpenReviewChanges={() => setReviewOpen(true)}
          onSetFocus={() => undefined}
        >
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
            <Text size={1} muted>
              Review changes panel
            </Text>
            <ChangeSide
              path={['title']}
              from="Quarterly Planning Review"
              to="Quarterly Planning Review, revised"
            />
          </Stack>
        </ChangeConnectorRoot>
      </Stack>
    )
  },
}

/**
 * The same fixture as `Default`, static at `isReviewChangesOpen: true`, no toggle, standing in
 * for how a document pane looks with "Review changes" already open: the closest this catalog
 * gets to the composed production surface without the full `DocumentLayout`/`StructureHarness`
 * machinery (out of scope here; that pairing belongs to `Document Pane/Changes Inspector`).
 */
export const InContext: Story = {
  render: () => (
    <>
      {rootStyleTag}
      <ChangeConnectorRoot
        className={ROOT_CLASS}
        isReviewChangesOpen
        onOpenReviewChanges={() => undefined}
        onSetFocus={() => undefined}
      >
        <Stack gap={5} padding={4}>
          <FieldSide
            path={['title']}
            label="Title"
            value="Quarterly Planning Review, revised"
            hasFocus
          />
          <ChangeSide
            path={['title']}
            from="Quarterly Planning Review"
            to="Quarterly Planning Review, revised"
          />
        </Stack>
      </ChangeConnectorRoot>
    </>
  ),
}
