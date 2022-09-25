import {ReactNode} from 'react'

/**
 * @internal
 */
export type _RenderMiddleware<Props, RenderCallback> = (
  props: Props,
  next: RenderCallback
) => ReactNode
