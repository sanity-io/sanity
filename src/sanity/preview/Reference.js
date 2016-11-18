import {materializeReference} from '../data/fetch'
import {ReferencePreview} from '../../index'

export default ReferencePreview.create((...args) => materializeReference(...args).then(res => {
  return {_isPreviewMaterializedHack: true, ...res}
}))
