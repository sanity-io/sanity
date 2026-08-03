/**
 * Shared fixtures for the change-indicator subsystem: the vertical bar drawn beside a field
 * that differs from the published version (`core/changeIndicators`), and the curved connector
 * traced from that bar to the matching diff in the review-changes panel
 * (`core/changeIndicators/overlay`).
 *
 * The two sides share ONE realtime store, `ChangeIndicatorsTracker` (`core/changeIndicators/
 * tracker.tsx`). A field-side reporter (`ChangeIndicator`) and a change-side reporter
 * (`ChangeFieldWrapper`) both write into it; `ConnectorsOverlay` reads it back and draws a line
 * only between a change bar that has HOVER or FOCUS and its matching diff, located by
 * `findMostSpecificTarget` (`ConnectorsOverlay.tsx:48-72`). Hover cannot be scripted into a
 * static build, so every harness below drives the connection through FOCUS: `FieldSide` hands
 * `ChangeIndicator` `hasFocus`, which reaches the `changeBarsWithFocus` branch
 * (`ConnectorsOverlay.tsx:68-71`) without a pointer ever moving.
 *
 * Two more things worth knowing before reading the stories that use this file:
 *
 * - The tracker's snapshot update is DEBOUNCED, 10ms trailing, no leading edge
 *   (`components/react-track-elements/hooks.ts`, `debounce(updateSnapshot, 10, {trailing: true})`).
 *   A reporter's `useLayoutEffect` adds it to the store synchronously at mount, but the snapshot
 *   context consumers (`ConnectorsOverlay`) only see it after that timer fires.
 * - `ConnectorsOverlay` then measures on the NEXT ANIMATION FRAME (`requestAnimationFrame(updateConnectors)`,
 *   `ConnectorsOverlay.tsx:123-126`), not synchronously on the data changing.
 *
 * So a harness here converges to a visible connector roughly 10-30ms after mount (debounce plus
 * one frame), never on the very first paint. That is architecturally sound and needs no
 * interaction, but it is also exactly the kind of delayed convergence a render gate reading the
 * DOM immediately after mount could miss. See the ConnectorsOverlay and ChangeConnectorRoot
 * docblocks for how this was handled.
 */

import {type Path} from '@sanity/types'
import {Card, LayerProvider, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import {ChangeFieldWrapper} from '../../../../packages/sanity/src/core/changeIndicators/ChangeFieldWrapper'
import {ChangeIndicator} from '../../../../packages/sanity/src/core/changeIndicators/ChangeIndicator'

/**
 * The field-side half of a change pair: what an editor sees inline in the form. Its input is a
 * `path` (own input, the tracker's key), `hasFocus` (own input, the caller decides), and
 * `isChanged` (own input). `ChangeIndicator` is a RENDERER of these, not a dispatcher, so handing
 * it literal values is supplying input rather than inventing a state (see the storybook-authoring
 * skill's fixture rule).
 */
export function FieldSide(props: {
  path: Path
  label: string
  value: string
  hasFocus?: boolean
  isChanged?: boolean
}) {
  const {path, label, value, hasFocus = false, isChanged = true} = props
  // ChangeIndicator and ElementWithChangeBar both call useLayer(), which throws rather than
  // defaulting when no provider is above it. Studio always has one; a story does not.
  return (
    <LayerProvider>
      <ChangeIndicator path={path} hasFocus={hasFocus} isChanged={isChanged}>
        <Card padding={3} radius={2} border tone={isChanged ? 'caution' : 'default'}>
          <Stack gap={2}>
            <Text size={1} weight="semibold">
              {label}
            </Text>
            <Text size={1}>{value}</Text>
          </Stack>
        </Card>
      </ChangeIndicator>
    </LayerProvider>
  )
}

/**
 * The change-side half: the diff row in the review-changes panel. `ChangeFieldWrapper` hardcodes
 * `isChanged: true` and `hasFocus: false` in its own reporter snapshot (`ChangeFieldWrapper.tsx:52-53`),
 * so those are not exposed here; only what the diff panel actually varies (`hasRevertHover`) is.
 */
export function ChangeSide(props: {
  path: Path
  from: string
  to: string
  hasRevertHover?: boolean
  children?: ReactNode
}) {
  const {path, from, to, hasRevertHover = false, children} = props
  return (
    <ChangeFieldWrapper path={path} hasRevertHover={hasRevertHover}>
      <Card padding={3} radius={2} border tone="positive">
        <Stack gap={2}>
          <Text size={1} muted style={{textDecoration: 'line-through'}}>
            {from}
          </Text>
          <Text size={1}>{to}</Text>
        </Stack>
      </Card>
      {children}
    </ChangeFieldWrapper>
  )
}
