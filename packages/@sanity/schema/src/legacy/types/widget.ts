import {pick} from 'lodash'

const OVERRIDABLE_FIELDS = ['type', 'name', 'title', 'description', 'options', 'select']

const WIDGET_CORE = {
  name: 'widget',
  title: 'Widget',
  type: null
}

export const WidgetType = {
  get() {
    return WIDGET_CORE
  },
  extend(subTypeDef) {
    const parsed = Object.assign(pick(WIDGET_CORE, OVERRIDABLE_FIELDS), subTypeDef, {
      type: WIDGET_CORE
    })
    return subtype(parsed)

    function subtype(parent) {
      return {
        get() {
          return parent
        },
        extend: extensionDef => {
          const current = Object.assign({}, parent, pick(extensionDef, OVERRIDABLE_FIELDS), {
            type: parent
          })
          return subtype(current)
        }
      }
    }
  }
}
