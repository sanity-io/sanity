import React from 'react'
import PropTypes from 'prop-types'
import styles from 'part:@sanity/default-layout/branding-style'
import BrandLogo from 'part:@sanity/base/brand-logo?'

function Branding(props) {
  const projectName = props.projectName || 'Sanity'
  const Logo = props.logo || BrandLogo

  return (
    <div className={styles.root} tabIndex={-1}>
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
    </div>
  )
}

Branding.propTypes = {
  logo: PropTypes.instanceOf(React.Component),
  projectName: PropTypes.string
}

Branding.defaultProps = {
  logo: null,
  projectName: undefined
}

export default Branding
