/* eslint-disable react/display-name, react/no-multi-comp, react/prop-types */

import React from 'react'
import {diffWordsWithSpace} from 'diff'

interface DocumentDiffer {
  visualDiffers?: object
  summarizers?: object
}

function extractText(blockContent) {
  return blockContent.children
    .map(item => (item._type == 'span' ? item.text : null))
    .filter(Boolean)
    .join('')
}

const colors = {
  unchanged: '#ccc',
  added: 'green',
  removed: 'red'
}

function stringDiffComponent(from, to) {
  const computedStringDiff = diffWordsWithSpace(from, to)
  return (
    <span>
      {computedStringDiff.map((part, index) => {
        let color = colors.unchanged
        if (part.added) color = colors.added
        if (part.removed) color = colors.removed
        return (
          <span key={index} style={{backgroundColor: color}}>
            {part.value}
          </span>
        )
      })}
    </span>
  )
}

const summarizers = {
  block: (a, b) => {
    const aText = extractText(a)
    const bText = extractText(b)
    if (aText !== bText) {
      return [
        {
          op: 'editText',
          type: 'block',
          from: aText,
          to: bText
        }
      ]
    }
    return []
  },
  string: (a, b) => {
    return [
      {
        op: 'editText',
        type: 'string',
        from: a,
        to: b
      }
    ]
  },
  image: (a, b) => {
    if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
      return [{op: 'replaceImage', from: a.asset._ref, to: b.asset._ref}]
    }
    return null
  }
}

const visualDiffers = {
  string: {
    editText: {
      component: props => {
        const {op: operation, field, from, to} = props.item
        return (
          <li>
            {field} [{operation}] {operation === 'editText' && stringDiffComponent(from, to)}
          </li>
        )
      },
      haltNestedRendering: false // this is the default, keeping it here for the moment as an exmaple
    }
  },

  block: {
    editText: {
      component: props => {
        const {op: operation, field, from, to} = props.item
        return (
          <li>
            {field} [{operation}] {operation === 'editText' && stringDiffComponent(from, to)}
          </li>
        )
      }
    }
  }
}

export default {
  summarizers,
  visualDiffers
}
