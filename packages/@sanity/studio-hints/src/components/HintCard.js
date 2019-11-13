import React from 'react'
import PropTypes from 'prop-types'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './HintCard.css'

function HintCard(props) {
  const {card, onCardClick} = props
  return (
    <div className={styles.root} onClick={() => onCardClick(card._id)}>
      <h3 className={styles.cardTitle}>
        {card.title} <ArrowRight />
      </h3>
      <p className={styles.cardSummary}>{card.summary}</p>
    </div>
  )
}

HintCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  card: PropTypes.object.isRequired,
  onCardClick: PropTypes.func.isRequired
}

export default HintCard
