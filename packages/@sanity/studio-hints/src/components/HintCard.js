import React from 'react'
import PropTypes from 'prop-types'
import LaunchIcon from 'part:@sanity/base/launch-icon'
import styles from './HintCard.css'
import {resolveUrl} from './utils'

function HintCard(props) {
  const {card, repoId} = props
  /**
   * Hint cards currently only link to external sources.
   * In future iterations a hint card may have it's own page
   * that opens by clicking the card (onCardClick prop), that
   * then renders a page component.
   */
  /*
  <div className={styles.root} onClick={() => onCardClick(card._id)}>
    <h4 className={styles.cardTitle}>
      {card.title} <ArrowRight />
    </h4>
    <p className={styles.cardSummary}>{card.summary}</p>
  </div>
  */
  return (
    <li>
      <a
        href={resolveUrl(card.hint, repoId)}
        className={styles.root}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div>
          <span className={styles.cardTitle}>{card.titleOverride || card.hint.title}</span>
          <p className={styles.cardSummary}>{card.hint.description}</p>
        </div>

        <span className={styles.externalIcon}>
          <LaunchIcon />
        </span>
      </a>
    </li>
  )
}

HintCard.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  card: PropTypes.object.isRequired,
  repoId: PropTypes.string.isRequired,
  // onCardClick: PropTypes.func.isRequired
}

export default HintCard
