import React from 'react'
import PropTypes from 'prop-types'
import imageUrlBuilder from '@sanity/image-url'
import sanityClient from '../../client'
import styles from './Image.css'

const builder = imageUrlBuilder(sanityClient)

function urlFor(source) {
  return builder
    .image(source)
    .auto('format')
    .fit('max')
    .url()
}

function Image(props) {
  return (
    <figure className={styles.figure}>
      <div className={styles.imageContainer}>
        <img src={urlFor(props.node)} alt="must have alt" />
      </div>
      <figcaption className={styles.figcaption}>Must have alt</figcaption>
    </figure>
  )
}

Image.propTypes = {
  node: PropTypes.node.isRequired
}

export default Image
