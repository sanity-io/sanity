import {identity, sortBy, values} from 'lodash'
import {FieldName, Id, Selection} from '../types'
import {INCLUDE_FIELDS_QUERY} from '../constants'
import {escapeField, fieldNeedsEscape} from '../../util'

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
    }, {}),
  )
}

function stringifyId(id: string) {
  return JSON.stringify(id)
}

const maybeEscape = (fieldName: string) =>
  fieldNeedsEscape(fieldName) ? `"${fieldName}": @${escapeField(fieldName)}` : fieldName

function toSubQuery({ids, fields}: {ids: string[]; fields: string[]}) {
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
