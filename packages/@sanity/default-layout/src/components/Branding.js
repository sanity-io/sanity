import React from 'react'
import styles from 'part:@sanity/default-layout/branding-style'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import {StateLink} from 'part:@sanity/base/router'
import config from 'config:sanity'

class Branding extends React.PureComponent {
  render() {
    const projectName = (config.project && config.project.name) || ''
    return (
      <div className={styles.root}>
        <StateLink toIndex className={styles.link} title={projectName}>
          <h1 className={BrandLogo ? styles.projectNameHidden : styles.projectName}>{projectName}</h1>
          {
            BrandLogo && (
              <div className={styles.brandLogoContainer}>
                <BrandLogo projectName={projectName} />
              </div>
            )
          }
        </StateLink>
      </div>
    )
  }
}

export default Branding
