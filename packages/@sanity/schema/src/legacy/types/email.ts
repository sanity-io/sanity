import {pick} from 'lodash'

import primitivePreview from '../preview/primitivePreview'
import {DEFAULT_OVERRIDEABLE_FIELDS, OWN_PROPS_NAME} from './constants'
import {hiddenGetter} from './utils'

const OVERRIDABLE_FIELDS = [...DEFAULT_OVERRIDEABLE_FIELDS]

const EMAIL_CORE = {
  name: 'email',
  title: 'Email',
  type: null,
  jsonType: 'string',
}

export const EmailType = {
  get() {
    return EMAIL_CORE
  },
  extend(subTypeDef: any) {
    const ownProps = {
      ...subTypeDef,
      preview: primitivePreview,
    }
    const parsed = Object.assign(pick(EMAIL_CORE, OVERRIDABLE_FIELDS), ownProps, {
      type: EMAIL_CORE,
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
