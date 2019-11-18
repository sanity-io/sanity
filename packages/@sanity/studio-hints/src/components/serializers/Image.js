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
  if (props.node.caption) {
    return (
      <figure className={styles.figure}>
        <div className={styles.imageContainer}>
          <img src={urlFor(props.node)} alt={props.node.alt} />
        </div>
        <figcaption className={styles.figcaption}>{props.node.caption}</figcaption>
      </figure>
    )
  }
  return (
    <div className={styles.imageContainer}>
      <img src={urlFor(props.node)} alt={props.node.alt} />
    </div>
  )
}

Image.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  node: PropTypes.object.isRequired
}

export default Image
