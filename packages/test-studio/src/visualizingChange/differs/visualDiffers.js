/* eslint-disable react/prop-types */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
/* eslint-disable react/no-array-index-key */
/* eslint-disable id-length */
import React from 'react'
import {diffWordsWithSpace} from 'diff'

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

const differs = {
  string: {
    editText: ({item}) => {
      return (
        <li>
          {item.field} [{item.op}]{' '}
          {item.op === 'editText' && stringDiffComponent(item.from, item.to)}
        </li>
      )
    }
  },
  block: {
    editText: ({item}) => {
      return (
        <li>
          {item.field} [{item.op}]{' '}
          {item.op === 'editText' && stringDiffComponent(item.from, item.to)}
        </li>
      )
    }
  }
}

export default differs
