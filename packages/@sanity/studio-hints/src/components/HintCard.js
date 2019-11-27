import React from 'react'
import PropTypes from 'prop-types'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './HintCard.css'

const resolveSegment = {
  guide: 'guides',
  article: 'docs'
}

function HintCard(props) {
  const {card, onCardClick} = props
  return card._type === 'hint' ? (
    <div className={styles.root} onClick={() => onCardClick(card._id)}>
      <h3 className={styles.cardTitle}>
        {card.title} <ArrowRight />
      </h3>
      <p className={styles.cardSummary}>{card.summary}</p>
    </div>
  ) : (
    <a
      href={`https://sanity.io/${resolveSegment[card._type]}/${card.slug.current}`}
      className={styles.root}
      target="_blank"
      rel="noopener"
    >
      <h3 className={styles.cardTitle}>
        {card.title}
        <span className={styles.arrowUp}>
          <ArrowRight />
        </span>
      </h3>
      <p className={styles.cardSummary}>{card.description}</p>
    </a>
  )
}

HintCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  card: PropTypes.object.isRequired,
  onCardClick: PropTypes.func.isRequired
}

export default HintCard
