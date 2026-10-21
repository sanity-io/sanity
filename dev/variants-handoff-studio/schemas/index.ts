import {bookFieldLevel} from './bookFieldLevel'
import {bookTypes} from './books'
import {e9Types} from './e9'
import {fieldMarksTest} from './fieldMarks'
import {schemaTypes as northfoldTypes} from './northfold'
import {peopleTypes} from './people'

/** Northfold's schema only matches the `northfold` dataset; every other dataset gets Nordic Books. */
export function schemaTypesFor(dataset: string) {
  return dataset === 'northfold'
    ? northfoldTypes
    : [...bookTypes, fieldMarksTest, ...e9Types, ...peopleTypes, bookFieldLevel]
}
