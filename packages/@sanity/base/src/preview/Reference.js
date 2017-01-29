import {fetchQuery} from '../data/fetch'
import {ReferencePreview} from '../../index'
import * as previewUtils from './utils'
import {unprefixType} from '../utils/unprefixType'

export default ReferencePreview.create((id, fieldSelection) => {

  const query = `*[_id == $id] {${previewUtils.stringifyGradientQuerySelection(fieldSelection)}}`

  return fetchQuery(query, {id: id})
    .then(res => unprefixType(res[0]))
    .then(refDoc => ({_isPreviewMaterializedHack: true, ...refDoc}))
})
