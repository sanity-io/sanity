import React from 'react'
import PropTypes from 'prop-types'
import ArrowRight from 'part:@sanity/base/arrow-right'
import styles from './Links.css'

function Links(props) {
  const {links} = props
  if (!links) {
    return null
  }

  return (
    <div className={styles.root}>
      {links.map(link => {
        return (
          <h3 className={styles.heading} key={link.title}>
            <div className={styles.link} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.title}
              <span className={styles.icon}>
                <ArrowRight />
              </span>
            </div>
          </h3>
        )
      })}
    </div>
  )
}

Links.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  links: PropTypes.array.isRequired
}

export default Links
