import {type ReactNode} from 'react'

import {linkMiddleware} from './linkMiddleware'
import {type Middleware} from './types'

const middlewares: Middleware[] = [linkMiddleware]

/**
 * A function that transforms a ReactNode using a set of middlewares
 */
export function transformChildren(node: ReactNode): ReactNode {
  if (!Array.isArray(node)) return node

  return node.flatMap((item) => {
    let transformedItem: ReactNode[] = [item]

    for (const middleware of middlewares) {
      transformedItem = transformedItem.flatMap(middleware)
    }

    return transformedItem
  })
}
