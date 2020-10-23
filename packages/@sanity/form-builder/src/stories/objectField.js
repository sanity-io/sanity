import React from 'react'
import ObjectField from '../inputs/ObjectInput'

// @todo
export function ObjectFieldStory() {
  const props = {
    // type?: any
    type: {
      type: 'object',
      title: 'Object',
      fields: [{type: {type: 'string', name: 'title', title: 'Title'}}],
    },

    // value?: {[key: string]: any}
    value: {title: 'Value'},

    // onChange?: (...args: any[]) => any
    // onFocus: (...args: any[]) => any
    // focusPath?: any[]
    // markers?: Marker[]
    // onBlur: (...args: any[]) => any
    // level?: number
    // readOnly?: boolean
    // isRoot?: boolean
    // filterField?: (...args: any[]) => any
  }

  return (
    <div>
      <ObjectField {...props} />
    </div>
  )
}
