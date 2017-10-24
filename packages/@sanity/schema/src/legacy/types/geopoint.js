import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['jsonType', 'type', 'name', 'title', 'description', 'options']

const GEOPOINT_CORE = {
  name: 'geopoint',
  type: null,
  jsonType: 'object'
}

export const GeoPointType = {
  get() {
    return GEOPOINT_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(GEOPOINT_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: GEOPOINT_CORE
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
