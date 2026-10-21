import {bookTypes} from './books'
import {peopleTypes} from './people'

/** The Handoff Studio: Nordic Books only (books, authors, publishers, series, places). */
export function schemaTypesFor(_dataset: string) {
  return [...bookTypes, ...peopleTypes]
}
