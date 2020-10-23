import {identity, sortBy, values} from 'lodash'
import {escapeField, fieldNeedsEscape} from 'part:@sanity/base/util/search-utils'
import {FieldName, Id, Selection} from '../types'
import {INCLUDE_FIELDS_QUERY} from '../constants'

type CombinedSelection = {
  ids: Id[]
  fields: FieldName[]
  map: number[]
}

type Doc = {
  _id: string
}

type Result = Doc[]

export function combineSelections(selections: Selection[]): CombinedSelection[] {
  return values(
    selections.reduce((output: {[key: string]: any}, [id, fields], index) => {
      const key = sortBy(fields.join(','), identity).join('.')
      if (!output[key]) {
        output[key] = {fields: fields, ids: [], map: []}
      }
      const idx = output[key].ids.length
      output[key].ids[idx] = id
      output[key].map[idx] = index
      return output
    }, {})
  )
}

function stringifyId(id: string) {
  return JSON.stringify(id)
}

const maybeEscape = (fieldName) =>
  fieldNeedsEscape(fieldName) ? `"${fieldName}": @${escapeField(fieldName)}` : fieldName

function toSubQuery({ids, fields}) {
  const allFields = [...INCLUDE_FIELDS_QUERY, ...fields]
  return `*[_id in [${ids.map(stringifyId).join(',')}]][0...${ids.length}]{${allFields
    .map(maybeEscape)
    .join(',')}}`
}

export function toGradientQuery(combinedSelections: CombinedSelection[]) {
  return `[${combinedSelections.map(toSubQuery).join(',')}][0...${combinedSelections.length}]`
}

export function reassemble(queryResult: Result[], combinedSelections: CombinedSelection[]) {
  return queryResult.reduce((reprojected, subResult, index) => {
    const map = combinedSelections[index].map
    map.forEach((resultIdx, i) => {
      const id = combinedSelections[index].ids[i]
      reprojected[resultIdx] = subResult.find((doc) => doc._id === id)
    })
    return reprojected
  }, [])
}
