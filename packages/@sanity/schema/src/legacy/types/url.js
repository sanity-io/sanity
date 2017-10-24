import {pick} from 'lodash'
import primitivePreview from '../preview/primitivePreview'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const URL_CORE = {
  name: 'url',
  title: 'Url',
  type: null,
  jsonType: 'string'
}

export const UrlType = {
  get() {
    return URL_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(URL_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: URL_CORE,
      preview: primitivePreview
    })
    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {type: parent})
          return subtype(current)
        }
      }
    }
  }
}
