import PropTypes from 'prop-types'
import React from 'react'
import {BlockEditor} from 'part:@sanity/form-builder'

function extractTextFromBlocks(blocks) {
  if (!blocks) {
    return ''
  }
  return blocks
    .filter(val => val._type === 'block')
    .map(block => {
      return block.children
        .filter(child => child._type === 'span')
        .map(span => span.text)
        .join('')
    })
    .join('')
}

export default class FunkyEditor extends React.Component {
  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    level: PropTypes.number,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired
  }

  render() {
    return (
      <div>
        <BlockEditor {...this.props} />
        <p>
          Your funkyness is <strong>{extractTextFromBlocks(this.props.value).length}</strong>{' '}
          characters long
        </p>
      </div>
    )
  }
}
