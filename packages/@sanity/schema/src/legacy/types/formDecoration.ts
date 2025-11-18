import {pick} from 'lodash'

import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS, FORM_DECORATION, OWN_PROPS_NAME} from './constants'
import {hiddenGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const FORM_DECORATION_CORE = {
  name: FORM_DECORATION,
  title: 'Form Decorator',
  type: null,
  jsonType: 'null',
}

export const formDecorationType = {
  get() {
    return FORM_DECORATION_CORE
  },
  extend(subTypeDef: any) {
    const ownProps = {
      ...subTypeDef,
      preview: primitivePreview,
    }

    const parsed = Object.assign(pick(FORM_DECORATION_CORE, OVERRIDABLE_FIELDS), ownProps, {
      type: FORM_DECORATION_CORE,
    })

    hiddenGetter(parsed, OWN_PROPS_NAME, ownProps)

    return subtype(parsed)

    function subtype(parent: any) {
      return {
        get() {
          return parent
        },
        extend: (extensionDef: any) => {
          const subOwnProps = pick(extensionDef, OVERRIDABLE_FIELDS)
          const current = Object.assign({}, parent, subOwnProps, {
            type: parent,
          })
          hiddenGetter(current, OWN_PROPS_NAME, subOwnProps)
          return subtype(current)
        },
      }
    }
  },
}
