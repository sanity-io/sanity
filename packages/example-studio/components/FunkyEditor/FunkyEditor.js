import PropTypes from 'prop-types'
import React from 'react'
import {BlockEditor} from 'part:@sanity/form-builder'
import CustomMarkers from './CustomMarkers'
import BlockActions from './BlockActions'

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
    markers: PropTypes.array,
    onChange: PropTypes.func.isRequired
  }

  render() {
    const {markers, value} = this.props
    return (
      <div>
        <BlockEditor
          {...this.props}
          renderBlockActions={BlockActions}
          renderCustomMarkers={CustomMarkers}
          markers={markers.concat([
            {type: 'customMarkerTest', path: value[0] ? [{_key: value[0]._key}] : []}
          ])}
        />
        <p>
          Your funkyness is <strong>{extractTextFromBlocks(this.props.value).length}</strong>{' '}
          characters long
        </p>
      </div>
    )
  }
}
