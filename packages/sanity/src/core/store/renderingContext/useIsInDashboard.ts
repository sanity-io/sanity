import {type StudioRenderingContext} from './types'
import {useRenderingContext} from './useRenderingContext'

/**
 * Whether Studio is hosted by the Dashboard: either inside its core UI frame (the `coreUi`
 * rendering context, declared through the `_context` URL query) or inside a message bus host such
 * as the Workbench and its Content Agent (the `messageBus` rendering context, connected through
 * the `@sanity/sdk` message bus a parent frame installs).
 *
 * A standalone Studio resolves the `default` rendering context and is not in the Dashboard.
 *
 * @internal
 */
export function isDashboardRenderingContext(
  renderingContext: StudioRenderingContext | undefined,
): boolean {
  return renderingContext?.name === 'coreUi' || renderingContext?.name === 'messageBus'
}

/**
 * Whether Studio is hosted by the Dashboard (core UI frame or a message bus host such as the
 * Workbench's Content Agent). UI the host provides itself — its own feedback entry, the Content
 * Agent's proposed changes — is gated on this so it does not show in a standalone Studio.
 *
 * @internal
 */
export function useIsInDashboard(): boolean {
  return isDashboardRenderingContext(useRenderingContext())
}
