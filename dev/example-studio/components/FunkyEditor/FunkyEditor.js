import PropTypes from 'prop-types'
import React from 'react'
import {BlockEditor} from 'part:@sanity/form-builder'
import blockTools from '@sanity/block-tools'
import CustomMarkers from './CustomMarkers'
import BlockActions from './BlockActions'

function extractTextFromBlocks(blocks) {
  if (!blocks) {
    return ''
  }
  return blocks
    .filter((val) => val._type === 'block')
    .map((block) => {
      return block.children
        .filter((child) => child._type === 'span')
        .map((span) => span.text)
        .join('')
    })
    .join('')
}

function handlePaste(input) {
  const {event, type, path} = input
  const html = event.clipboardData.getData('text/html')
  // check if schema has the code type
  const hasCodeType = type.of.map(({name}) => name).includes('code')
  if (!hasCodeType) {
    // eslint-disable-next-line no-console
    console.log('Run `sanity install @sanity/code-input, and add `type: "code"` to your schema.')
  }
  if (html && hasCodeType) {
    const blocks = blockTools.htmlToBlocks(html, type, {
      rules: [
        {
          deserialize(el, next, block) {
            /**
             *  `el` and `next` is DOM Elements
             * learn all about them:
             * https://developer.mozilla.org/en-US/docs/Web/API/Element
             **/

            if (!el || !el.children || (el.tagName && el.tagName.toLowerCase() !== 'pre')) {
              return undefined
            }
            const code = el.children[0]
            const childNodes =
              code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
            let text = ''
            childNodes.forEach((node) => {
              text += node.textContent
            })
            /**
             * Return this as an own block (via block helper function),
             * instead of appending it to a default block's children
             */
            return block({
              _type: 'code',
              code: text,
            })
          },
        },
      ],
    })
    // return an insert patch
    return {insert: blocks, path}
  }
  return undefined
}

const FunkyEditor = (props) => {
  const {markers, value} = props
  return (
    <div>
      <BlockEditor
        {...props}
        onPaste={handlePaste}
        renderBlockActions={BlockActions}
        renderCustomMarkers={CustomMarkers}
        markers={markers.concat([
          {type: 'customMarkerTest', path: value && value[0] ? [{_key: value[0]._key}] : []},
        ])}
      />
      <p>
        Text length: <strong>{extractTextFromBlocks(props.value).length}</strong> characters
      </p>
    </div>
  )
}

FunkyEditor.propTypes = {
  type: PropTypes.shape({
    title: PropTypes.string,
  }).isRequired,
  level: PropTypes.number,
  value: PropTypes.arrayOf(PropTypes.any),
  markers: PropTypes.arrayOf(PropTypes.any),
  onChange: PropTypes.func.isRequired,
}

export default FunkyEditor
