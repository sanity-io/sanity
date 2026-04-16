import identity from 'lodash-es/identity.js'
import sortBy from 'lodash-es/sortBy.js'
import values from 'lodash-es/values.js'

import {escapeField, fieldNeedsEscape} from '../../util'
import {INCLUDE_FIELDS_QUERY} from '../constants'
import {type FieldName, type Id, type Selection} from '../types'

/** @internal */
export type CombinedSelection = {
  ids: Id[]
  fields: FieldName[]
  map: number[]
  /** When set, used as the GROQ projection body instead of building from `fields`. */
  projection?: string
}

type Doc = {
  _id: string
}

type Result = Doc[]

export function combineSelections(selections: Selection[]): CombinedSelection[] {
  return values(
    selections.reduce((output: {[key: string]: any}, selection, index) => {
      const [id, fields, projection] = selection
      const key = projection ?? sortBy(fields.join(','), identity).join('.')
      if (!output[key]) {
        output[key] = {fields: fields, ids: [], map: [], ...(projection ? {projection} : {})}
      }
      const idx = output[key].ids.length
      output[key].ids[idx] = id
      output[key].map[idx] = index
      return output
    }, {}),
  )
}

function stringifyId(id: string) {
  return JSON.stringify(id)
}

export const maybeEscape = (fieldName: string) =>
  fieldNeedsEscape(fieldName) ? `"${fieldName}": @${escapeField(fieldName)}` : fieldName

function toSubQuery({ids, fields, projection}: CombinedSelection) {
  if (projection) {
    return `*[_id in [${ids.map(stringifyId).join(',')}]][0...${ids.length}]{${projection}}`
  }
  const allFields = [...INCLUDE_FIELDS_QUERY, ...fields]
  return `*[_id in [${ids.map(stringifyId).join(',')}]][0...${ids.length}]{${allFields
    .map(maybeEscape)
    .join(',')}}`
}

export function toQuery(combinedSelections: CombinedSelection[]): string {
  return `[${combinedSelections.map(toSubQuery).join(',')}][0...${combinedSelections.length}]`
}

export function reassemble(
  queryResult: Result[],
  combinedSelections: CombinedSelection[],
): (Doc | null)[] {
  return queryResult.reduce((reprojected: (Doc | null)[], subResult, index) => {
    const map = combinedSelections[index].map
    map.forEach((resultIdx, i) => {
      const id = combinedSelections[index].ids[i]
      const found = subResult.find((doc) => doc._id === id)
      reprojected[resultIdx] = found || null
    })
    return reprojected
  }, [])
}
