import {capitalize, startCase} from 'lodash'
import {SortOrdering} from '@sanity/types'

const CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption', 'description']

const PRIMITIVES = ['string', 'boolean', 'number']

const isPrimitive = (field) => PRIMITIVES.includes(field.type)

export default function guessOrderingConfig(objectTypeDef): SortOrdering[] {
  let candidates = CANDIDATES.filter((candidate) =>
    objectTypeDef.fields.some((field) => isPrimitive(field) && field.name === candidate),
  )

  // None of the candidates were found, fallback to all fields
  if (candidates.length === 0) {
    candidates = objectTypeDef.fields.filter(isPrimitive).map((field) => field.name)
  }

  return candidates.map(
    (name): SortOrdering => ({
      name: name,
      i18n: {
        title: {key: `default-orderings.${name}`, ns: 'studio'},
      },
      title: capitalize(startCase(name)),
      by: [{field: name, direction: 'asc'}],
    }),
  )
}
