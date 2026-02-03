import {type DefaultRenderingContext, type StudioRenderingContext} from './types'
import {map, type OperatorFunction} from 'rxjs'

const DEFAULT_RENDERING_CONTEXT: DefaultRenderingContext = {
  name: 'default',
  metadata: {},
}

/**
 * @internal
 */
export function defaultRenderingContext(): OperatorFunction<
  StudioRenderingContext | undefined,
  StudioRenderingContext
> {
  return map((renderingContext) => renderingContext ?? DEFAULT_RENDERING_CONTEXT)
}
