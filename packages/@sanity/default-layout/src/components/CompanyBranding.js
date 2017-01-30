import React from 'react'
import styles from './styles/CompanyBranding.css'
import CompanyLogo from 'part:@sanity/base/company-logo?'
import {StateLink} from 'part:@sanity/base/router'
import config from 'config:sanity'

class CompanyBranding extends React.Component {
  render() {
    const projectName = (config.project && config.project.name) || ''
    return (
      <div className={styles.root}>
        <StateLink toIndex className={styles.link} title={projectName}>
          <h1 className={CompanyLogo ? styles.projectNameHidden : styles.projectName}>{projectName}</h1>
          {
            CompanyLogo && (
              <div className={styles.companyLogoContainer}>
                <CompanyLogo projectName={projectName} />
              </div>
            )
          }
        </StateLink>
      </div>
    )
  }
}

export default CompanyBranding
