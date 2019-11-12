import React from 'react'
import PropTypes from 'prop-types'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './HintCard.css'

function HintCard(props) {
  const {title, summary} = props
  return (
    <div className={styles.root}>
      <a className={styles.link}>
        <h3 className={styles.cardTitle}>
          {title} <ArrowRight />
        </h3>
        <p className={styles.cardSummary}>{summary}</p>
      </a>
    </div>
  )
}

HintCard.propTypes = {
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired
}

export default HintCard
