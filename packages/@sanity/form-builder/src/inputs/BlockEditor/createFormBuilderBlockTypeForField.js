import React from 'react'
import ReactDOM from 'react-dom'
import BlockPreview from './BlockPreview'
import {Block, Attribute} from 'prosemirror/dist/model'

export default function createFormBuilderBlockTypeForField({createBlockValue, field, parentComponent}) {

  return class FormBuilderBlockType extends Block {
    get attrs() {
      return {
        value: new Attribute({compute: createBlockValue})
      }
    }

    get isFormBuilderType() {
      return true
    }

    get draggable() {
      return true
    }

    // Parse from dom
    get matchDOMTag() {
      return {
        'div[data-entity]': dom => {
          const value = createBlockValue(JSON.parse(dom.getAttribute('data-value'))) || undefined
          return {
            value
          }
        }
      }
    }

    toDOM(node) {

      const {value} = node.attrs

      const domNode = document.createElement('div')

      const serialized = JSON.stringify(value.serialize())
      if (serialized) {
        domNode.setAttribute('data-value', serialized)
      } else {
        domNode.removeAttribute('data-value')
      }
      domNode.setAttribute('data-entity', 'true')

      const el = (<BlockPreview field={field} value={value} />)
      ReactDOM.unstable_renderSubtreeIntoContainer(parentComponent, el, domNode)

      return domNode
    }
  }
}
