import {map, type OperatorFunction} from 'rxjs'

import {getMessageBusConnection} from '../messageBus/getMessageBusConnection'
import {type MessageBusRenderingContext, type StudioRenderingContext} from './types'

/**
 * @internal
 */
export function messageBusRenderingContext(): OperatorFunction<
  StudioRenderingContext | undefined,
  StudioRenderingContext | undefined
> {
  const connection = getMessageBusConnection()

  return map((renderingContext) => {
    if (renderingContext || !connection) {
      return renderingContext
    }

    return {name: 'messageBus', metadata: {connection}} satisfies MessageBusRenderingContext
  })
}
