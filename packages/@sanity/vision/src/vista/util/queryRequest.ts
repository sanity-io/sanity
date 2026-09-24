import {type QueryRequest} from '../store/types'

/** Whether two requests run the same GROQ with the same params, whatever their other options */
export function haveSameQuery(a: QueryRequest, b: QueryRequest): boolean {
  return a.query === b.query && JSON.stringify(a.params) === JSON.stringify(b.params)
}
