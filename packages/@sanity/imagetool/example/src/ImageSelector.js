import PropTypes from 'prop-types'
import React from 'react'
import {StateLink} from '@sanity/state-router'

export default function ImageSelector(props) {
  return (
    <ul style={{margin: 0, padding: 0, listStyle: 'none', clear: 'both'}}>
      {
        props.images.map((image, i) => {
          return (
            <li key={image} style={{display: 'inline-block', padding: 2}}>
              <StateLink state={{imageIndex: i}}>
                <img src={image} style={{verticalAlign: 'middle', width: props.thumbWidth}} />
              </StateLink>
            </li>
          )
        })
      }
    </ul>
  )
}
ImageSelector.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  thumbWidth: PropTypes.number
}
