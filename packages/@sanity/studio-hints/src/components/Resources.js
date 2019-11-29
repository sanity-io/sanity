import React from 'react'
import PropTypes from 'prop-types'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './Resources.css'

function Resources(props) {
  const {resources, title} = props
  if (!resources) {
    return null
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.resourceList}>
        {resources.map(link => {
          return (
            <li className={styles.resourceTitle} key={link.title}>
              <a className={styles.link} href={link.url} target="_blank" rel="noopener noreferrer">
                {/* TODO: handle inserting icon */}
                {link.title}
                <span className={styles.externalIcon}>
                  <ArrowRight />
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

Resources.propTypes = {
  title: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  resources: PropTypes.array.isRequired
}

export default Resources
