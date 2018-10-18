import React from 'react'
import PropTypes from 'prop-types'
import styles from 'part:@sanity/default-layout/branding-style'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import {StateLink} from 'part:@sanity/base/router'

function Branding(props) {
  const projectName = props.projectName || 'Sanity'
  const Logo = props.logo || BrandLogo

  return (
    <div className={styles.root}>
      <StateLink toIndex className={styles.link} title={projectName}>
        {Logo && (
          <div className={styles.brandLogoContainer}>
            <Logo />
          </div>
        )}
        {!Logo && (
          <div>
            <h1 className={styles.projectName}>{projectName}</h1>
          </div>
        )}
      </StateLink>
    </div>
  )
}

Branding.propTypes = {
  projectName: PropTypes.string
}

export default Branding
