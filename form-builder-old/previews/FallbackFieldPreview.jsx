import React from 'react'
import truncate from 'truncate'
import strip from 'strip'
import isPlainObject from 'lodash.isplainobject'

function stringify(val) {
  if (typeof val === 'string') {
    return truncate(strip(val || ''))
  }
  if (Array.isArray(val)) {
    return `[${val.map(stringify).join(' | ')}]`
  }
  if (!isPlainObject(val)) {
    return JSON.stringify(val)
  }
  return Object.keys(val).map(key => {
    return `${key}: ${stringify(val[key])}`
  }).join(', ')
}

export default React.createClass({
  displayName: 'FallbackFieldPreview',
  propTypes: {
    value: React.PropTypes.object.isRequired
  },
  renderValue() {
    const {value} = this.props
    if (!isPlainObject(value)) {
      return JSON.stringify(value)
    }
    return (
      <ul>
        {
          Object.keys(value).map((key, i) => {
            return <li key={`key${i}`}>{key}: {stringify(value[key])}</li>
          })
        }
      </ul>
    )
  },
  render() {
    const {value} = this.props
    return (
      <div>
        <span style={{color: '#aaa', fontSize: '80%'}}> {/* todo fix styling */}
          Warning: no field preview for type `{value.type}`. To improve how items are presented here, please implement
          a custom field preview for `{value.type}`
        </span>
        <div>{this.renderValue()}</div>
      </div>
    )
  }
})
