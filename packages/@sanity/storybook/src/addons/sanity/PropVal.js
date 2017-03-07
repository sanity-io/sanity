/**
 * Kindly borrowed from @kadira/react-storybook-addon-info
 * MIT-licensed, see https://github.com/storybooks/react-storybook-addon-info/blob/master/LICENSE
 * Original source at https://github.com/storybooks/react-storybook-addon-info
 */

/* eslint-disable react/no-multi-comp */
import React from 'react'
import createFragment from 'react-addons-create-fragment'

const valueStyles = {
  func: {color: '#170'},
  attr: {color: '#666'},
  object: {color: '#666'},
  array: {color: '#666'},
  number: {color: '#a11'},
  string: {color: '#22a', wordBreak: 'break-word'},
  bool: {color: '#a11'},
  empty: {color: '#777'},
}

function previewArray(val) {
  const items = {}
  val.slice(0, 3).forEach((item, i) => {
    items[`n${i}`] = <PropVal val={item} />
    items[`c${i}`] = ', '
  })

  if (val.length > 3) {
    items.last = '…'
  } else {
    delete items[`c${val.length - 1}`]
  }

  return (
    <span style={valueStyles.array}>
      [{createFragment(items)}]
    </span>
  )
}

function previewObject(val) {
  const names = Object.keys(val)
  const items = {}
  names.slice(0, 3).forEach((name, i) => {
    items[`k${i}`] = <span style={valueStyles.attr}>{name}</span>
    items[`c${i}`] = ': '
    items[`v${i}`] = <PropVal val={val[name]} />
    items[`m${i}`] = ', '
  })

  if (names.length > 3) {
    items.rest = '…'
  } else {
    delete items[`m${names.length - 1}`]
  }

  return (
    <span style={valueStyles.object}>
      {'{'}{createFragment(items)}{'}'}
    </span>
  )
}

function previewProp(value) {
  let val = value
  let braceWrap = true
  let content = null
  if (typeof val === 'number') {
    content = <span style={valueStyles.number}>{val}</span>
  } else if (typeof val === 'string') {
    val = val.length > 50 ? `${val.slice(0, 50)}…` : val
    content = <span style={valueStyles.string}>&quot;{val}&quot;</span>
    braceWrap = false
  } else if (typeof val === 'boolean') {
    content = <span style={valueStyles.bool}>{`${val}`}</span>
  } else if (Array.isArray(val)) {
    content = previewArray(val)
  } else if (typeof val === 'function') {
    content = <span style={valueStyles.func}>{val.name ? `${val.name}()` : 'anonymous()'}</span>
  } else if (!val) {
    content = <span style={valueStyles.empty}>{`${val}`}</span>
  } else if (typeof val !== 'object') {
    content = <span>…</span>
  } else if (React.isValidElement(val)) {
    content = (
      <span style={valueStyles.object}>
        {`<${val.type.displayName || val.type.name || val.type} />`}
      </span>
    )
  } else {
    content = previewObject(val)
  }

  return braceWrap
    ? <span>&#123;{content}&#125;</span>
    : content
}

export default function PropVal(props) {
  return previewProp(props.val)
}

module.exports = PropVal
