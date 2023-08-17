import {capitalize, startCase} from 'lodash'

const CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption', 'description']

const PRIMITIVES = ['string', 'boolean', 'number']

const isPrimitive = (field) => PRIMITIVES.includes(field.type)

export default function guessOrderingConfig(objectTypeDef) {
  let candidates = CANDIDATES.filter((candidate) =>
    objectTypeDef.fields.some((field) => isPrimitive(field) && field.name === candidate),
  )

  // None of the candidates were found, fallback to all fields
  if (candidates.length === 0) {
    candidates = objectTypeDef.fields.filter(isPrimitive).map((field) => field.name)
  }

  return candidates.map((name) => ({
    name: name,
    title: capitalize(startCase(name)),
    by: [{field: name, direction: 'asc'}],
  }))
}
