import React from 'react'
import PropTypes from 'prop-types'
import LaunchIcon from 'part:@sanity/base/launch-icon'
import styles from './LinksList.css'
import HintCard from './HintCard'

function CardLinks(props) {
  const {type, links, title, repoId} = props
  if (!links) {
    return null
  }

  return (
    <div className={styles.root}>
      <h3 className={styles.listTitle}>{title}</h3>
      <ul
        className={`${styles.linksList} ${type === 'card' ? styles.cardList : styles.simpleList}`}
      >
        {links.map((link) => {
          return type === 'card' ? (
            <HintCard key={link._key} card={link} repoId={repoId} />
          ) : (
            <li className={styles.linkTitle} key={link.title}>
              <a
                className={styles.link}
                href={`${link.url}?utm_source=hints&utm_medium=${repoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* TODO: handle inserting icon */}
                <span className={styles.linkTitleText}>{link.title}</span>
                <span className={styles.externalIcon}>
                  <LaunchIcon />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

CardLinks.propTypes = {
  type: PropTypes.string,
  title: PropTypes.string,
  repoId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  links: PropTypes.array.isRequired,
}

CardLinks.defaultProps = {
  type: null,
  title: '',
}

export default CardLinks
