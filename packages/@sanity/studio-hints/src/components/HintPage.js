import React from 'react'
import dynamic from 'next/dynamic'
import PropTypes from 'prop-types'
import BlockContent from '@sanity/block-content-to-react'
import styles from './HintPage.css'
import Image from './serializers/Image'
import ArrowRight from 'part:@sanity/base/arrow-right'

const serializers = {
  types: {
    image: (props) => {
      return <Image {...props}/>
    }
  }
}

function HintPage(props) {
  const {hint, onBackClick} = props
  return (
    <div className={styles.root}>
      <button className={styles.backButton} onClick={() => onBackClick(null)}>
        <ArrowRight /> Back
      </button>
      <div className={styles.blockContent}>
        <h2>{hint.title}</h2>
        <BlockContent blocks={hint.body} serializers={serializers}/>
      </div>
    </div>
  )
}

HintPage.propTypes = {
  hint: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired
}

export default HintPage
