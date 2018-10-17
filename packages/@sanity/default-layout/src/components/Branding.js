import React from 'react'
import styles from 'part:@sanity/default-layout/branding-style'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import {StateLink} from 'part:@sanity/base/router'
import config from 'config:sanity'

function Branding() {
  const projectName = (config.project && config.project.name) || ''
  return (
    <div className={styles.root}>
      <StateLink toIndex className={styles.link} title={projectName}>
        {BrandLogo && (
          <div className={styles.brandLogoContainer}>
            <BrandLogo projectName={projectName} />
          </div>
        )}
        {!BrandLogo && (
          <div>
            <h1 className={styles.projectName}>{projectName}</h1>
          </div>
        )}
      </StateLink>
    </div>
  )
}

export default Branding
