import {pick} from 'lodash'

import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {hiddenGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const URL_CORE = {
  name: 'url',
  title: 'Url',
  type: null,
  jsonType: 'string',
}

export const UrlType = {
  get() {
    return URL_CORE
  },
  extend(subTypeDef: any) {
    const ownProps = {
      ...subTypeDef,
      preview: primitivePreview,
    }

    const parsed = Object.assign(pick(URL_CORE, OVERRIDABLE_FIELDS), ownProps, {
      type: URL_CORE,
    })

    hiddenGetter(parsed, OWN_PROPS_NAME, ownProps)

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          const subOwnownProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, subOwnownProps, {
            type: parent,
          })
          hiddenGetter(current, OWN_PROPS_NAME, subOwnownProps)
          return subtype(current)
        },
      }
    }
  },
}
