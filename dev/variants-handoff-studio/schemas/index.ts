import {bookTypes} from './books'
import {fieldMarksTest} from './fieldMarks'
import {peopleTypes} from './people'

/**
 * The Handoff Studio: Nordic Books (books, authors, publishers, series, places), plus the Field marks test type: one document with every
 * node kind, so T5 (the shipped field marks) can be checked on it.
 */
export function schemaTypesFor(_dataset: string) {
  return [...bookTypes, ...peopleTypes, fieldMarksTest]
}
