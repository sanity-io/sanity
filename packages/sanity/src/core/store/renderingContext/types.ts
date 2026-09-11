import {type Observable} from 'rxjs'

/**
 * @internal
 */
export type BaseStudioRenderingContext<
  Name extends string = string,
  Metadata = Record<PropertyKey, never>,
> = {
  name: Name
  metadata: Metadata
}

/**
 * @internal
 */
export type DefaultRenderingContext = BaseStudioRenderingContext<'default'>

/**
 * @internal
 */
export type CoreUiRenderingContext = BaseStudioRenderingContext<
  'coreUi',
  {
    environment: string
  }
>

/**
 * @internal
 */
export type StudioRenderingContext = DefaultRenderingContext | CoreUiRenderingContext

/**
 * @internal
 */
export const capabilities = ['globalUserMenu', 'globalWorkspaceControl', 'comlink'] as const

/**
 * @internal
 */
export type Capability = (typeof capabilities)[number]

/**
 * @internal
 */
export type CapabilityRecord = Partial<Record<Capability, boolean>>

/**
 * @internal
 */
export type RenderingContextStore = {
  renderingContext: Observable<StudioRenderingContext>
  capabilities: Observable<CapabilityRecord>
  /**
   * The rendering context the store resolved when it was created — the value `renderingContext`
   * replays — for reading during render, where nothing may subscribe. `undefined` only while the
   * context is unresolved, which the store's own synchronous pipeline never is.
   */
  getRenderingContext: () => StudioRenderingContext | undefined
  /**
   * The capabilities of that rendering context — the value `capabilities` replays — for reading
   * during render, on the same terms as `getRenderingContext`.
   */
  getCapabilities: () => CapabilityRecord | undefined
}

/**
 * Check whether the provided value satisfies the `CoreUiRenderingContext` type.
 *
 * @internal
 */
export function isCoreUiRenderingContext(
  maybeCoreUiRenderingContext: unknown,
): maybeCoreUiRenderingContext is CoreUiRenderingContext {
  return (
    typeof maybeCoreUiRenderingContext === 'object' &&
    maybeCoreUiRenderingContext !== null &&
    'name' in maybeCoreUiRenderingContext &&
    maybeCoreUiRenderingContext.name === 'coreUi' &&
    'metadata' in maybeCoreUiRenderingContext &&
    typeof maybeCoreUiRenderingContext.metadata === 'object' &&
    maybeCoreUiRenderingContext.metadata !== null &&
    'environment' in maybeCoreUiRenderingContext.metadata &&
    typeof maybeCoreUiRenderingContext.metadata.environment === 'string'
  )
}
