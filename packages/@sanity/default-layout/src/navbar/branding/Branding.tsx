import React from 'react'
import styles from 'part:@sanity/default-layout/branding-style'
import BrandLogo from 'part:@sanity/base/brand-logo?'

interface Props {
  logo: React.ComponentType<{}>
  projectName: string
}

function Branding(props: Props) {
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

Branding.defaultProps = {
  logo: null,
  projectName: undefined
}

export default Branding
