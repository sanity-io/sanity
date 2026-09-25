import {dequal} from 'dequal/lite'

import {type QueryRequest} from '../store/types'

/**
 * Whether two requests run the same GROQ with the same params, whatever their other options.
 * Params are compared structurally, so the order they were typed in does not matter.
 */
export function haveSameQuery(a: QueryRequest, b: QueryRequest): boolean {
  return a.query === b.query && dequal(a.params, b.params)
}
