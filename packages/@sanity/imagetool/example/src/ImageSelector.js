import PropTypes from 'prop-types'
import React from 'react'
import Link from './Link'

export default function ImageSelector(props) {
  return (
    <ul style={{margin: 0, padding: 0, listStyle: 'none', clear: 'both'}}>
      {props.images.map((image, i) => {
        return (
          <li key={image} style={{display: 'inline-block', padding: 2}}>
            <Link state={{imageIndex: i}}>
              <img src={image} style={{verticalAlign: 'middle', width: props.thumbWidth}} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
ImageSelector.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  thumbWidth: PropTypes.number,
}
